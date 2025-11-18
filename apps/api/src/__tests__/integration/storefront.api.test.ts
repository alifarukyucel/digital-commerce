import request from 'supertest';
import express from 'express';
import { storefrontRoutes } from '../../routes/storefront.routes';
import { prisma } from '@commerce/database';

jest.mock('@commerce/database');

const app = express();
app.use(express.json());
app.use('/api/store', storefrontRoutes);

describe('Storefront API Integration Tests', () => {
  describe('GET /api/store/:username', () => {
    it('should return creator storefront', async () => {
      const mockUser = {
        username: 'creator',
        displayName: 'Creator Name',
        bio: 'Creator bio',
        avatarUrl: 'https://example.com/avatar.jpg',
        products: [
          {
            id: 'prod-1',
            title: 'Product 1',
            slug: 'product-1',
            description: 'Description 1',
            priceCents: 2999,
            currency: 'USD',
            coverImageUrl: 'https://example.com/cover1.jpg',
            productType: 'download',
            isPublished: true,
            salesCount: 10,
            userId: 'user-123',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app).get('/api/store/creator');

      expect(response.status).toBe(200);
      expect(response.body.user.username).toBe('creator');
      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0].title).toBe('Product 1');
    });

    it('should return 404 for non-existent creator', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/store/nonexistent');

      expect(response.status).toBe(404);
    });

    it('should only show published products', async () => {
      const mockUser = {
        username: 'creator',
        displayName: 'Creator',
        products: [
          { id: '1', isPublished: true, title: 'Published' },
          { id: '2', isPublished: false, title: 'Draft' },
        ],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app).get('/api/store/creator');

      // Mock should have been called with isPublished filter
      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            products: expect.objectContaining({
              where: { isPublished: true },
            }),
          }),
        })
      );
    });
  });

  describe('GET /api/store/:username/:slug', () => {
    it('should return product details', async () => {
      const mockProduct = {
        id: 'prod-123',
        title: 'Product Title',
        slug: 'product-slug',
        description: 'Product description',
        priceCents: 2999,
        currency: 'USD',
        coverImageUrl: 'https://example.com/cover.jpg',
        salesCount: 42,
        isPublished: true,
        user: {
          username: 'creator',
          displayName: 'Creator Name',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
      };

      (prisma.product.findFirst as jest.Mock).mockResolvedValue(mockProduct);

      const response = await request(app).get('/api/store/creator/product-slug');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Product Title');
      expect(response.body.user.username).toBe('creator');
      expect(response.body).not.toHaveProperty('files'); // Files should not be exposed
    });

    it('should return 404 for non-existent product', async () => {
      (prisma.product.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/store/creator/nonexistent');

      expect(response.status).toBe(404);
    });

    it('should not show unpublished products', async () => {
      (prisma.product.findFirst as jest.Mock).mockResolvedValue(null);

      await request(app).get('/api/store/creator/draft-product');

      expect(prisma.product.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPublished: true,
          }),
        })
      );
    });
  });
});
