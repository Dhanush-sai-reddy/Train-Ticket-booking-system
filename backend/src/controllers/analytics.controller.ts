import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class AnalyticsController {
    // Aggregate stats for dashboard
    public getDashboardStats = async (req: Request, res: Response) => {
        try {
            const totalBookings = await prisma.booking.count();
            const totalUsers = await prisma.user.count();
            const activeTrains = await prisma.train.count({ where: { active: true } });

            const revenueAgg = await prisma.booking.aggregate({
                _sum: {
                    totalPrice: true
                }
            });

            res.json({
                totalBookings,
                totalUsers,
                activeTrains,
                totalRevenue: revenueAgg._sum.totalPrice || 0
            });
        } catch (error) {
            console.error('Analytics error:', error);
            res.status(500).json({ error: 'Failed to fetch stats' });
        }
    };

    public getRevenueTimeline = async (req: Request, res: Response) => {
        try {
            // Group by date (Prisma `groupBy` allows this on supported DBs)
            const revenue = await prisma.booking.groupBy({
                by: ['travelDate'],
                _sum: {
                    totalPrice: true
                },
                orderBy: {
                    travelDate: 'asc'
                }
            });

            res.json(revenue.map(r => ({
                date: r.travelDate,
                revenue: r._sum.totalPrice
            })));
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch revenue timeline' });
        }
    };
}

export const analyticsController = new AnalyticsController();
