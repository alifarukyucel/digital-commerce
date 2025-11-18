import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.use(authenticate);

router.get('/overview', generalLimiter, analyticsController.getOverview);
router.get('/sales', generalLimiter, analyticsController.getSales);
router.get('/customers', generalLimiter, analyticsController.getCustomers);

export { router as analyticsRoutes };
