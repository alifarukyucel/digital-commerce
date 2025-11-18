import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { orderService } from '../services/order.service';
import { paymentService } from '../services/payment.service';
import { asyncHandler } from '../middleware/error.middleware';

export class OrderController {
  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await orderService.listOrders(req.userId!, {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      status: req.query.status as string,
      productId: req.query.productId as string,
    });
    res.json(result);
  });

  getOne = asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await orderService.getOrder(req.userId!, req.params.id);
    res.json(order);
  });

  refund = asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await paymentService.refundOrder(req.params.id, req.userId!);
    res.json(order);
  });
}

export const orderController = new OrderController();
