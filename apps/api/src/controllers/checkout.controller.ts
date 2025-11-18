import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { asyncHandler } from '../middleware/error.middleware';

export class CheckoutController {
  createSession = asyncHandler(async (req: Request, res: Response) => {
    const result = await paymentService.createCheckoutSession(req.body);
    res.json(result);
  });

  verifyDiscount = asyncHandler(async (req: Request, res: Response) => {
    // This would validate a discount code
    // Implementation simplified for now
    res.json({ valid: false });
  });
}

export const checkoutController = new CheckoutController();
