-- Performance Optimization Migration
-- Adds strategic indexes to improve query performance

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified) WHERE email_verified = true;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_user_published ON products(user_id, is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_sales_count ON products(sales_count DESC);
CREATE INDEX IF NOT EXISTS idx_products_user_slug ON products(user_id, slug);

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_product_created ON orders(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_email ON orders(buyer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC) WHERE status = 'completed';
CREATE INDEX IF NOT EXISTS idx_orders_download_token ON orders(download_token) WHERE download_token IS NOT NULL;

-- Product Files table indexes
CREATE INDEX IF NOT EXISTS idx_product_files_product ON product_files(product_id, display_order);

-- Discount Codes table indexes
CREATE INDEX IF NOT EXISTS idx_discounts_product_active ON discount_codes(product_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_discounts_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discounts_expires ON discount_codes(expires_at) WHERE expires_at IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_analytics ON orders(user_id, status, created_at) WHERE status = 'completed';

-- Add ANALYZE to update statistics
ANALYZE users;
ANALYZE products;
ANALYZE orders;
ANALYZE product_files;
ANALYZE discount_codes;
