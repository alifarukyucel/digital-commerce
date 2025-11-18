import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.use(authenticate);

router.get('/', generalLimiter, orderController.list);
router.get('/:id', generalLimiter, orderController.getOne);
router.post('/:id/refund', generalLimiter, orderController.refund);

export { router as orderRoutes };
