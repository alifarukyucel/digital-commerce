# Redis Caching Strategy

## Overview

Comprehensive caching layer using Redis to reduce database load and improve response times.

## Cache Strategy by Component

### Products 📦

| Operation | Cache Key | TTL | Invalidation Trigger |
|-----------|-----------|-----|----------------------|
| List products | `products:user:{userId}:page{n}:limit{m}:status{s}` | 2 min | create, update, delete, publish |
| Get product | `product:{productId}:{userId}` | 5 min | update, delete, file add/remove |
| Storefront products | `storefront:{username}:products` | 10 min | publish, update |

**Invalidation Strategy:**
- On create: Invalidate `products:user:{userId}*`
- On update: Invalidate specific product + list
- On delete: Invalidate specific product + list
- On publish: Invalidate list + storefront

### Analytics 📊

| Operation | Cache Key | TTL | Invalidation Trigger |
|-----------|-----------|-----|----------------------|
| Overview | `analytics:{userId}:overview:{period}` | 10 min | new order |
| Sales timeline | `analytics:{userId}:sales:{period}:{groupBy}` | 15 min | new order |
| Customer insights | `analytics:{userId}:customers` | 30 min | new order |

**Invalidation Strategy:**
- On new completed order: Invalidate `analytics:{userId}*`
- Higher TTL because data changes less frequently

### Storefront 🏪

| Operation | Cache Key | TTL | Invalidation Trigger |
|-----------|-----------|-----|----------------------|
| Creator page | `storefront:{username}` | 10 min | product publish/update |
| Product page | `storefront:{username}:{slug}` | 15 min | product update |

**Invalidation Strategy:**
- On product publish: Invalidate creator's storefront
- On product update: Invalidate specific product page

### Orders 📋

| Operation | Cache Key | TTL | Notes |
|-----------|-----------|-----|-------|
| Order list | Not cached | - | Real-time data required |
| Order details | Not cached | - | Financial data, avoid caching |

**Rationale:** Orders are financial data and should be real-time.

## Cache Service API

### Core Methods

```typescript
// Get from cache
const data = await cacheService.get<ProductType>('key');

// Set in cache
await cacheService.set('key', data, ttl);

// Delete from cache
await cacheService.delete('key');

// Delete by pattern
await cacheService.deletePattern('products:user:123*');

// Get or set (cache-aside pattern)
const data = await cacheService.getOrSet(
  'key',
  async () => fetchFromDatabase(),
  ttl
);
```

### Invalidation Helpers

```typescript
// Invalidate user's products
await cacheService.invalidateUserProducts(userId);

// Invalidate analytics
await cacheService.invalidateAnalytics(userId);

// Invalidate storefront
await cacheService.invalidateStorefront(username);
```

## Performance Impact

### Before Caching (Estimated)

```
API Endpoint          Avg Response Time   DB Queries
─────────────────────────────────────────────────────
GET /products                 80ms             2
GET /analytics/overview      400ms             1 (complex aggregation)
GET /store/:username         100ms             2
GET /analytics/sales         350ms             1 (aggregation)

Total DB Load: 100% (baseline)
```

### After Caching (Projected)

```
API Endpoint          Avg Response Time   DB Queries   Cache Hit Rate
──────────────────────────────────────────────────────────────────────
GET /products                  25ms            0.6          70%
GET /analytics/overview       120ms            0.2          80%
GET /store/:username           30ms            0.3          70%
GET /analytics/sales          100ms            0.2          80%

Total DB Load: 30% (70% reduction) ✅
```

### Expected Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Avg Response Time** | 230ms | 69ms | **-70%** ⚡ |
| **DB Queries/sec** | 100 | 30 | **-70%** ⚡ |
| **Concurrent Users** | 50 | 200+ | **+300%** 🚀 |
| **CPU Usage (DB)** | 60% | 20% | **-67%** ✅ |

## Cache Hit Rate Targets

```
┌────────────────────────────────────────────┐
│  CACHE HIT RATE GOALS                      │
├────────────────────────────────────────────┤
│                                            │
│  Products:     ██████████████░░ 70%        │
│  Analytics:    ████████████████ 80%        │
│  Storefront:   ██████████████░░ 70%        │
│                                            │
│  Overall:      ██████████████░░ 73%        │
│                                            │
└────────────────────────────────────────────┘

Target: 70%+ hit rate
Acceptable: 60%+
Poor: <50%
```

## Monitoring

### Redis Metrics to Track

```typescript
const stats = await cacheService.getStats();

{
  connected: true,
  keysCount: 1247,
  memoryUsed: '12.5M',
  hitRate: 73.2  // percentage
}
```

### Key Metrics

- **Hit Rate:** Percentage of requests served from cache
- **Keys Count:** Number of cached items
- **Memory Used:** Redis memory consumption
- **Eviction Rate:** How often cache is purged
- **Connection Status:** Redis availability

### Alerts

```yaml
Alerts:
  - Hit rate < 50%: Investigate cache keys or TTL
  - Memory > 500MB: Increase Redis memory or reduce TTL
  - Keys > 10,000: Review cache key strategy
  - Connection lost: Fallback to direct DB queries
```

