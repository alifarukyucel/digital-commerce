# Digital Commerce Platform Specifications

## Overview
A minimalistic digital product marketplace enabling creators to sell digital goods directly to customers with minimal friction.

---

## Core Features

### 1. Product Management
- **Create/Edit Products**
  - Title, description, price
  - Cover image, product files
  - Custom URL slug
  - Product variants (optional)
  - License key generation (for software)

- **Product Types**
  - Digital downloads (PDFs, ebooks, software)
  - Video courses
  - Memberships/subscriptions
  - License keys

### 2. Storefront
- **Creator Profile**
  - Custom subdomain: `username.platform.com`
  - Profile bio, avatar, social links
  - Product grid/list view

- **Product Page**
  - Preview/description
  - Price display
  - Buy button
  - Social proof (sales count)

### 3. Checkout & Payments
- **Payment Processing**
  - Stripe integration (primary)
  - PayPal (optional)
  - Support multiple currencies

- **Checkout Flow**
  - Email-only (no account required)
  - Payment processing
  - Instant download link delivery

- **Pricing Features**
  - Fixed pricing
  - Pay-what-you-want
  - Discount codes
  - Limited-time offers

### 4. Order Management
- **Buyer Experience**
  - Instant email with download links
  - Purchase receipt
  - Redownload capability (link expires after N days)

- **Seller Dashboard**
  - Sales analytics
  - Revenue tracking
  - Customer list
  - Export sales data

### 5. Authentication
- **Sellers**
  - Email/password signup
  - OAuth (Google, GitHub)
  - Email verification

- **Buyers**
  - No account required for purchase
  - Optional account for purchase history

---

## System Architecture

### High-Level Components
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│   API/BFF    │────▶│  Database   │
│  (React)    │     │  (Node.js)   │     │ (Postgres)  │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  File Storage│
                    │    (S3)      │
                    └──────────────┘
                           │
                    ┌──────────────┐
                    │   Payment    │
                    │   (Stripe)   │
                    └──────────────┘
```

### Tech Stack Recommendations

**Frontend**
- React 18+ with TypeScript
- Next.js (SSR/SSG for storefronts)
- TailwindCSS (minimal styling)
- React Query (server state)
- Zustand (client state)

**Backend**
- Node.js with Express/Fastify
- TypeScript
- Prisma ORM
- PostgreSQL database
- Redis (sessions, caching)

**Infrastructure**
- AWS S3 (file storage)
- CloudFront CDN
- Docker containers
- AWS ECS/Railway/Render

**External Services**
- Stripe (payments)
- SendGrid/Resend (transactional emails)
- Cloudflare (DNS, DDoS protection)

---

## Database Schema

### Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url VARCHAR(500),
  stripe_account_id VARCHAR(100),
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

### Products
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  cover_image_url VARCHAR(500),
  product_type VARCHAR(50), -- download, membership, license
  is_published BOOLEAN DEFAULT false,
  sales_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_slug ON products(slug);
```

### Product Files
```sql
CREATE TABLE product_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(100),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_files_product_id ON product_files(product_id);
```

### Orders
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  user_id UUID REFERENCES users(id), -- seller
  buyer_email VARCHAR(255) NOT NULL,
  buyer_name VARCHAR(100),
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  stripe_payment_intent_id VARCHAR(100),
  status VARCHAR(50), -- pending, completed, refunded, failed
  download_token VARCHAR(100) UNIQUE,
  download_expires_at TIMESTAMP,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_buyer_email ON orders(buyer_email);
CREATE INDEX idx_orders_download_token ON orders(download_token);
```

### Discount Codes
```sql
CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  discount_type VARCHAR(20), -- percentage, fixed
  discount_value INTEGER NOT NULL,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, code)
);

