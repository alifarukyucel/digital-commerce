import { prisma } from '@commerce/database';
import { ApiError } from '../middleware/error.middleware';
import type { StorefrontData } from '@commerce/types';

export class StorefrontService {
  async getStorefront(username: string): Promise<StorefrontData> {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        products: {
          where: { isPublished: true },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            priceCents: true,
            currency: true,
            coverImageUrl: true,
            productType: true,
            salesCount: true,
            createdAt: true,
            updatedAt: true,
            isPublished: true,
            userId: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, 'NOT_FOUND', 'Creator not found');
    }

    return {
      user: {
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
      },
      products: user.products as any,
    };
  }

  async getProduct(username: string, slug: string) {
    const product = await prisma.product.findFirst({
      where: {
        slug,
        isPublished: true,
        user: { username },
      },
      include: {
        user: {
          select: {
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!product) {
      throw new ApiError(404, 'NOT_FOUND', 'Product not found');
    }

    // Don't expose file URLs in public API
    return {
      ...product,
      files: undefined,
    };
  }
}

export const storefrontService = new StorefrontService();
