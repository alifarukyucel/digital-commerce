import request from 'supertest';
import express from 'express';
import { analyticsRoutes } from '../../routes/analytics.routes';
import { prisma } from '@commerce/database';
import { generateAccessToken } from '../../utils/jwt.utils';

jest.mock('@commerce/database');

const app = express();
app.use(express.json());
app.use('/api/analytics', analyticsRoutes);

describe('Analytics API Integration Tests', () => {
  const mockUserId = 'user-123';
  const mockToken = generateAccessToken({
    userId: mockUserId,
    email: 'seller@example.com',
    username: 'seller',
  });

  describe('GET /api/analytics/overview', () => {
    it('should return revenue overview', async () => {
      const mockOrders = [
        { id: '1', amountCents: 2999, status: 'completed', createdAt: new Date() },
        { id: '2', amountCents: 4999, status: 'completed', createdAt: new Date() },
        { id: '3', amountCents: 1999, status: 'completed', createdAt: new Date() },
      ];

      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const response = await request(app)
        .get('/api/analytics/overview')
        .set('Authorization', `Bearer ${mockToken}`)
        .query({ period: '30d' });

      expect(response.status).toBe(200);
      expect(response.body.totalRevenueCents).toBe(9997);
      expect(response.body.totalSales).toBe(3);
      expect(response.body.averageOrderValueCents).toBe(3332);
    });

    it('should support different time periods', async () => {
      (prisma.order.findMany as jest.Mock).mockResolvedValue([]);

      await request(app)
        .get('/api/analytics/overview')
        .set('Authorization', `Bearer ${mockToken}`)
        .query({ period: '7d' });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/analytics/overview');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/analytics/sales', () => {
    it('should return sales timeline', async () => {
      const date1 = new Date('2025-01-01');
      const date2 = new Date('2025-01-02');

      const mockOrders = [
        { id: '1', amountCents: 2999, createdAt: date1, status: 'completed', userId: mockUserId },
        { id: '2', amountCents: 1999, createdAt: date1, status: 'completed', userId: mockUserId },
        { id: '3', amountCents: 4999, createdAt: date2, status: 'completed', userId: mockUserId },
      ];

      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const response = await request(app)
        .get('/api/analytics/sales')
        .set('Authorization', `Bearer ${mockToken}`)
        .query({ period: '30d', groupBy: 'day' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toMatchObject({
        date: '2025-01-01',
        salesCount: 2,
        revenueCents: 4998,
      });
    });
  });

  describe('GET /api/analytics/customers', () => {
    it('should return customer insights', async () => {
      const mockOrders = [
        { id: '1', buyerEmail: 'buyer1@example.com', status: 'completed' },
        { id: '2', buyerEmail: 'buyer2@example.com', status: 'completed' },
        { id: '3', buyerEmail: 'buyer1@example.com', status: 'completed' },
      ];

      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const response = await request(app)
        .get('/api/analytics/customers')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body.totalCustomers).toBe(2); // 2 unique emails
    });
  });
});
