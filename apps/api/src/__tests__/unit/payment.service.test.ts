import { PaymentService } from '../../services/payment.service';
import { prisma } from '@commerce/database';
import { ApiError } from '../../middleware/error.middleware';
import Stripe from 'stripe';

jest.mock('@commerce/database');
jest.mock('stripe');

describe('PaymentService Unit Tests', () => {
  let paymentService: PaymentService;
  let mockStripe: jest.Mocked<Stripe>;

  beforeEach(() => {
    mockStripe = {
      checkout: {
        sessions: {
          create: jest.fn(),
        },
      },
      refunds: {
        create: jest.fn(),
      },
    } as any;

    // Mock Stripe constructor
    jest.spyOn(Stripe.prototype, 'checkout', 'get').mockReturnValue(mockStripe.checkout as any);
    jest.spyOn(Stripe.prototype, 'refunds', 'get').mockReturnValue(mockStripe.refunds as any);

    paymentService = new PaymentService();
  });

  describe('createCheckoutSession', () => {
    const checkoutData = {
      productId: 'product-123',
      buyerEmail: 'buyer@example.com',
      buyerName: 'Test Buyer',
    };

    const mockProduct = {
      id: 'product-123',
      userId: 'user-123',
      title: 'Test Product',
      slug: 'test-product',
      description: 'A test product',
      priceCents: 2999,
      currency: 'USD',
      coverImageUrl: 'https://example.com/image.jpg',
      isPublished: true,
      user: {
        id: 'user-123',
        username: 'testuser',
        displayName: 'Test User',
      },
    };

    it('should create Stripe checkout session successfully', async () => {
      (prisma.product.findFirst as jest.Mock).mockResolvedValue(mockProduct);
      (mockStripe.checkout.sessions.create as jest.Mock).mockResolvedValue({
        id: 'session-123',
        url: 'https://checkout.stripe.com/session-123',
      });

      const result = await paymentService.createCheckoutSession(checkoutData);

      expect(result.sessionId).toBe('session-123');
      expect(result.url).toBe('https://checkout.stripe.com/session-123');
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_email: checkoutData.buyerEmail,
          mode: 'payment',
        })
      );
    });

    it('should throw error if product not found', async () => {
      (prisma.product.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        paymentService.createCheckoutSession(checkoutData)
      ).rejects.toThrow(ApiError);
      await expect(
        paymentService.createCheckoutSession(checkoutData)
      ).rejects.toThrow('Product not found');
    });

    it('should apply discount code if valid', async () => {
      const mockDiscount = {
        id: 'discount-123',
        code: 'SAVE50',
        discountType: 'percentage',
        discountValue: 50,
        maxUses: 100,
        usesCount: 10,
        expiresAt: new Date(Date.now() + 86400000), // 1 day from now
        isActive: true,
      };

      (prisma.product.findFirst as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.discountCode.findFirst as jest.Mock).mockResolvedValue(mockDiscount);
      (mockStripe.checkout.sessions.create as jest.Mock).mockResolvedValue({
        id: 'session-123',
        url: 'https://checkout.stripe.com/session-123',
      });

      await paymentService.createCheckoutSession({
        ...checkoutData,
        discountCode: 'SAVE50',
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                unit_amount: 1499, // 50% off of 2999
              }),
            }),
          ]),
        })
      );
    });
  });

  describe('refundOrder', () => {
    const userId = 'user-123';
    const orderId = 'order-123';

    it('should refund order successfully', async () => {
      const mockOrder = {
        id: orderId,
        userId,
        productId: 'product-123',
        status: 'completed',
        stripePaymentIntentId: 'pi_123',
        amountCents: 2999,
      };

      (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order.update as jest.Mock).mockResolvedValue({
        ...mockOrder,
        status: 'refunded',
      });
      (prisma.product.update as jest.Mock).mockResolvedValue({});
      (mockStripe.refunds.create as jest.Mock).mockResolvedValue({
        id: 'refund-123',
        status: 'succeeded',
      });

      const result = await paymentService.refundOrder(orderId, userId);

      expect(result.status).toBe('refunded');
      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
      });
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-123' },
        data: { salesCount: { decrement: 1 } },
      });
    });

    it('should throw error if order not found', async () => {
      (prisma.order.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(paymentService.refundOrder(orderId, userId)).rejects.toThrow(
        ApiError
      );
      await expect(paymentService.refundOrder(orderId, userId)).rejects.toThrow(
        'Order not found'
      );
    });

    it('should throw error if already refunded', async () => {
      const mockOrder = {
        id: orderId,
        userId,
        status: 'refunded',
        stripePaymentIntentId: 'pi_123',
      };

      (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);

      await expect(paymentService.refundOrder(orderId, userId)).rejects.toThrow(
        'Order already refunded'
      );
    });
  });
});
