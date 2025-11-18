import { prisma } from '@commerce/database';
import { ApiError } from '../middleware/error.middleware';
import type { CreateDiscountRequest } from '@commerce/types';

export class DiscountService {
  async createDiscount(userId: string, data: CreateDiscountRequest) {
    // Verify product belongs to user
    const product = await prisma.product.findFirst({
      where: { id: data.productId, userId },
    });

    if (!product) {
      throw new ApiError(404, 'NOT_FOUND', 'Product not found');
    }

    // Check if code already exists for this product
    const existing = await prisma.discountCode.findUnique({
      where: {
        productId_code: {
          productId: data.productId,
          code: data.code.toUpperCase(),
        },
      },
    });

    if (existing) {
      throw new ApiError(409, 'CONFLICT', 'Discount code already exists');
    }

    const discount = await prisma.discountCode.create({
      data: {
        productId: data.productId,
        code: data.code.toUpperCase(),
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxUses: data.maxUses,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });

    return discount;
  }

  async listDiscounts(userId: string, productId?: string) {
    const where: any = {
      product: { userId },
    };

    if (productId) {
      where.productId = productId;
    }

    const discounts = await prisma.discountCode.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return discounts;
  }

  async deleteDiscount(userId: string, discountId: string) {
    const discount = await prisma.discountCode.findFirst({
      where: {
        id: discountId,
        product: { userId },
      },
    });

    if (!discount) {
      throw new ApiError(404, 'NOT_FOUND', 'Discount not found');
    }

    await prisma.discountCode.delete({
      where: { id: discountId },
    });
  }
}

export const discountService = new DiscountService();
