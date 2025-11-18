# Performance Optimization Guide

## Performance Metrics Baseline

### Current State (S₀) - Estimated
```
⚠️  No benchmarks run yet - these are theoretical estimates

API Performance (p95):
├── Auth Login:           ~150ms  (DB query + bcrypt + JWT)
├── Product List:         ~80ms   (DB query + serialization)
├── Product Create:       ~200ms  (validation + DB insert)
├── File Upload (10MB):   ~3s     (S3 upload + DB update)
├── Checkout Session:     ~300ms  (Stripe API call)
└── Analytics Query:      ~400ms  (aggregation queries)

Database Queries:
├── Simple SELECT:        ~15ms
├── JOIN queries:         ~45ms
├── Aggregations:         ~120ms
└── Full-text search:     N/A (not implemented)

Frontend (Lighthouse):
├── First Contentful Paint:  ~1.2s
├── Time to Interactive:     ~3.5s
├── Largest Contentful Paint: ~2.1s
├── Total Blocking Time:     ~200ms
└── Cumulative Layout Shift:  0.05
```

### Target Performance (Goals)
```
API Performance (p95):
├── Auth Login:           < 100ms  ⚡ -33%
├── Product List:         < 50ms   ⚡ -37%
├── Product Create:       < 150ms  ⚡ -25%
├── File Upload (10MB):   < 2s     ⚡ -33%
├── Checkout Session:     < 200ms  ⚡ -33%
└── Analytics Query:      < 200ms  ⚡ -50%

Database Queries:
├── Simple SELECT:        < 10ms   ⚡ -33%
├── JOIN queries:         < 30ms   ⚡ -33%
├── Aggregations:         < 80ms   ⚡ -33%
└── Connection pool:      20 max

Frontend (Lighthouse 90+):
├── First Contentful Paint:  < 0.9s  ⚡ -25%
├── Time to Interactive:     < 2.5s  ⚡ -29%
├── Largest Contentful Paint: < 1.5s ⚡ -29%
├── Total Blocking Time:     < 150ms ⚡ -25%
└── Performance Score:        > 90
```

## Optimization Opportunities

### 🔴 Critical (High Impact, Low Effort)

#### 1. Database Query Optimization
**Problem:** N+1 queries, missing indexes
```typescript
// BEFORE (N+1 problem)
const orders = await prisma.order.findMany();
for (const order of orders) {
  const product = await prisma.product.findUnique({ where: { id: order.productId } });
}

// AFTER (eager loading)
const orders = await prisma.order.findMany({
  include: { product: true }
});
```
**Impact:** -60% query time

#### 2. Add Redis Caching
**Problem:** Repeated DB queries for same data
```typescript
// Product listings, analytics, user profiles
const cacheKey = `products:user:${userId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const products = await prisma.product.findMany({ where: { userId } });
await redis.set(cacheKey, JSON.stringify(products), 'EX', 300); // 5min TTL
```
**Impact:** -70% for repeated requests

#### 3. Optimize Bundle Size (Frontend)
```bash
# Current: ~450KB (estimated)
# Target: <250KB

# Actions:
- Enable code splitting
- Lazy load routes
- Tree shaking
- Remove unused dependencies
```
**Impact:** -40% initial load time

### 🟡 Important (Medium Impact, Medium Effort)

#### 4. Implement CDN for Static Assets
```
- S3 → CloudFront distribution
- Cache-Control headers
- Gzip/Brotli compression
```
**Impact:** -50% file delivery time

#### 5. Database Connection Pooling
```typescript
// Prisma connection pool configuration
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connection_limit = 20
  pool_timeout = 10
}
```

#### 6. Optimize Images
```typescript
// Next.js Image component
<Image
  src={product.coverImageUrl}
  width={400}
  height={300}
  loading="lazy"
  quality={85}
/>
```

### 🟢 Enhancement (Lower Priority)

#### 7. Background Job Processing
```typescript
// Move email sending to background queue
import { Queue } from 'bullmq';

const emailQueue = new Queue('emails');
await emailQueue.add('send-purchase-email', { orderId });
```

#### 8. Server-Side Caching (Next.js)
```typescript
// Revalidate every 60 seconds
export const revalidate = 60;

export async function getStorefront(username: string) {
  // Cached at edge
}
```

## Performance Testing Suite

### Load Testing with Artillery

```yaml
# performance/load-test.yml
config:
  target: 'http://localhost:4000'
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 20
      name: "Sustained load"
    - duration: 60
      arrivalRate: 50
      name: "Spike test"

