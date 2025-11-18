# Deployment Guide

## Quick Start (Development)

### 1. Prerequisites
- Node.js 18+ installed
- PostgreSQL 14+ installed
- Redis installed (optional for development)
- Stripe account (for payments)
- AWS account (for S3) or LocalStack for development

### 2. Clone and Install

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
cp apps/web/.env.local.example apps/web/.env.local

# Edit .env files with your credentials
```

### 3. Configure Environment Variables

**Root `.env` file:**
```bash
# Database
DATABASE_URL=postgresql://commerce:commerce_dev_password@localhost:5432/digital_commerce

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-secret-min-32-characters
REFRESH_TOKEN_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS S3 (or use LocalStack)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_BUCKET_NAME=digital-commerce-files
AWS_REGION=us-east-1

# For LocalStack (development)
# AWS_ENDPOINT=http://localhost:4566
# AWS_S3_FORCE_PATH_STYLE=true

# SendGrid (or use MailHog for dev)
SENDGRID_API_KEY=SG.xxx
FROM_EMAIL=noreply@yourplatform.com

# App URLs
NODE_ENV=development
APP_URL=http://localhost:3000
API_URL=http://localhost:4000
PORT=4000
```

**Frontend `apps/web/.env.local`:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 4. Start Services with Docker

```bash
# Start PostgreSQL, Redis, LocalStack (S3), MailHog
docker-compose up -d

# Wait for services to be ready
docker-compose ps
```

### 5. Setup Database

```bash
# Run Prisma migrations
cd packages/database
npx prisma migrate dev --name init
npx prisma generate

# Seed database with demo data
npm run db:seed
```

### 6. Start Development Servers

```bash
# Start both API and Web (from root)
npm run dev

# Or start individually:
npm run dev:api   # API runs on http://localhost:4000
npm run dev:web   # Web runs on http://localhost:3000
```

### 7. Test the Application

**Demo account credentials (from seed):**
- Email: `demo@example.com`
- Password: `password123`

**Access points:**
- Homepage: http://localhost:3000
- Login: http://localhost:3000/login
- Dashboard: http://localhost:3000/dashboard
- Demo Storefront: http://localhost:3000/store/democreator
- API Health: http://localhost:4000/health
- MailHog UI: http://localhost:8025 (email preview)

---

## Production Deployment

### Option 1: Railway/Render (Easiest)

#### Backend (API)

1. **Create new service** on Railway or Render
2. **Connect GitHub repo**
3. **Set root directory:** `apps/api`
4. **Build command:** `npm install && npm run build`
5. **Start command:** `npm start`
6. **Environment variables:** Add all from `.env.example`

#### Frontend (Web)

1. **Create new static site** on Railway or Render
2. **Connect GitHub repo**
3. **Set root directory:** `apps/web`
4. **Build command:** `npm install && npm run build`
5. **Publish directory:** `.next`
6. **Environment variables:** Add `NEXT_PUBLIC_*` vars

#### Database

- Use Railway PostgreSQL add-on OR
- Use Supabase free tier
- Copy `DATABASE_URL` to API environment

#### Redis

- Use Railway Redis add-on OR
- Use Upstash (free tier)

---

### Option 2: AWS (Full Control)

#### 1. Setup AWS Resources

**S3 Bucket:**
```bash
aws s3 mb s3://digital-commerce-files
aws s3api put-bucket-cors --bucket digital-commerce-files --cors-configuration file://cors.json
```

**RDS PostgreSQL:**
- Create PostgreSQL instance (t3.micro for testing)
- Note down connection string

**ElastiCache Redis:**
- Create Redis cluster (cache.t3.micro)

**ECR (Container Registry):**
```bash
aws ecr create-repository --repository-name digital-commerce-api
aws ecr create-repository --repository-name digital-commerce-web
```

#### 2. Build Docker Images

**API Dockerfile (`apps/api/Dockerfile`):**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/
RUN npm install --workspace=apps/api
COPY apps/api ./apps/api
WORKDIR /app/apps/api
RUN npm run build
EXPOSE 4000
CMD ["npm", "start"]
```

