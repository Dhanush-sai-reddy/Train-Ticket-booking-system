import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

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

                // Check if enough seats (Simplified check, ideally check Ticket/Schedule availability)
                if (train.totalSeats < passengers) {
                    throw new Error('Not enough seats available');
                }

                // 2. Calculate Price (Mock calculation)
                const basePrice = 50; // Should fetch from Route
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

                // 4. Update Seat Occupancy (Upsert)
                // Note: Ideally we'd decrement specific availability, here we just record occupancy
                // for analytics
                const dateObj = new Date(travelDate);
                // Time usage for hypertables usually requires a timestamp. using travelDate normally

                // create or update seat occupancy intentionally omitted for brevity in transaction strictly, 
                // but could be added here.

                return newBooking;
            });

            res.status(201).json({ message: 'Booking confirmed', booking });

        } catch (error: any) {
            console.error('Booking error:', error);
            res.status(400).json({ error: error.message || 'Booking failed' });
        }
    };
}

export const bookingController = new BookingController();
