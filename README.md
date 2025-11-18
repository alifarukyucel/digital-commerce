# Digital Commerce Platform

A minimalistic Gumroad-like platform for selling digital products.

## Quick Start

See [SPECIFICATIONS.md](./SPECIFICATIONS.md) for complete platform specifications.

## Project Structure (Recommended)

```
digital-commerce/
├── apps/
│   ├── web/                 # Next.js frontend
│   ├── api/                 # Backend API
│   └── admin/              # Admin dashboard (optional)
├── packages/
│   ├── database/           # Prisma schema & migrations
│   ├── ui/                 # Shared UI components
│   ├── config/             # Shared configs (ESLint, TS)
│   └── types/              # Shared TypeScript types
├── docs/                   # Documentation
├── docker-compose.yml      # Local development setup
└── package.json           # Monorepo root
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

## API Documentation

API documentation available at `/api/docs` when running in development mode.

## Testing

```bash
# Run all tests
npm test

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## Deployment

### Production Build

```bash
npm run build
npm run start
```

### Docker Deployment

```bash
docker build -t commerce-platform .
docker run -p 3000:3000 commerce-platform
```

## Security

- All endpoints use HTTPS
- CSRF protection enabled
- Rate limiting on all routes
- Input validation & sanitization
- SQL injection prevention
- XSS protection
- Secure file downloads with signed URLs

## Contributing

See [SPECIFICATIONS.md](./SPECIFICATIONS.md) for detailed platform architecture and implementation guidelines.

## License

MIT
