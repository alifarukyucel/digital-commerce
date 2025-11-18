import { AnalyticsService } from '../../services/analytics.service';
import { prisma } from '@commerce/database';

jest.mock('@commerce/database');

describe('AnalyticsService Unit Tests', () => {
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    analyticsService = new AnalyticsService();
    jest.clearAllMocks();
  });

  describe('getOverview', () => {
    const userId = 'user-123';

    it('should calculate overview metrics correctly', async () => {
      const mockOrders = [
        { id: '1', amountCents: 2999, status: 'completed', createdAt: new Date() },
        { id: '2', amountCents: 4999, status: 'completed', createdAt: new Date() },
        { id: '3', amountCents: 1999, status: 'completed', createdAt: new Date() },
      ];

      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const result = await analyticsService.getOverview(userId, '30d');

      expect(result.totalRevenueCents).toBe(9997); // 2999 + 4999 + 1999
      expect(result.totalSales).toBe(3);
      expect(result.averageOrderValueCents).toBe(3332); // floor(9997 / 3)
    });

    it('should handle no orders gracefully', async () => {
      (prisma.order.findMany as jest.Mock).mockResolvedValue([]);

      const result = await analyticsService.getOverview(userId, '7d');

      expect(result.totalRevenueCents).toBe(0);
      expect(result.totalSales).toBe(0);
      expect(result.averageOrderValueCents).toBe(0);
    });

    it('should filter by date range', async () => {
      const mockOrders = [
        { id: '1', amountCents: 2999, status: 'completed', createdAt: new Date() },
      ];

      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      await analyticsService.getOverview(userId, '7d');

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId,
          status: 'completed',
          createdAt: expect.objectContaining({
            gte: expect.any(Date),
          }),
        }),
      });
    });
  });

  describe('getSalesTimeline', () => {
    const userId = 'user-123';

    it('should group sales by date', async () => {
      const date1 = new Date('2025-01-01');
      const date2 = new Date('2025-01-02');

      const mockOrders = [
        { id: '1', amountCents: 2999, createdAt: date1, status: 'completed', userId },
        { id: '2', amountCents: 1999, createdAt: date1, status: 'completed', userId },
        { id: '3', amountCents: 4999, createdAt: date2, status: 'completed', userId },
      ];

      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const result = await analyticsService.getSalesTimeline(userId, '30d', 'day');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        date: '2025-01-01',
        salesCount: 2,
        revenueCents: 4998,
      });
      expect(result[1]).toMatchObject({
        date: '2025-01-02',
        salesCount: 1,
        revenueCents: 4999,
      });
    });

    it('should handle empty results', async () => {
      (prisma.order.findMany as jest.Mock).mockResolvedValue([]);

      const result = await analyticsService.getSalesTimeline(userId);

      expect(result).toEqual([]);
    });
  });

  describe('getCustomerInsights', () => {
    it('should count unique customers', async () => {
      const mockOrders = [
        { id: '1', buyerEmail: 'buyer1@example.com', status: 'completed' },
        { id: '2', buyerEmail: 'buyer2@example.com', status: 'completed' },
        { id: '3', buyerEmail: 'buyer1@example.com', status: 'completed' }, // repeat
      ];

      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const result = await analyticsService.getCustomerInsights('user-123');

      expect(result.totalCustomers).toBe(2); // 2 unique emails
    });
  });
});
