import { Router } from 'express';
import { trainController } from '../controllers/train.controller';

const router = Router();

router.get('/', trainController.getTrains);
router.post('/', trainController.createTrain);

export const trainRouter = router;
