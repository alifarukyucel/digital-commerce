import request from 'supertest';
import express from 'express';
import { productRoutes } from '../../routes/product.routes';
import { prisma } from '@commerce/database';
import { generateAccessToken } from '../../utils/jwt.utils';

jest.mock('@commerce/database');
jest.mock('../../services/storage.service');

const app = express();
app.use(express.json());
app.use('/api/products', productRoutes);

describe('Product API Integration Tests', () => {
  const mockUserId = 'user-123';
  const mockToken = generateAccessToken({
    userId: mockUserId,
    email: 'test@example.com',
    username: 'testuser',
  });

  describe('GET /api/products', () => {
    it('should list user products with pagination', async () => {
      const mockProducts = [
        {
          id: 'prod-1',
          userId: mockUserId,
          title: 'Product 1',
          slug: 'product-1',
          priceCents: 2999,
          isPublished: true,
          salesCount: 10,
          files: [],
        },
        {
          id: 'prod-2',
          userId: mockUserId,
          title: 'Product 2',
          slug: 'product-2',
          priceCents: 4999,
          isPublished: false,
          salesCount: 0,
          files: [],
        },
      ];

      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.product.count as jest.Mock).mockResolvedValue(2);

      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${mockToken}`)
        .query({ page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body.products).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/products');

      expect(response.status).toBe(401);
    });

    it('should filter by published status', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(0);

      await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${mockToken}`)
        .query({ status: 'published' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isPublished: true }),
        })
      );
    });
  });

  describe('POST /api/products', () => {
    it('should create product successfully', async () => {
      const newProduct = {
        title: 'New Product',
        slug: 'new-product',
        description: 'A new product',
        priceCents: 2999,
        productType: 'download',
      };

      const mockCreatedProduct = {
        id: 'prod-123',
        userId: mockUserId,
        ...newProduct,
        coverImageUrl: null,
        isPublished: false,
        salesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.product.create as jest.Mock).mockResolvedValue(mockCreatedProduct);

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(newProduct);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe(newProduct.title);
      expect(response.body.slug).toBe(newProduct.slug);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ title: 'No Slug' });

      expect(response.status).toBe(400);
    });

    it('should reject duplicate slug', async () => {
      const existingProduct = { id: 'existing', slug: 'duplicate' };
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(existingProduct);

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          title: 'Duplicate',
          slug: 'duplicate',
          priceCents: 1000,
          productType: 'download',
        });

      expect(response.status).toBe(409);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update product', async () => {
      const mockProduct = {
        id: 'prod-123',
        userId: mockUserId,
        title: 'Old Title',
        slug: 'old-title',
      };

      const updatedProduct = { ...mockProduct, title: 'New Title' };

      (prisma.product.findFirst as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.product.update as jest.Mock).mockResolvedValue(updatedProduct);

      const response = await request(app)
        .put('/api/products/prod-123')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ title: 'New Title' });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('New Title');
    });

    it('should not allow updating other user products', async () => {
      (prisma.product.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/products/other-user-product')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ title: 'Hacked' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete product and associated files', async () => {
      const mockProduct = {
        id: 'prod-123',
        userId: mockUserId,
        files: [
          { id: 'file-1', fileUrl: 'https://s3.amazonaws.com/bucket/file1.pdf' },
        ],
      };

      (prisma.product.findFirst as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.product.delete as jest.Mock).mockResolvedValue(mockProduct);

      const response = await request(app)
        .delete('/api/products/prod-123')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(204);
      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: 'prod-123' },
      });
    });
  });

  describe('PUT /api/products/:id/publish', () => {
    it('should publish product', async () => {
      const mockProduct = {
        id: 'prod-123',
        userId: mockUserId,
        isPublished: false,
      };

      (prisma.product.findFirst as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.product.update as jest.Mock).mockResolvedValue({
        ...mockProduct,
        isPublished: true,
      });

      const response = await request(app)
        .put('/api/products/prod-123/publish')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ isPublished: true });

      expect(response.status).toBe(200);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-123' },
        data: { isPublished: true },
      });
    });
  });
});
