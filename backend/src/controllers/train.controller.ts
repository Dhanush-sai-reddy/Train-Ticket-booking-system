import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

class TrainController {
    // Get all trains (with route-based filtering)
    public getTrains = async (req: Request, res: Response) => {
        try {
            const { origin, destination } = req.query;

            const where: any = { active: true };
            const routeFilter: any = {};

            if (origin) routeFilter.originId = origin as string;
            if (destination) routeFilter.destinationId = destination as string;

            const hasRouteFilter = Object.keys(routeFilter).length > 0;

            const trains = await prisma.train.findMany({
                where: hasRouteFilter
                    ? { ...where, routes: { some: routeFilter } }
                    : where,
                include: {
                    routes: {
                        where: hasRouteFilter ? routeFilter : undefined,
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
