import { Router } from 'express';
import { storefrontController } from '../controllers/storefront.controller';
import { generalLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.get('/:username', generalLimiter, storefrontController.getStorefront);
router.get('/:username/:slug', generalLimiter, storefrontController.getProduct);

export { router as storefrontRoutes };
