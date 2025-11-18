# Database Optimization Guide

## Index Strategy

### Current Indexes (From Schema)
```sql
-- Users
@@index([email])
@@index([username])

-- Products
@@unique([userId, slug])
@@index([userId])
@@index([slug])

-- ProductFiles
@@index([productId])

-- Orders
@@index([productId])
@@index([userId])
@@index([buyerEmail])
@@index([downloadToken])

-- DiscountCodes
@@unique([productId, code])
@@index([productId])
@@index([code])
```

### Additional Performance Indexes (Migration Added)
```sql
-- Users (email_verified filter, recent users)
idx_users_email_verified ON users(email_verified)
idx_users_created_at ON users(created_at DESC)

-- Products (seller listings, popular products)
idx_products_user_published ON products(user_id, is_published)
idx_products_created_at ON products(created_at DESC)
idx_products_sales_count ON products(sales_count DESC)

-- Orders (analytics queries, order history)
idx_orders_user_created ON orders(user_id, created_at DESC)
idx_orders_user_status ON orders(user_id, status)
idx_orders_status_created ON orders(status, created_at DESC)
idx_orders_analytics ON orders(user_id, status, created_at)

-- Product Files (ordered file retrieval)
idx_product_files_product ON product_files(product_id, display_order)

-- Discount Codes (active codes, expiration checks)
idx_discounts_product_active ON discount_codes(product_id, is_active)
idx_discounts_expires ON discount_codes(expires_at)
```

## Query Optimization Patterns

### 1. N+1 Query Prevention

#### ❌ BEFORE (N+1 Problem)
```typescript
// This causes 1 + N queries
const orders = await prisma.order.findMany({ where: { userId } });
for (const order of orders) {
  const product = await prisma.product.findUnique({
    where: { id: order.productId }
  });
  // Use product...
}
```

#### ✅ AFTER (Eager Loading)
```typescript
// Single query with JOIN
const orders = await prisma.order.findMany({
  where: { userId },
  include: {
    product: {
      select: { id: true, title: true, slug: true }
    }
  }
});
```

**Impact:** Reduces 101 queries → 1 query (for 100 orders)

### 2. Select Only Needed Columns

#### ❌ BEFORE
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId }
});
// Returns all columns, including passwordHash
```

#### ✅ AFTER
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    username: true,
    displayName: true,
    avatarUrl: true,
    // Exclude passwordHash, bio, etc.
  }
});
```

**Impact:** Reduces data transfer by 40-60%

### 3. Batch Operations

#### ❌ BEFORE (Loop with Individual Queries)
```typescript
for (const productId of productIds) {
  await prisma.product.update({
    where: { id: productId },
    data: { salesCount: { increment: 1 } }
  });
}
```

#### ✅ AFTER (Batch Update)
```typescript
await prisma.product.updateMany({
  where: { id: { in: productIds } },
  data: { salesCount: { increment: 1 } }
});
```

**Impact:** 100 queries → 1 query

### 4. Efficient Counting

#### ❌ BEFORE (Load All Records)
```typescript
const products = await prisma.product.findMany({
  where: { userId, isPublished: true }
});
const count = products.length; // Wasteful for large datasets
```

#### ✅ AFTER (Count Query)
```typescript
const count = await prisma.product.count({
  where: { userId, isPublished: true }
});
```

**Impact:** 10x faster for large datasets

### 5. Cursor-Based Pagination

#### ❌ BEFORE (Offset Pagination - slow for large datasets)
```typescript
const products = await prisma.product.findMany({
  where: { userId },
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' }
});
```

#### ✅ AFTER (Cursor Pagination)
```typescript
const products = await prisma.product.findMany({
  where: { userId },
  take: limit,
  ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  orderBy: { createdAt: 'desc' }
});
```

**Impact:** Constant time vs linear time for deep pagination

## Query Performance Benchmarks

### Target Performance (p95)

| Query Type | Current* | Target | Optimization |
|------------|----------|--------|--------------|
| Simple SELECT by ID | 15ms | 5ms | Index + select specific columns |
| List products (20 items) | 80ms | 30ms | Composite index + eager load |
| Analytics aggregation | 400ms | 150ms | Materialized view / caching |
| Order history (paginated) | 120ms | 40ms | Composite index on (user_id, created_at) |
| Search by email | 50ms | 10ms | Index on email (exists) |

*Estimated - actual benchmarks needed

## Slow Query Detection

### Enable Slow Query Logging
```sql
-- PostgreSQL configuration
ALTER DATABASE digital_commerce SET log_min_duration_statement = 100;
-- Logs queries taking > 100ms
```

