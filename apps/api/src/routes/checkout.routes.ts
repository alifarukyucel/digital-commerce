import { Router } from 'express';
import { body } from 'express-validator';
import { checkoutController } from '../controllers/checkout.controller';
import { validateRequest } from '../utils/validation.utils';
import { generalLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.post(
  '/create-session',
  generalLimiter,
  [
    body('productId').isUUID(),
    body('buyerEmail').isEmail().normalizeEmail(),
    body('buyerName').optional(),
    body('discountCode').optional(),
  ],
  validateRequest,
  checkoutController.createSession
);

router.post(
  '/verify-discount',
  generalLimiter,
  [
    body('productId').isUUID(),
    body('code').notEmpty(),
  ],
  validateRequest,
  checkoutController.verifyDiscount
);

export { router as checkoutRoutes };
