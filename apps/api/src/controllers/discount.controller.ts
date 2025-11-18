import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { discountService } from '../services/discount.service';
import { asyncHandler } from '../middleware/error.middleware';

export class DiscountController {
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const discount = await discountService.createDiscount(req.userId!, req.body);
    res.status(201).json(discount);
  });

  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const discounts = await discountService.listDiscounts(
      req.userId!,
      req.query.productId as string
    );
    res.json({ discounts });
  });

  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    await discountService.deleteDiscount(req.userId!, req.params.id);
    res.status(204).send();
  });
}

export const discountController = new DiscountController();
