import { Router } from 'express';
import { downloadController } from '../controllers/download.controller';
import { generalLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.get('/:token', generalLimiter, downloadController.getDownloads);

export { router as downloadRoutes };
