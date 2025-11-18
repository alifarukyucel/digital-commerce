import { prisma } from '@commerce/database';

export class AnalyticsService {
  async getOverview(userId: string, period: string = '30d') {
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
      conversionRate: 0, // Would need view tracking
      averageOrderValueCents,
    };
  }

  async getSalesTimeline(
    userId: string,
    period: string = '30d',
    groupBy: string = 'day'
  ) {
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
  }

  async getCustomerInsights(userId: string) {
    const orders = await prisma.order.findMany({
      where: { userId, status: 'completed' },
      select: { buyerEmail: true },
    });

    const uniqueCustomers = new Set(orders.map((o) => o.buyerEmail));
    const totalCustomers = uniqueCustomers.size;

    return {
      totalCustomers,
      repeatCustomerRate: 0, // Would need more complex logic
      topCountries: [],
    };
  }
}

export const analyticsService = new AnalyticsService();