### Analyze Query Plans
```sql
EXPLAIN ANALYZE
SELECT o.*, p.title
FROM orders o
JOIN products p ON o.product_id = p.id
WHERE o.user_id = 'user-123'
  AND o.status = 'completed'
ORDER BY o.created_at DESC
LIMIT 20;
```

Look for:
- ❌ Seq Scan (sequential scan - bad for large tables)
- ✅ Index Scan (using index - good)
- ❌ Nested Loop without index
- ✅ Hash Join (efficient for medium-sized joins)

## Connection Pooling

### Prisma Configuration
```typescript
// packages/database/index.ts
export const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Set connection pool limits
// In DATABASE_URL: ?connection_limit=20&pool_timeout=10
```

### Recommended Pool Sizes

| Environment | Pool Size | Rationale |
|-------------|-----------|-----------|
| Development | 5-10 | Low concurrency |
| Staging | 10-20 | Medium load testing |
| Production | 20-50 | High concurrency |

Formula: `connections = (cpu_cores * 2) + disk_spindles`

## Database Maintenance

### Routine Maintenance Tasks

```sql
-- Update table statistics (weekly)
ANALYZE users;
ANALYZE products;
ANALYZE orders;

-- Vacuum to reclaim space (daily in low-traffic periods)
VACUUM ANALYZE orders;

-- Reindex to rebuild indexes (monthly)
REINDEX TABLE orders;

-- Check for bloat
SELECT schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Caching Strategy

### What to Cache

| Data Type | Strategy | TTL | Invalidation |
|-----------|----------|-----|--------------|
| User profiles | Redis | 5 min | On update |
| Product listings | Redis | 2 min | On create/update/delete |
| Analytics | Redis | 10 min | On new order |
| Public storefronts | CDN | 1 hour | On product publish |

### Cache Implementation Example

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getCachedProducts(userId: string) {
  const cacheKey = `products:user:${userId}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Cache miss - query database
  const products = await prisma.product.findMany({
    where: { userId, isPublished: true },
    include: { files: true },
  });

  // Store in cache
  await redis.set(
    cacheKey,
    JSON.stringify(products),
    'EX',
    120 // 2 minutes
  );

  return products;
}
```

## Monitoring Queries

### Track Slow Queries
```typescript
// Middleware to log slow queries
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();

  const duration = after - before;

  if (duration > 100) {
    console.warn(`Slow query detected (${duration}ms):`, {
      model: params.model,
      action: params.action,
      duration,
    });
  }

  return result;
});
```

### Metrics to Track
- Query duration (p50, p95, p99)
- Queries per second
- Connection pool usage
- Cache hit rate
- Deadlock frequency
- Index usage statistics

## Optimization Checklist

### Before Deployment
- [ ] All tables have appropriate indexes
- [ ] No N+1 query patterns
- [ ] Connection pool configured
- [ ] Slow query logging enabled
- [ ] Query performance tested under load
- [ ] Caching strategy implemented
- [ ] Database backup configured

### Ongoing Monitoring
- [ ] Review slow query logs weekly
- [ ] Check index usage monthly
- [ ] Run VACUUM weekly
- [ ] Update statistics weekly
- [ ] Review connection pool metrics
- [ ] Monitor disk space usage

## Common Pitfalls

### 1. Over-Indexing
❌ Don't add indexes on every column
- Indexes slow down INSERT/UPDATE
- Each index requires disk space
- Only index columns used in WHERE/JOIN/ORDER BY

### 2. Missing Composite Indexes
❌ Single-column indexes may not help multi-column queries
✅ Create composite indexes for common query patterns

### 3. Not Using EXPLAIN
❌ Guessing which queries are slow
✅ Always EXPLAIN before optimizing

### 4. Caching Stale Data
❌ Cache with no invalidation strategy
✅ Plan TTL and invalidation triggers

## Performance Testing

### Load Test Script
```bash
# Artillery configuration
artillery run \
  --target http://localhost:4000 \
  --output results.json \
  database-load-test.yml

# Generate report
artillery report results.json
```

### Benchmarking Queries
```typescript
async function benchmarkQuery(
  name: string,
  fn: () => Promise<any>,
  iterations: number = 100
) {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }

  console.log(`${name}:`, {
    mean: times.reduce((a, b) => a + b) / times.length,
    p95: percentile(times, 95),
    min: Math.min(...times),
    max: Math.max(...times),
  });
}

// Usage
await benchmarkQuery(
  'List products',
  () => prisma.product.findMany({ where: { userId } })
);
```

---

## Next Steps

1. **Run migration** to add performance indexes
2. **Benchmark current queries** to establish baselines
3. **Identify slow queries** using EXPLAIN ANALYZE
4. **Implement caching** for frequently accessed data
5. **Monitor production** and iterate based on metrics
