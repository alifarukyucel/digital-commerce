import { prisma } from '@commerce/database';
import { ApiError } from '../middleware/error.middleware';
import { storageService } from './storage.service';
import { cacheService } from './cache.service';
import type { CreateProductRequest, UpdateProductRequest, ProductWithFiles } from '@commerce/types';

/**
 * ProductService with Redis caching
 *
 * Cache Strategy:
 * - List products: 2 minute TTL
 * - Individual product: 5 minute TTL
 * - Invalidate on create/update/delete
 */
export class ProductServiceCached {
  private readonly CACHE_TTL = {
    list: 120,      // 2 minutes
    single: 300,    // 5 minutes
    storefront: 600, // 10 minutes
  };

  async createProduct(userId: string, data: CreateProductRequest) {
    // Check if slug is unique for this user
    const existing = await prisma.product.findUnique({
      where: {
        userId_slug: {
          userId,
          slug: data.slug,
        },
      },
    });

    if (existing) {
      throw new ApiError(409, 'CONFLICT', 'Product slug already exists');
    }

    const product = await prisma.product.create({
      data: {
        userId,
        title: data.title,
        slug: data.slug,
        description: data.description,
        priceCents: data.priceCents,
        currency: data.currency || 'USD',
        productType: data.productType,
        coverImageUrl: data.coverImageUrl,
      },
    });

    // Invalidate user's product list cache
    await cacheService.invalidateUserProducts(userId);

    return product;
  }

  async updateProduct(userId: string, productId: string, data: UpdateProductRequest) {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId },
    });

    if (!product) {
      throw new ApiError(404, 'NOT_FOUND', 'Product not found');
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data,
    });

    // Invalidate caches
    await Promise.all([
      cacheService.delete(`product:${productId}`),
      cacheService.invalidateUserProducts(userId),
      product.slug && cacheService.invalidateStorefront(product.slug),
    ]);

    return updated;
  }

  async deleteProduct(userId: string, productId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId },
      include: { files: true },
    });

    if (!product) {
      throw new ApiError(404, 'NOT_FOUND', 'Product not found');
    }

    // Delete all files from S3
    for (const file of product.files) {
      try {
        const key = new URL(file.fileUrl).pathname.substring(1);
        await storageService.deleteFile(key);
      } catch (error) {
        console.error('Failed to delete file:', error);
      }
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    // Invalidate caches
    await Promise.all([
      cacheService.delete(`product:${productId}`),
      cacheService.invalidateUserProducts(userId),
    ]);
  }

  async getProduct(userId: string, productId: string): Promise<ProductWithFiles> {
    const cacheKey = `product:${productId}:${userId}`;

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const product = await prisma.product.findFirst({
          where: { id: productId, userId },
          include: { files: true },
        });

        if (!product) {
          throw new ApiError(404, 'NOT_FOUND', 'Product not found');
        }

        return product as any;
      },
      this.CACHE_TTL.single
    );
  }

  async listProducts(
    userId: string,
    options: { page?: number; limit?: number; status?: string }
  ) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    // Create cache key based on query params
    const cacheKey = `products:user:${userId}:page${page}:limit${limit}:status${options.status || 'all'}`;

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const where: any = { userId };

        if (options.status === 'published') {
          where.isPublished = true;
        } else if (options.status === 'draft') {
          where.isPublished = false;
        }

        const [products, total] = await Promise.all([
          prisma.product.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { files: true },
          }),
          prisma.product.count({ where }),
        ]);

        return {
          products,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      },
      this.CACHE_TTL.list
    );
  }

  async publishProduct(userId: string, productId: string, isPublished: boolean) {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId },
    });

    if (!product) {
      throw new ApiError(404, 'NOT_FOUND', 'Product not found');
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { isPublished },
    });

    // Invalidate caches
    await Promise.all([
      cacheService.delete(`product:${productId}`),
      cacheService.invalidateUserProducts(userId),
    ]);

    return updated;
  }

  async addFile(productId: string, userId: string, file: Express.Multer.File) {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId },
    });

    if (!product) {
      throw new ApiError(404, 'NOT_FOUND', 'Product not found');
    }

    // Upload to S3
    const key = await storageService.uploadFile(file, 'products');
    const fileUrl = storageService.getPublicUrl(key);

    const productFile = await prisma.productFile.create({
      data: {
        productId,
        fileName: file.originalname,
        fileSize: BigInt(file.size),
        fileUrl,
        fileType: file.mimetype,
      },
    });

    // Invalidate product cache
    await cacheService.delete(`product:${productId}:${userId}`);

    return productFile;
  }

  async deleteFile(productId: string, userId: string, fileId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId },
    });

    if (!product) {
      throw new ApiError(404, 'NOT_FOUND', 'Product not found');
    }

    const file = await prisma.productFile.findFirst({
      where: { id: fileId, productId },
    });

    if (!file) {
      throw new ApiError(404, 'NOT_FOUND', 'File not found');
    }

    // Delete from S3
    try {
      const key = new URL(file.fileUrl).pathname.substring(1);
      await storageService.deleteFile(key);
    } catch (error) {
      console.error('Failed to delete file from S3:', error);
    }

    await prisma.productFile.delete({
      where: { id: fileId },
    });

    // Invalidate product cache
    await cacheService.delete(`product:${productId}:${userId}`);
  }
}

export const productServiceCached = new ProductServiceCached();
