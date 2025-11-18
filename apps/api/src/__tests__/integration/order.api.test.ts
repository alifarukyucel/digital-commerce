import request from 'supertest';
import express from 'express';
import { orderRoutes } from '../../routes/order.routes';
import { prisma } from '@commerce/database';
import { generateAccessToken } from '../../utils/jwt.utils';

jest.mock('@commerce/database');
jest.mock('../../services/payment.service');

const app = express();
app.use(express.json());
app.use('/api/orders', orderRoutes);

describe('Order API Integration Tests', () => {
  const mockUserId = 'user-123';
  const mockToken = generateAccessToken({
    userId: mockUserId,
    email: 'seller@example.com',
    username: 'seller',
  });

  describe('GET /api/orders', () => {
    it('should list seller orders with pagination', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          userId: mockUserId,
          productId: 'prod-1',
          buyerEmail: 'buyer1@example.com',
          amountCents: 2999,
          status: 'completed',
          createdAt: new Date(),
          product: { id: 'prod-1', title: 'Product 1' },
        },
        {
          id: 'order-2',
          userId: mockUserId,
          productId: 'prod-2',
          buyerEmail: 'buyer2@example.com',
          amountCents: 4999,
          status: 'completed',
          createdAt: new Date(),
          product: { id: 'prod-2', title: 'Product 2' },
        },
      ];

      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);
      (prisma.order.count as jest.Mock).mockResolvedValue(2);

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${mockToken}`)
        .query({ page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body.orders).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should filter by status', async () => {
      (prisma.order.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.order.count as jest.Mock).mockResolvedValue(0);

      await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${mockToken}`)
        .query({ status: 'completed' });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'completed' }),
        })
      );
    });

    it('should filter by product', async () => {
      (prisma.order.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.order.count as jest.Mock).mockResolvedValue(0);

      await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${mockToken}`)
        .query({ productId: 'prod-123' });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ productId: 'prod-123' }),
        })
      );
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/orders');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should get order details', async () => {
      const mockOrder = {
        id: 'order-123',
        userId: mockUserId,
        productId: 'prod-1',
        buyerEmail: 'buyer@example.com',
        amountCents: 2999,
        status: 'completed',
        product: {
          id: 'prod-1',
          title: 'Product 1',
          slug: 'product-1',
        },
      };

      (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);

      const response = await request(app)
        .get('/api/orders/order-123')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('order-123');
      expect(response.body.product.title).toBe('Product 1');
    });

    it('should not allow viewing other seller orders', async () => {
      (prisma.order.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/orders/other-seller-order')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/orders/:id/refund', () => {
    it('should refund order successfully', async () => {
      const mockOrder = {
        id: 'order-123',
        userId: mockUserId,
        status: 'completed',
        stripePaymentIntentId: 'pi_123',
        productId: 'prod-1',
      };

      const { paymentService } = require('../../services/payment.service');
      paymentService.refundOrder = jest.fn().mockResolvedValue({
        ...mockOrder,
        status: 'refunded',
      });

      const response = await request(app)
        .post('/api/orders/order-123/refund')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(paymentService.refundOrder).toHaveBeenCalledWith(
        'order-123',
        mockUserId
      );
    });
  });
});
