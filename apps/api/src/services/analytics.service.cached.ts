import { prisma } from '@commerce/database';
import { cacheService } from './cache.service';

/**
 * AnalyticsService with Redis caching
 *
 * Cache Strategy:
 * - Overview: 10 minute TTL (frequently accessed)
 * - Sales timeline: 15 minute TTL
 * - Customer insights: 30 minute TTL
 * - Invalidate on new order
 */
export class AnalyticsServiceCached {
  private readonly CACHE_TTL = {
    overview: 600,     // 10 minutes
    sales: 900,        // 15 minutes
    customers: 1800,   // 30 minutes
  };

  async getOverview(userId: string, period: string = '30d') {
    const cacheKey = `analytics:${userId}:overview:${period}`;

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const daysAgo = period === '7d' ? 7 : period === '90d' ? 90 : 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);

        const orders = await prisma.order.findMany({
          where: {
            userId,
            status: 'completed',
            createdAt: { gte: startDate },
          },
        });

        const totalRevenueCents = orders.reduce((sum, o) => sum + o.amountCents, 0);
        const totalSales = orders.length;
        const averageOrderValueCents = totalSales > 0 ? Math.floor(totalRevenueCents / totalSales) : 0;

        return {
          totalRevenueCents,
          totalSales,
          conversionRate: 0,
          averageOrderValueCents,
        };
      },
      this.CACHE_TTL.overview
    );
  }

  async getSalesTimeline(
    userId: string,
    period: string = '30d',
    groupBy: string = 'day'
  ) {
    const cacheKey = `analytics:${userId}:sales:${period}:${groupBy}`;

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const daysAgo = period === '7d' ? 7 : period === '90d' ? 90 : 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);

        const orders = await prisma.order.findMany({
          where: {
            userId,
            status: 'completed',
            createdAt: { gte: startDate },
          },
          orderBy: { createdAt: 'asc' },
        });

        // Group by date
        const grouped = new Map<string, { salesCount: number; revenueCents: number }>();

        orders.forEach((order) => {
          const date = order.createdAt.toISOString().split('T')[0];
          const existing = grouped.get(date) || { salesCount: 0, revenueCents: 0 };
          grouped.set(date, {
            salesCount: existing.salesCount + 1,
            revenueCents: existing.revenueCents + order.amountCents,
          });
        });

        return Array.from(grouped.entries()).map(([date, data]) => ({
          date,
          ...data,
        }));
      },
      this.CACHE_TTL.sales
    );
  }

  async getCustomerInsights(userId: string) {
    const cacheKey = `analytics:${userId}:customers`;

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const orders = await prisma.order.findMany({
          where: { userId, status: 'completed' },
          select: { buyerEmail: true },
        });

        const uniqueCustomers = new Set(orders.map((o) => o.buyerEmail));
        const totalCustomers = uniqueCustomers.size;

        return {
          totalCustomers,
          repeatCustomerRate: 0,
          topCountries: [],
        };
      },
      this.CACHE_TTL.customers
    );
  }

  /**
   * Invalidate analytics cache when new order is created
   */
  async invalidateOnNewOrder(userId: string): Promise<void> {
    await cacheService.invalidateAnalytics(userId);
  }
}

export const analyticsServiceCached = new AnalyticsServiceCached();
