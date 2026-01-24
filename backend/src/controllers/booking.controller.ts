import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { kafkaService } from '../services/kafka.service';
import { rabbitMQService } from '../services/rabbitmq.service';

const prisma = new PrismaClient();

class BookingController {
    public createBooking = async (req: Request, res: Response) => {
        try {
            const { userId, trainId, routeId, travelDate, ticketClass, passengers } = req.body;

            // Use a transaction to ensure atomicity
            const booking = await prisma.$transaction(async (tx) => {
                // 1. Check train existence and capacity
                const train = await tx.train.findUnique({ where: { id: trainId } });
                if (!train) throw new Error('Train not found');

                // Check if enough seats
                if (train.totalSeats < passengers) {
                    if (train.totalSeats < passengers) {
                        // Send to Waitlist Topic (Kafka)
                        await kafkaService.publish('waitlist-events', {
                            type: 'WAITLIST_REQUEST',
                            userId,
                            trainId,
                            passengers,
                            timestamp: new Date().toISOString()
                        });

                        // Returning null to signal waitlist path outside transaction
                        return null;
                    }
                }

                // 2. Calculate Price (Mock calculation)
                const basePrice = 50;
                const totalPrice = basePrice * passengers;

                // 3. Create Booking
                const newBooking = await tx.booking.create({
                    data: {
                        time: new Date(),
                        id: crypto.randomUUID(),
                        userId,
                        trainId,
                        routeId,
                        travelDate: new Date(travelDate),
                        ticketClass,
                        passengers,
                        totalPrice,
                        status: 'confirmed'
                    }
                });

                return newBooking;
            });

            // Handle Waitlist Response
            if (!booking) {
                return res.status(202).json({
                    message: 'Train is full. Added to waitlist.',
                    status: 'WAITLISTED'
                });
            }

            // 5. Async Process - High Performance Event Streaming
            // Publish to Kafka for Real-time Analytics
            try {
                await kafkaService.publish('booking-events', {
                    event: 'BOOKING_CREATED',
                    bookingId: booking.id,
                    amount: booking.totalPrice,
                    route: booking.routeId,
                    timestamp: new Date().toISOString()
                });
            } catch (kErr) {
                console.error("Kafka publish error (non-blocking):", kErr);
            }

            // 6. Async Task - Reliable Job Queue
            // Send to RabbitMQ for Email Notification
            try {
                await rabbitMQService.sendToQueue('email_notifications', {
                    type: 'BOOKING_CONFIRMATION',
                    bookingId: booking.id,
                    userId: booking.userId,
                    email: 'user@example.com'
                });
            } catch (rErr) {
                console.error("RabbitMQ send error (non-blocking):", rErr);
            }

            res.status(201).json({ message: 'Booking confirmed', booking });

        } catch (error: any) {
            console.error('Booking error:', error);
            res.status(400).json({ error: error.message || 'Booking failed' });
        }
    };
}

export const bookingController = new BookingController();
