import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { kafkaService } from '../services/kafka.service';
import { rabbitMQService } from '../services/rabbitmq.service';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

class BookingController {
    // Get user's bookings
    public getBookings = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.userId!;
            const bookings = await prisma.booking.findMany({
                where: { userId },
                orderBy: { time: 'desc' },
                include: {
                    train: true,
                    route: {
                        include: {
                            origin: true,
                            destination: true
                        }
                    }
                }
            });
            res.json(bookings);
        } catch (error) {
            console.error('Get bookings error:', error);
            res.status(500).json({ error: 'Failed to fetch bookings' });
        }
    };

    // Create a booking
    public createBooking = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.userId!;
            const { trainId, routeId, travelDate, ticketClass, passengers } = req.body;

            const booking = await prisma.$transaction(async (tx) => {
                const train = await tx.train.findUnique({ where: { id: trainId } });
                if (!train) throw new Error('Train not found');

                const route = await tx.route.findUnique({ where: { id: routeId } });
                if (!route) throw new Error('Route not found');

                if (train.totalSeats < passengers) {
                    try {
                        await kafkaService.publish('waitlist-events', {
                            type: 'WAITLIST_REQUEST',
                            userId,
                            trainId,
                            passengers,
                            timestamp: new Date().toISOString()
                        });
                    } catch (err) {
                        console.error("Kafka waitlist error:", err);
                    }
                    return null;
                }

                // Use route base price with class multiplier
                const basePrice = Number(route.basePrice);
                let multiplier = 1;
                if (ticketClass === 'Business') multiplier = 1.5;
                if (ticketClass === 'First') multiplier = 2.5;
                const totalPrice = Math.round(basePrice * multiplier * passengers);

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

            if (!booking) {
                return res.status(202).json({
                    message: 'Train is full. Added to waitlist.',
                    status: 'WAITLISTED'
                });
            }

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

            try {
                await rabbitMQService.sendToQueue('email_notifications', {
                    type: 'BOOKING_CONFIRMATION',
                    bookingId: booking.id,
                    userId: booking.userId
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
