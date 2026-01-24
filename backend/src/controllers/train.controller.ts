import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

class TrainController {
    // Get all trains (with basic filtering)
    public getTrains = async (req: Request, res: Response) => {
        try {
            const { source, destination } = req.query;

            // In a real app, we'd query Routes joining Stations.
            // For simplicity/demo specific to trains:
            const trains = await prisma.train.findMany({
                where: {
                    active: true,
                },
                include: {
                    routes: {
                        include: {
                            origin: true,
                            destination: true
                        }
                    }
                }
            });

            res.json(trains);
        } catch (error) {
            console.error('Get trains error:', error);
            res.status(500).json({ error: 'Failed to fetch trains' });
        }
    };

    // Create a train (Admin only usually)
    public createTrain = async (req: Request, res: Response) => {
        try {
            const { name, number, type, totalSeats, amenities } = req.body;

            const train = await prisma.train.create({
                data: {
                    id: crypto.randomUUID(),
                    name,
                    number,
                    type,
                    totalSeats,
                    amenities: amenities || [],
                    active: true
                }
            });

            res.status(201).json(train);
        } catch (error) {
            console.error('Create train error:', error);
            res.status(500).json({ error: 'Failed to create train' });
        }
    };
}

export const trainController = new TrainController();
