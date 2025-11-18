import Stripe from 'stripe';
import { prisma } from '@commerce/database';
import { ApiError } from '../middleware/error.middleware';
import { generateDownloadToken } from '../utils/jwt.utils';

export class PaymentService {
  private stripe: Stripe;

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2024-11-20.acacia',
    });
  }

  async createCheckoutSession(data: {
    productId: string;
    buyerEmail: string;
    buyerName?: string;
    discountCode?: string;
  }) {
    const product = await prisma.product.findFirst({
      where: {
        id: data.productId,
        isPublished: true,
      },
      include: {
        user: true,
      },
    });

    if (!product) {
      throw new ApiError(404, 'NOT_FOUND', 'Product not found');
    }

    let finalPrice = product.priceCents;

    // Apply discount if provided
    if (data.discountCode) {
      const discount = await prisma.discountCode.findFirst({
        where: {
          productId: product.id,
          code: data.discountCode,
          isActive: true,
        },
      });

      if (discount) {
        const now = new Date();
        const isValid =
          (!discount.expiresAt || discount.expiresAt > now) &&
          (!discount.maxUses || discount.usesCount < discount.maxUses);

        if (isValid) {
          if (discount.discountType === 'percentage') {
            finalPrice = Math.floor(finalPrice * (1 - discount.discountValue / 100));
          } else {
            finalPrice = Math.max(0, finalPrice - discount.discountValue);
          }
        }
      }
    }

    // Create Stripe checkout session
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: product.currency.toLowerCase(),
            product_data: {
              name: product.title,
              description: product.description || undefined,
              images: product.coverImageUrl ? [product.coverImageUrl] : undefined,
            },
            unit_amount: finalPrice,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/store/${product.user.username}/${product.slug}`,
      customer_email: data.buyerEmail,
      metadata: {
        productId: product.id,
        userId: product.userId,
        buyerEmail: data.buyerEmail,
        buyerName: data.buyerName || '',
        discountCode: data.discountCode || '',
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  async handleSuccessfulPayment(session: Stripe.Checkout.Session) {
    const metadata = session.metadata!;

    // Check if order already exists
    const existingOrder = await prisma.order.findFirst({
      where: { stripePaymentIntentId: session.payment_intent as string },
    });

    if (existingOrder) {
      return existingOrder;
    }

    // Generate download token
    const downloadToken = generateDownloadToken();
    const downloadExpiresAt = new Date();
    downloadExpiresAt.setDate(
      downloadExpiresAt.getDate() + parseInt(process.env.DOWNLOAD_LINK_EXPIRY_DAYS || '30')
    );

    // Create order
    const order = await prisma.order.create({
      data: {
        productId: metadata.productId,
        userId: metadata.userId,
        buyerEmail: metadata.buyerEmail,
        buyerName: metadata.buyerName || null,
        amountCents: session.amount_total || 0,
        currency: session.currency?.toUpperCase() || 'USD',
        stripePaymentIntentId: session.payment_intent as string,
        status: 'completed',
        downloadToken,
        downloadExpiresAt,
      },
    });

    // Increment sales count
    await prisma.product.update({
      where: { id: metadata.productId },
      data: { salesCount: { increment: 1 } },
    });

    // Update discount code usage if applicable
    if (metadata.discountCode) {
      await prisma.discountCode.updateMany({
        where: {
          productId: metadata.productId,
          code: metadata.discountCode,
        },
        data: {
          usesCount: { increment: 1 },
        },
      });
    }

    return order;
  }

  async refundOrder(orderId: string, userId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new ApiError(404, 'NOT_FOUND', 'Order not found');
    }

    if (order.status === 'refunded') {
      throw new ApiError(400, 'ALREADY_REFUNDED', 'Order already refunded');
    }

    if (!order.stripePaymentIntentId) {
      throw new ApiError(400, 'NO_PAYMENT_INTENT', 'No payment intent found');
    }

    // Create refund in Stripe
    await this.stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
    });

    // Update order status
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'refunded' },
    });

    // Decrement sales count
    await prisma.product.update({
      where: { id: order.productId },
      data: { salesCount: { decrement: 1 } },
    });

    return updated;
  }
}

export const paymentService = new PaymentService();
