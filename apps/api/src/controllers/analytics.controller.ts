import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { analyticsService } from '../services/analytics.service';
import { asyncHandler } from '../middleware/error.middleware';

export class AnalyticsController {
  getOverview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await analyticsService.getOverview(
      req.userId!,
      req.query.period as string
    );
    res.json(data);
  });

  getSales = asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await analyticsService.getSalesTimeline(
      req.userId!,
      req.query.period as string,
      req.query.groupBy as string
    );
    res.json({ data });
  });

  getCustomers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await analyticsService.getCustomerInsights(req.userId!);
    res.json(data);
  });
}

export const analyticsController = new AnalyticsController();
