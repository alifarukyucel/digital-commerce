import sgMail from '@sendgrid/mail';
import { Order } from '@commerce/types';
import { prisma } from '@commerce/database';

export class EmailService {
  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    }
  }

  async sendPurchaseEmail(order: Order | any) {
    const product = await prisma.product.findUnique({
      where: { id: order.productId },
      include: { user: true },
    });

    if (!product) return;

    const downloadUrl = `${process.env.APP_URL}/download/${order.downloadToken}`;

    const msg = {
      to: order.buyerEmail,
      from: process.env.FROM_EMAIL || 'noreply@platform.com',
      subject: `Your purchase: ${product.title}`,
      html: `
        <h1>Thank you for your purchase!</h1>
        <p>You've successfully purchased <strong>${product.title}</strong> from ${product.user.displayName}.</p>
        <p><strong>Download Link:</strong></p>
        <p><a href="${downloadUrl}">${downloadUrl}</a></p>
        <p>This link will expire in ${process.env.DOWNLOAD_LINK_EXPIRY_DAYS || 30} days.</p>
        <p>Order ID: ${order.id}</p>
        <p>Amount: ${(order.amountCents / 100).toFixed(2)} ${order.currency}</p>
      `,
    };

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Email would be sent:', msg);
      } else {
        await sgMail.send(msg);
      }
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }

  async sendWelcomeEmail(email: string, username: string) {
    const msg = {
      to: email,
      from: process.env.FROM_EMAIL || 'noreply@platform.com',
      subject: 'Welcome to Digital Commerce!',
      html: `
        <h1>Welcome, ${username}!</h1>
        <p>Thanks for joining our platform. Start creating and selling your digital products today!</p>
        <p><a href="${process.env.APP_URL}/dashboard">Go to Dashboard</a></p>
      `,
    };

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Email would be sent:', msg);
      } else {
        await sgMail.send(msg);
      }
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }
}

export const emailService = new EmailService();
