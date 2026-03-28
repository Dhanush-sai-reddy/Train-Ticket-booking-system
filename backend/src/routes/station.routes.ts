import { Router } from 'express';
import { stationController } from '../controllers/station.controller';

const router = Router();

router.get('/', stationController.getStations);

export const stationRouter = router;
