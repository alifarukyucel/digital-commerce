import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../utils/validation.utils';
import { authLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.post(
  '/signup',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('username').isLength({ min: 3, max: 50 }).matches(/^[a-z0-9_-]+$/i),
    body('displayName').optional().isLength({ max: 100 }),
  ],
  validateRequest,
  authController.signup
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validateRequest,
  authController.login
);

router.get('/me', authenticate, authController.getMe);

router.put(
  '/me',
  authenticate,
  [
    body('displayName').optional().isLength({ max: 100 }),
    body('bio').optional().isLength({ max: 500 }),
    body('avatarUrl').optional().isURL(),
  ],
  validateRequest,
  authController.updateProfile
);

router.post('/logout', authenticate, authController.logout);

export { router as authRoutes };
