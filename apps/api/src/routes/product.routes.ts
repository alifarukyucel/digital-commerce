import { Router } from 'express';
import { body, param } from 'express-validator';
import { productController } from '../controllers/product.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../utils/validation.utils';
import { upload } from '../middleware/upload.middleware';
import { uploadLimiter, generalLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', generalLimiter, productController.list);

router.post(
  '/',
  generalLimiter,
  [
    body('title').notEmpty().isLength({ max: 200 }),
    body('slug').notEmpty().matches(/^[a-z0-9-]+$/),
    body('description').optional(),
    body('priceCents').isInt({ min: 0 }),
    body('currency').optional().isLength({ min: 3, max: 3 }),
    body('productType').isIn(['download', 'membership', 'license']),
  ],
  validateRequest,
  productController.create
);

router.get('/:id', generalLimiter, productController.getOne);

router.put(
  '/:id',
  generalLimiter,
  [
    body('title').optional().isLength({ max: 200 }),
    body('slug').optional().matches(/^[a-z0-9-]+$/),
    body('description').optional(),
    body('priceCents').optional().isInt({ min: 0 }),
  ],
  validateRequest,
  productController.update
);

router.delete('/:id', generalLimiter, productController.delete);

router.put(
  '/:id/publish',
  generalLimiter,
  [body('isPublished').isBoolean()],
  validateRequest,
  productController.publish
);

router.post(
  '/:id/files',
  uploadLimiter,
  upload.single('file'),
  productController.uploadFile
);

router.delete('/:id/files/:fileId', generalLimiter, productController.deleteFile);

export { router as productRoutes };