## Cache Key Naming Convention

```
Pattern: {domain}:{entity}:{id}:{params}

Examples:
✅ products:user:abc123:page1:limit20:statusall
✅ product:prod-123:user-456
✅ analytics:user-789:overview:30d
✅ storefront:johndoe:products
✅ analytics:user-abc:sales:7d:day

❌ user_products_123          (inconsistent format)
❌ abc-123-product            (unclear structure)
❌ get_analytics_user_xyz     (verbose, unclear)
```

## Fallback Strategy

### Redis Unavailable

```typescript
try {
  const data = await cacheService.get(key);
  if (data) return data;
} catch (error) {
  console.error('Cache error, falling back to DB:', error);
}

// Always fall back to database
return await fetchFromDatabase();
```

**Behavior:**
- Cache errors logged but not thrown
- Application continues with direct DB access
- Slight performance degradation but no downtime

## Cache Warming

### On Application Start

```typescript
// Pre-populate frequently accessed data
async function warmCache() {
  const popularProducts = await prisma.product.findMany({
    where: { salesCount: { gt: 100 } },
    take: 50,
  });

  for (const product of popularProducts) {
    await cacheService.set(
      `product:${product.id}`,
      product,
      3600 // 1 hour
    );
  }

  console.log('Cache warmed with', popularProducts.length, 'products');
}
```

## Best Practices

### ✅ Do

- Use cache for read-heavy operations
- Set appropriate TTLs (shorter for dynamic data)
- Invalidate cache on updates
- Monitor hit rates
- Use cache-aside pattern (getOrSet)
- Handle cache failures gracefully
- Use consistent key naming

### ❌ Don't

- Cache financial/order data
- Use very long TTLs (>1 hour) for dynamic data
- Cache before validation
- Store sensitive data without encryption
- Rely solely on cache (always fallback to DB)
- Forget to invalidate on updates
- Cache error responses

## Testing Cache

### Unit Tests

```typescript
describe('CacheService', () => {
  it('should get and set values', async () => {
    await cacheService.set('test-key', { foo: 'bar' }, 60);
    const result = await cacheService.get('test-key');
    expect(result).toEqual({ foo: 'bar' });
  });

  it('should return null for missing keys', async () => {
    const result = await cacheService.get('nonexistent');
    expect(result).toBeNull();
  });

  it('should delete keys', async () => {
    await cacheService.set('delete-me', 'value');
    await cacheService.delete('delete-me');
    const result = await cacheService.get('delete-me');
    expect(result).toBeNull();
  });

  it('should delete by pattern', async () => {
    await cacheService.set('user:123:a', 'a');
    await cacheService.set('user:123:b', 'b');
    await cacheService.deletePattern('user:123:*');
    const a = await cacheService.get('user:123:a');
    expect(a).toBeNull();
  });
});
```

### Integration Tests

```typescript
it('should use cache for repeated requests', async () => {
  const spy = jest.spyOn(prisma.product, 'findMany');

  // First request - cache miss
  await productService.listProducts(userId);
  expect(spy).toHaveBeenCalledTimes(1);

  // Second request - cache hit
  await productService.listProducts(userId);
  expect(spy).toHaveBeenCalledTimes(1); // Still 1, used cache

  spy.mockRestore();
});
```

## Production Checklist

- [ ] Redis instance deployed (ElastiCache, Upstash, etc.)
- [ ] Connection pooling configured
- [ ] Monitoring dashboards setup
- [ ] Cache hit rate alerts configured
- [ ] Memory limits set
- [ ] Eviction policy configured (allkeys-lru)
- [ ] Backup/persistence enabled (if needed)
- [ ] Cache key naming documented
- [ ] TTL values tuned based on usage
- [ ] Fallback strategy tested

## Redis Configuration

### Development

```bash
redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

### Production (AWS ElastiCache)

```
Instance: cache.t3.micro (1GB)
Engine: Redis 7.x
Eviction: allkeys-lru
Encryption: At-rest + In-transit
Backups: Daily snapshots
Multi-AZ: Enabled
```

### Connection URL

```bash
# Development
REDIS_URL=redis://localhost:6379

# Production
REDIS_URL=redis://username:password@host:6379/0
```

## Troubleshooting

### High Memory Usage

```bash
# Check largest keys
redis-cli --bigkeys

# Manual cleanup
redis-cli FLUSHDB  # Development only!
```

### Low Hit Rate

1. Check TTL values (too short?)
2. Verify invalidation isn't too aggressive
3. Monitor cache key patterns
4. Check if data is actually reused

### Connection Issues

1. Verify REDIS_URL configuration
2. Check network/firewall rules
3. Verify Redis instance is running
4. Check connection pool settings

## Next Steps

1. **Deploy Redis** instance (ElastiCache/Upstash)
2. **Integrate** cached services into routes
3. **Monitor** hit rates and adjust TTLs
4. **Optimize** based on real usage patterns
5. **Document** cache invalidation flows
