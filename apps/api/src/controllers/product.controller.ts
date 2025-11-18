import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { productService } from '../services/product.service';
import { asyncHandler } from '../middleware/error.middleware';

export class ProductController {
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const product = await productService.createProduct(req.userId!, req.body);
    res.status(201).json(product);
  });

  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const product = await productService.updateProduct(
      req.userId!,
      req.params.id,
      req.body
    );
    res.json(product);
  });

  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    await productService.deleteProduct(req.userId!, req.params.id);
    res.status(204).send();
  });

  getOne = asyncHandler(async (req: AuthRequest, res: Response) => {
    const product = await productService.getProduct(req.userId!, req.params.id);
    res.json(product);
  });

  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await productService.listProducts(req.userId!, {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      status: req.query.status as string,
    });
    res.json(result);
  });

  publish = asyncHandler(async (req: AuthRequest, res: Response) => {
    const product = await productService.publishProduct(
      req.userId!,
      req.params.id,
      req.body.isPublished
    );
    res.json(product);
  });

  uploadFile = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file provided' } });
    }

    const file = await productService.addFile(
      req.params.id,
      req.userId!,
      req.file
    );
    res.status(201).json(file);
  });

  deleteFile = asyncHandler(async (req: AuthRequest, res: Response) => {
    await productService.deleteFile(
      req.params.id,
      req.userId!,
      req.params.fileId
    );
    res.status(204).send();
  });
}

export const productController = new ProductController();
