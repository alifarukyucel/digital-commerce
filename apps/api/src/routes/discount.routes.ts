import { Router } from 'express';
import { body } from 'express-validator';
import { discountController } from '../controllers/discount.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../utils/validation.utils';
import { generalLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.use(authenticate);

router.get('/', generalLimiter, discountController.list);

router.post(
  '/',
  generalLimiter,
  [
    body('productId').isUUID(),
    body('code').notEmpty().isLength({ min: 3, max: 50 }),
    body('discountType').isIn(['percentage', 'fixed']),
    body('discountValue').isInt({ min: 1 }),
    body('maxUses').optional().isInt({ min: 1 }),
    body('expiresAt').optional().isISO8601(),
  ],
  validateRequest,
  discountController.create
);

router.delete('/:id', generalLimiter, discountController.delete);

export { router as discountRoutes };
