import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';

const router = Router();

router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/revenue', analyticsController.getRevenueTimeline);

export const analyticsRouter = router;
