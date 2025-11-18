import { Request, Response } from 'express';
import { storefrontService } from '../services/storefront.service';
import { asyncHandler } from '../middleware/error.middleware';

export class StorefrontController {
  getStorefront = asyncHandler(async (req: Request, res: Response) => {
    const data = await storefrontService.getStorefront(req.params.username);
    res.json(data);
  });

  getProduct = asyncHandler(async (req: Request, res: Response) => {
    const product = await storefrontService.getProduct(
      req.params.username,
      req.params.slug
    );
    res.json(product);
  });
}

export const storefrontController = new StorefrontController();
