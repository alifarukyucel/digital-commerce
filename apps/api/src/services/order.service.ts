import { prisma } from '@commerce/database';
import { ApiError } from '../middleware/error.middleware';

export class OrderService {
  async listOrders(
    userId: string,
    options: { page?: number; limit?: number; status?: string; productId?: string }
  ) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (options.status && options.status !== 'all') {
      where.status = options.status;
    }

    if (options.productId) {
      where.productId = options.productId;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrder(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    if (!order) {
      throw new ApiError(404, 'NOT_FOUND', 'Order not found');
    }

    return order;
  }
}

export const orderService = new OrderService();
