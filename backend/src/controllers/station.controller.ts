import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class StationController {
    public getStations = async (req: Request, res: Response) => {
        try {
            const stations = await prisma.station.findMany({
                orderBy: { name: 'asc' }
            });
            res.json(stations);
        } catch (error) {
            console.error('Get stations error:', error);
            res.status(500).json({ error: 'Failed to fetch stations' });
        }
    };
}

export const stationController = new StationController();