**Web Dockerfile (`apps/web/Dockerfile`):**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/ ./packages/
RUN npm install --workspace=apps/web
COPY apps/web ./apps/web
WORKDIR /app/apps/web
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**Build and push:**
```bash
# Build images
docker build -f apps/api/Dockerfile -t digital-commerce-api .
docker build -f apps/web/Dockerfile -t digital-commerce-web .

# Tag and push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker tag digital-commerce-api:latest <account>.dkr.ecr.us-east-1.amazonaws.com/digital-commerce-api:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/digital-commerce-api:latest
```

#### 3. Deploy to ECS

- Create ECS cluster
- Create task definitions for API and Web
- Create services with load balancers
- Configure auto-scaling

---

### Option 3: DigitalOcean App Platform

1. Connect GitHub repository
2. Create API app:
   - Type: Web Service
   - Source: `apps/api`
   - Build: `npm install && npm run build`
   - Run: `npm start`
3. Create Web app:
   - Type: Static Site
   - Source: `apps/web`
   - Build: `npm install && npm run build`
4. Add managed PostgreSQL database
5. Add environment variables

---

## Post-Deployment Setup

### 1. Configure Stripe Webhooks

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-api-domain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `charge.refunded`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### 2. Setup Custom Domain

**API:**
- Point `api.yourdomain.com` to API server
- Enable SSL

**Web:**
- Point `yourdomain.com` to Web server
- Enable SSL

### 3. Run Database Migrations

```bash
# SSH into API server or use deployment script
cd packages/database
npx prisma migrate deploy
```

### 4. Create Admin User

```bash
# Via API endpoint or database
curl -X POST https://api.yourdomain.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "secure-password",
    "username": "admin",
    "displayName": "Admin"
  }'
```

---

## Monitoring & Maintenance

### Application Logs

**Development:**
```bash
# API logs
npm run dev:api

# Web logs
npm run dev:web
```

**Production:**
- Use service provider logs (Railway, Render)
- OR setup CloudWatch (AWS)
- OR use external service (Datadog, New Relic)

### Error Tracking

1. **Sentry Setup:**
```bash
npm install @sentry/node @sentry/react
```

2. Add to `apps/api/src/index.ts`:
```typescript
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

### Database Backups

**Automated (AWS RDS):**
- Enable automated backups (retention: 7 days)

**Manual:**
```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### Health Checks

- API: `GET /health`
- Setup uptime monitoring (UptimeRobot, Pingdom)

---

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL

# Check Prisma schema
npx prisma db pull
```

### S3 Upload Failures
```bash
# Verify credentials
aws s3 ls s3://digital-commerce-files

# Check CORS configuration
aws s3api get-bucket-cors --bucket digital-commerce-files
```

### Stripe Webhook Not Working
- Verify webhook URL is publicly accessible
- Check webhook secret matches
- Test with Stripe CLI: `stripe listen --forward-to localhost:4000/api/webhooks/stripe`

### Email Not Sending
- Development: Check MailHog at http://localhost:8025
- Production: Verify SendGrid API key and sender verification

---

## Performance Optimization

### 1. Enable CDN for Frontend
- Use Vercel, Netlify, or CloudFront
- Cache static assets

### 2. Database Optimization
```sql
-- Add indexes if needed
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_products_user_published ON products(user_id, is_published);
```

### 3. Redis Caching
```typescript
// Cache product listings
const cached = await redis.get('products:user:' + userId);
if (cached) return JSON.parse(cached);
```

### 4. File Optimization
- Enable CloudFront CDN for S3
- Compress images before upload
- Use WebP format

---

## Security Checklist

- [ ] Change all default secrets
- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable database SSL
- [ ] Regular security updates
- [ ] Backup encryption
- [ ] Environment variables secured
- [ ] SQL injection prevention (Prisma handles this)
- [ ] XSS protection enabled

---

## Scaling

### Horizontal Scaling
- Add more API instances behind load balancer
- Use Redis for session storage
- Separate read/write database replicas

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Enable database connection pooling

---

## Cost Estimation (Monthly)

**Minimal (Development/Testing):**
- Railway Hobby: $5
- Total: **$5/month**

**Small Business:**
- Railway Pro: $20
- PostgreSQL: Included
- S3: ~$1
- SendGrid: $15 (40k emails)
- Total: **~$36/month**

**Growing Business:**
- AWS ECS (2 tasks): $30
- RDS t3.small: $25
- ElastiCache: $15
- S3 + CloudFront: $10
- SendGrid Pro: $90
- Total: **~$170/month**