CREATE INDEX idx_discount_codes_product_id ON discount_codes(product_id);
CREATE INDEX idx_discount_codes_code ON discount_codes(code);
```

---

## API Endpoints

### Authentication
```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/verify-email
POST   /api/auth/reset-password
GET    /api/auth/me
```

### Products (Seller)
```
GET    /api/products
POST   /api/products
GET    /api/products/:id
PUT    /api/products/:id
DELETE /api/products/:id
POST   /api/products/:id/files
DELETE /api/products/:id/files/:fileId
PUT    /api/products/:id/publish
```

### Storefront (Public)
```
GET    /api/store/:username
GET    /api/store/:username/:slug
```

### Checkout
```
POST   /api/checkout/create-session
POST   /api/checkout/verify-discount
GET    /api/checkout/success/:orderId
```

### Orders (Seller)
```
GET    /api/orders
GET    /api/orders/:id
POST   /api/orders/:id/refund
GET    /api/orders/export
```

### Downloads (Buyer)
```
GET    /api/download/:token
```

### Analytics
```
GET    /api/analytics/overview
GET    /api/analytics/sales
GET    /api/analytics/customers
```

---

## User Flows

### Seller Flow
1. **Signup** → Verify email → Complete profile
2. **Connect Stripe** → Verify bank account
3. **Create Product** → Upload files → Set price → Publish
4. **Share Link** → Monitor sales → Fulfill orders

### Buyer Flow
1. **Browse Storefront** → Select product
2. **Checkout** → Enter email → Pay
3. **Receive Email** → Download files
4. **Access Downloads** → Re-download within validity period

---

## Security Considerations

### Authentication & Authorization
- Bcrypt password hashing (cost factor: 12)
- JWT tokens (short-lived access, refresh tokens)
- Rate limiting on auth endpoints
- CSRF protection
- Role-based access control (RBAC)

### Payment Security
- PCI compliance via Stripe
- Webhook signature verification
- Idempotency keys for payments
- Prevent duplicate purchases

### File Security
- Signed URLs for downloads (expires in 24h)
- Download token validation
- Download limit enforcement
- File virus scanning (AWS S3 + ClamAV)

### Data Protection
- SQL injection prevention (parameterized queries)
- XSS protection (input sanitization)
- HTTPS only
- Secure headers (Helmet.js)
- GDPR compliance (data export/deletion)

---

## Performance Optimizations

### Caching Strategy
- Redis for session storage
- CDN for static assets and product images
- Database query caching (frequently accessed products)
- API response caching (public storefronts)

### Database Optimization
- Proper indexing on frequently queried columns
- Connection pooling
- Read replicas for analytics queries
- Pagination on list endpoints

### File Delivery
- CloudFront CDN for downloads
- Multipart upload for large files
- Progressive image loading
- Image optimization (WebP format)

---

## Email Templates

### Transaction Emails
1. **Welcome Email** - Account creation
2. **Email Verification** - Confirm email address
3. **Purchase Receipt** - Order confirmation with download links
4. **Product Update** - Notify buyers of file updates
5. **Payout Notification** - Payment received from Stripe

---

## Analytics & Metrics

### Seller Dashboard
- Total revenue (all-time, monthly, weekly)
- Total sales count
- Conversion rate
- Top-selling products
- Revenue by product
- Geographic sales distribution
- Sales timeline chart

### Platform Metrics
- Total users (sellers/buyers)
- Total products
- Total revenue
- Platform fee revenue
- Active sellers (sold in last 30 days)

---

## Deployment Strategy

### Environment Setup
```
Development  → Local + Docker
Staging      → AWS ECS/Render
Production   → AWS ECS/Render + Auto-scaling
```

### CI/CD Pipeline
1. Git push → GitHub Actions trigger
2. Run tests (unit, integration)
3. Build Docker image
4. Push to container registry
5. Deploy to staging
6. Run E2E tests
7. Manual approval
8. Deploy to production
9. Health check monitoring

### Monitoring
- Application logs (Winston/Pino)
- Error tracking (Sentry)
- Performance monitoring (New Relic/Datadog)
- Uptime monitoring (Pingdom/UptimeRobot)
- Database monitoring (AWS RDS insights)

---

## Minimum Viable Product (MVP) Scope

### Phase 1 (MVP)
- User authentication (email/password)
- Product creation (single file, fixed price)
- Basic storefront (profile + products)
- Stripe checkout
- Email delivery of download links
- Basic seller dashboard

### Phase 2
- Multiple files per product
- Discount codes
- Product variants
- Pay-what-you-want pricing
- Analytics dashboard
- Email templates customization

### Phase 3
- Subscriptions/memberships
- License key management
- Affiliate system
- Advanced analytics
- Mobile app (React Native)
- API for third-party integrations

---

## Estimated Effort

**MVP Development**: 8-10 weeks (2 full-stack developers)

| Component           | Effort (weeks) |
|---------------------|----------------|
| Authentication      | 1              |
| Product Management  | 2              |
| Storefront          | 1.5            |
| Checkout/Payments   | 2              |
| File Management     | 1.5            |
| Email System        | 1              |
| Dashboard/Analytics | 1.5            |
| Testing/QA          | 1.5            |

---

## Success Metrics

### Platform Health
- 99.9% uptime
- < 500ms API response time (p95)
- < 2s page load time
- Zero payment failures

### Business Metrics
- Seller activation rate (% who publish a product)
- Average revenue per seller
- Buyer satisfaction (NPS score)
- Platform fee revenue

---

## Future Considerations

- Multi-language support (i18n)
- Mobile applications
- Advanced SEO optimization
- Marketing tools (email campaigns)
- Customer reviews/ratings
- Bundle products
- Upsells/cross-sells
- Webhooks for sellers
- Public API with rate limiting
- White-label solutions for creators
