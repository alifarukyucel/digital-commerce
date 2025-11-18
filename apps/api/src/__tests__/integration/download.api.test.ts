import request from 'supertest';
import express from 'express';
import { downloadRoutes } from '../../routes/download.routes';
import { prisma } from '@commerce/database';

jest.mock('@commerce/database');
jest.mock('../../services/storage.service');

const app = express();
app.use(express.json());
app.use('/api/download', downloadRoutes);

describe('Download API Integration Tests', () => {
  describe('GET /api/download/:token', () => {
    it('should return download links for valid token', async () => {
      const mockOrder = {
        id: 'order-123',
        downloadToken: 'valid-token-123',
        status: 'completed',
        downloadExpiresAt: new Date(Date.now() + 86400000), // 1 day from now
        downloadCount: 0,
        product: {
          title: 'Test Product',
          files: [
            {
              id: 'file-1',
              fileName: 'ebook.pdf',
              fileSize: BigInt(1048576),
              fileUrl: 'https://s3.amazonaws.com/bucket/file.pdf',
            },
          ],
        },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order.update as jest.Mock).mockResolvedValue({
        ...mockOrder,
        downloadCount: 1,
      });

      const { storageService } = require('../../services/storage.service');
      storageService.getSignedUrl = jest
        .fn()
        .mockResolvedValue('https://s3.amazonaws.com/bucket/file.pdf?signature=...');

      const response = await request(app).get('/api/download/valid-token-123');

      expect(response.status).toBe(200);
      expect(response.body.product.title).toBe('Test Product');
      expect(response.body.files).toHaveLength(1);
      expect(response.body.files[0].downloadUrl).toContain('signature');
      expect(response.body.downloadCount).toBe(1);
    });

    it('should reject invalid token', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/download/invalid-token');

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe('Invalid download link');
    });

    it('should reject expired token', async () => {
      const mockOrder = {
        id: 'order-123',
        downloadToken: 'expired-token',
        status: 'completed',
        downloadExpiresAt: new Date(Date.now() - 86400000), // 1 day ago
        downloadCount: 0,
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      const response = await request(app).get('/api/download/expired-token');

      expect(response.status).toBe(410);
      expect(response.body.error.message).toBe('Download link has expired');
    });

    it('should enforce download limit', async () => {
      const mockOrder = {
        id: 'order-123',
        downloadToken: 'limited-token',
        status: 'completed',
        downloadExpiresAt: new Date(Date.now() + 86400000),
        downloadCount: 10, // At limit
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      const response = await request(app).get('/api/download/limited-token');

      expect(response.status).toBe(429);
      expect(response.body.error.message).toBe('Download limit exceeded');
    });

    it('should increment download count', async () => {
      const mockOrder = {
        id: 'order-123',
        downloadToken: 'count-token',
        status: 'completed',
        downloadExpiresAt: new Date(Date.now() + 86400000),
        downloadCount: 5,
        product: {
          title: 'Product',
          files: [{ id: '1', fileName: 'file.pdf', fileUrl: 'https://...' }],
        },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order.update as jest.Mock).mockResolvedValue({
        ...mockOrder,
        downloadCount: 6,
      });

      const { storageService } = require('../../services/storage.service');
      storageService.getSignedUrl = jest.fn().mockResolvedValue('https://...');

      await request(app).get('/api/download/count-token');

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-123' },
        data: { downloadCount: { increment: 1 } },
      });
    });

    it('should reject non-completed orders', async () => {
      const mockOrder = {
        id: 'order-123',
        downloadToken: 'pending-token',
        status: 'pending',
        downloadExpiresAt: new Date(Date.now() + 86400000),
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      const response = await request(app).get('/api/download/pending-token');

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe('Order not completed');
    });
  });
});
