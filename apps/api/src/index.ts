import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/error.middleware';
import { authRoutes } from './routes/auth.routes';
import { productRoutes } from './routes/product.routes';
import { storefrontRoutes } from './routes/storefront.routes';
import { checkoutRoutes } from './routes/checkout.routes';
import { orderRoutes } from './routes/order.routes';
import { downloadRoutes } from './routes/download.routes';
import { analyticsRoutes } from './routes/analytics.routes';
import { discountRoutes } from './routes/discount.routes';
import { webhookRoutes } from './routes/webhook.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:3000',
  credentials: true,
}));

// Webhook routes (before body parsing)
app.use('/api/webhooks', webhookRoutes);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/store', storefrontRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/discounts', discountRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
