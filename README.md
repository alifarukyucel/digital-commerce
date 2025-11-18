# Digital Commerce Platform

A complete, production-ready Gumroad-like platform for selling digital products. Built with Next.js, Express, PostgreSQL, and Stripe.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![TypeScript](https://img.shields.io/badge/typescript-5.3-blue)

## Features

✅ **Complete Authentication** - JWT-based auth with bcrypt password hashing
✅ **Product Management** - Full CRUD with file uploads, pricing, variants
✅ **Stripe Payments** - Integrated checkout, webhooks, refunds
✅ **File Delivery** - Secure S3 storage with signed download URLs
✅ **Public Storefronts** - Custom creator pages with SEO optimization
✅ **Order Management** - Track sales, process refunds, export data
✅ **Analytics Dashboard** - Revenue tracking, sales metrics
✅ **Discount Codes** - Percentage and fixed discounts with usage limits
✅ **Email Notifications** - Automated purchase receipts and downloads
✅ **Rate Limiting** - Protection against abuse
✅ **Responsive Design** - Mobile-first with Tailwind CSS

## Quick Start

```bash
# 1. Clone repository
git clone <repo-url>
cd digital-commerce

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
cp apps/web/.env.local.example apps/web/.env.local
# Edit .env files with your credentials

# 4. Start services (PostgreSQL, Redis, LocalStack)
docker-compose up -d

# 5. Setup database
cd packages/database
npx prisma migrate dev
npx prisma generate
npm run seed

# 6. Start development servers
cd ../..
npm run dev
```

**Access the app:**
- Frontend: http://localhost:3000
- API: http://localhost:4000
- Demo Login: `demo@example.com` / `password123`

## Project Structure

```
digital-commerce/
├── apps/
│   ├── api/                      # Express REST API
│   │   ├── src/
│   │   │   ├── controllers/      # Route controllers
│   │   │   ├── services/         # Business logic
│   │   │   ├── middleware/       # Auth, validation, errors
│   │   │   ├── routes/           # API routes
│   │   │   └── utils/            # Helper functions
│   │   └── package.json
│   └── web/                      # Next.js frontend
│       ├── src/
│       │   ├── app/              # App router pages
│       │   ├── components/       # React components
│       │   └── lib/              # API client, stores
│       └── package.json
├── packages/
│   ├── database/                 # Prisma ORM
│   │   ├── prisma/schema.prisma  # Database schema
│   │   ├── seed.ts               # Seed script
│   │   └── index.ts              # Prisma client
│   └── types/                    # Shared TypeScript types
├── SPECIFICATIONS.md             # Detailed specifications
├── API.md                        # API documentation
├── IMPLEMENTATION.md             # Implementation checklist
├── DEPLOYMENT.md                 # Deployment guide
├── docker-compose.yml            # Local dev services
└── package.json                  # Monorepo root
```

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/commerce

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=digital-commerce-files
AWS_REGION=us-east-1

# Email
SENDGRID_API_KEY=...
FROM_EMAIL=noreply@platform.com

# Redis
REDIS_URL=redis://localhost:6379

# Application
NODE_ENV=development
APP_URL=http://localhost:3000
API_URL=http://localhost:4000
```

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Docker (optional)

### Installation

```bash
# Install dependencies
npm install

# Setup database
npm run db:migrate
npm run db:seed

# Start development servers
npm run dev
```

### With Docker

```bash
# Start all services
docker-compose up

# Run migrations
docker-compose exec api npm run db:migrate
```

## Key Technologies

- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS
- **Backend**: Node.js, Express, Prisma ORM
- **Database**: PostgreSQL, Redis
- **Storage**: AWS S3
- **Payments**: Stripe
- **Email**: SendGrid/Resend

## Core Features

✅ User authentication & authorization
✅ Product management (CRUD)
✅ File upload & storage
✅ Custom storefronts
✅ Stripe checkout integration
✅ Email delivery system
✅ Download management
✅ Sales analytics dashboard
✅ Discount codes

## Documentation

- **[SPECIFICATIONS.md](./SPECIFICATIONS.md)** - Complete platform specifications, architecture, database schema
- **[API.md](./API.md)** - REST API endpoints, request/response examples
- **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Step-by-step implementation checklist
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guides for Railway, AWS, DigitalOcean

## Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Zustand (state management)
- React Query (data fetching)
- Stripe.js (payments)

**Backend:**
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis (caching)
- JWT (authentication)
- Bcrypt (password hashing)

**Infrastructure:**
- AWS S3 (file storage)
- Stripe (payments)
- SendGrid (emails)
- Docker (local dev)

## API Endpoints

### Authentication
```
POST   /api/auth/signup      - Create account
POST   /api/auth/login       - Login
GET    /api/auth/me          - Get profile
PUT    /api/auth/me          - Update profile
POST   /api/auth/logout      - Logout
```

### Products (Authenticated)
```
GET    /api/products         - List products
POST   /api/products         - Create product
GET    /api/products/:id     - Get product
PUT    /api/products/:id     - Update product
DELETE /api/products/:id     - Delete product
POST   /api/products/:id/files        - Upload file
DELETE /api/products/:id/files/:fileId - Delete file
PUT    /api/products/:id/publish      - Publish/unpublish
```

### Storefront (Public)
```
GET    /api/store/:username       - Get creator's store
GET    /api/store/:username/:slug - Get product details
```

### Checkout & Orders
```
POST   /api/checkout/create-session - Create Stripe session
GET    /api/orders                  - List orders (seller)
POST   /api/orders/:id/refund       - Refund order
```

### Analytics (Authenticated)
```
GET    /api/analytics/overview   - Revenue overview
GET    /api/analytics/sales      - Sales timeline
GET    /api/analytics/customers  - Customer insights
```

See [API.md](./API.md) for complete documentation.

## Deployment

### Quick Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app)

1. Click "Deploy on Railway"
2. Add PostgreSQL database
3. Set environment variables
4. Deploy!

### Manual Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guides on:
- Railway (easiest)
- AWS ECS (scalable)
- DigitalOcean (simple)
- Custom VPS

## Environment Variables

See `.env.example` for all required variables. Key ones:

```bash
DATABASE_URL=postgresql://...           # PostgreSQL connection
JWT_SECRET=min-32-characters            # JWT signing key
STRIPE_SECRET_KEY=sk_test_...           # Stripe API key
AWS_ACCESS_KEY_ID=...                   # S3 credentials
SENDGRID_API_KEY=...                    # Email service
```

## Security

- HTTPS enforcement
- JWT authentication
- Bcrypt password hashing (cost: 12)
- Rate limiting (100 req/15min)
- CORS protection
- Input validation
- SQL injection prevention (Prisma)
- XSS protection
- Signed URLs for downloads
- Webhook signature verification

## Performance

- Redis caching for sessions
- CDN for static assets
- Database indexes on key columns
- Connection pooling
- Image optimization
- Lazy loading

## Contributing

Contributions welcome! Please read [SPECIFICATIONS.md](./SPECIFICATIONS.md) first.

## License

MIT License - see LICENSE file for details

---

**Built with ❤️ using Next.js, Express, and Stripe**