scenarios:
  - name: "Auth flow"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "password123"
      - get:
          url: "/api/products"

  - name: "Browse products"
    flow:
      - get:
          url: "/api/store/democreator"
      - get:
          url: "/api/store/democreator/test-product"
```

**Run:** `artillery run performance/load-test.yml`

### Benchmarking Script

```typescript
// performance/benchmark.ts
import axios from 'axios';

async function benchmark(endpoint: string, iterations: number = 100) {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await axios.get(endpoint);
    const end = performance.now();
    times.push(end - start);
  }

  return {
    mean: times.reduce((a, b) => a + b) / times.length,
    p50: percentile(times, 50),
    p95: percentile(times, 95),
    p99: percentile(times, 99),
    min: Math.min(...times),
    max: Math.max(...times),
  };
}
```

## Database Optimization

### Indexing Strategy

```sql
-- Missing indexes (to add)
CREATE INDEX idx_orders_user_id_created_at ON orders(user_id, created_at DESC);
CREATE INDEX idx_products_user_id_published ON products(user_id, is_published);
CREATE INDEX idx_product_files_product_id ON product_files(product_id);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 'xxx';
```

### Query Optimization Checklist

- [ ] Avoid SELECT * (select only needed columns)
- [ ] Use indexes on WHERE/JOIN columns
- [ ] Limit result sets (pagination)
- [ ] Batch operations instead of loops
- [ ] Use database transactions efficiently
- [ ] Monitor slow query log

## Frontend Optimization

### Code Splitting

```typescript
// Lazy load heavy components
const ProductEditor = dynamic(() => import('@/components/ProductEditor'), {
  loading: () => <Spinner />,
  ssr: false,
});
```

### React Performance

```typescript
// Memoize expensive computations
const sortedProducts = useMemo(
  () => products.sort((a, b) => b.createdAt - a.createdAt),
  [products]
);

// Memoize components
const ProductCard = memo(({ product }) => {
  return <div>{product.title}</div>;
});
```

### Bundle Analysis

```bash
# Next.js bundle analyzer
npm install @next/bundle-analyzer
ANALYZE=true npm run build

# Shows:
- Total bundle size
- Largest packages
- Code splitting effectiveness
```

## Monitoring & Alerts

### Performance Monitoring Setup

```typescript
// Add timing instrumentation
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);

    // Alert if slow
    if (duration > 1000) {
      alertSlowRequest(req, duration);
    }
  });

  next();
});
```

### Metrics to Track

- API response times (p50, p95, p99)
- Database query times
- Cache hit rates
- Error rates
- Concurrent users
- Memory usage
- CPU usage

## Optimization Checklist

### Backend
- [ ] Add database indexes
- [ ] Implement Redis caching
- [ ] Enable connection pooling
- [ ] Optimize N+1 queries
- [ ] Add response compression
- [ ] Implement rate limiting
- [ ] Use CDN for file delivery
- [ ] Add health check endpoints

### Frontend
- [ ] Code splitting by route
- [ ] Lazy load images
- [ ] Optimize bundle size
- [ ] Add service worker
- [ ] Enable HTTP/2
- [ ] Minimize main thread work
- [ ] Implement virtual scrolling for long lists
- [ ] Add skeleton loaders

### Infrastructure
- [ ] Enable CDN (CloudFront)
- [ ] Set up monitoring (Datadog/New Relic)
- [ ] Configure auto-scaling
- [ ] Optimize Docker images
- [ ] Set up database read replicas
- [ ] Implement graceful shutdown

## Performance Budget

```
API Response Time (p95):
✅ < 200ms: Excellent
⚠️  200-500ms: Acceptable
❌ > 500ms: Needs optimization

Page Load Time:
✅ < 1.5s: Excellent
⚠️  1.5-3s: Acceptable
❌ > 3s: Needs optimization

Bundle Size:
✅ < 200KB: Excellent
⚠️  200-400KB: Acceptable
❌ > 400KB: Needs optimization
```

## Next Steps

1. **Establish Baselines** - Run benchmarks to get current metrics
2. **Identify Bottlenecks** - Profile slow endpoints/queries
3. **Implement Quick Wins** - Add indexes, Redis caching
4. **Continuous Monitoring** - Set up APM tool
5. **Iterative Improvement** - Optimize based on real usage data
