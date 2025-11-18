# Testing Strategy & Metrics

## Test Coverage Goals

```
Target: 85% coverage across all metrics
Current: 0% → Target: 85%

Priority Coverage:
1. Critical business logic (auth, payments, orders): 95%+
2. API endpoints: 90%+
3. Utilities and helpers: 80%+
4. UI components: 75%+
```

## Testing Pyramid

```
     E2E Tests (10%)
    ─────────────
   Integration Tests (30%)
  ─────────────────────────
 Unit Tests (60%)
──────────────────────────────

Unit: Fast, isolated, mocked dependencies
Integration: API endpoints with mocked external services
E2E: Full user flows (Playwright/Cypress)
```

## Backend Testing (API)

### Unit Tests
**Location:** `apps/api/src/__tests__/unit/`

**Coverage:**
- ✅ Password utilities (hashing, comparison)
- ✅ JWT utilities (generation, verification)
- ✅ Validation utilities (slug validation, generation)
- ✅ Auth service (signup, login, profile)
- ✅ Product service (CRUD operations)
- 🔄 Payment service (Stripe integration)
- 🔄 Order service (order management)
- 🔄 Analytics service (metrics calculation)
- 🔄 Email service (template rendering)

### Integration Tests
**Location:** `apps/api/src/__tests__/integration/`

**Coverage:**
- ✅ Auth API endpoints (signup, login)
- 🔄 Product API endpoints (CRUD, file upload)
- 🔄 Checkout API endpoints (session creation)
- 🔄 Order API endpoints (list, refund)
- 🔄 Analytics API endpoints (overview, sales)
- 🔄 Storefront API endpoints (public access)

### Test Commands
```bash
# Run all tests with coverage
npm test

# Watch mode during development
npm run test:watch

# Only unit tests (fast)
npm run test:unit

# Only integration tests
npm run test:integration

# View HTML coverage report
open coverage/lcov-report/index.html
```

## Frontend Testing (Web)

### Component Tests
**Location:** `apps/web/src/__tests__/`

**Coverage:**
- 🔄 Authentication forms (login, signup)
- 🔄 Product components (card, form, list)
- 🔄 Dashboard components
- 🔄 Storefront pages

### E2E Tests
**Location:** `apps/web/e2e/`

**User Flows:**
- 🔄 Complete signup → create product → publish
- 🔄 Browse storefront → purchase → download
- 🔄 Seller dashboard → view analytics
- 🔄 Create discount code → apply at checkout

### Test Commands
```bash
# Component tests
npm test --workspace=apps/web

# E2E tests
npm run test:e2e --workspace=apps/web
```

## Test Metrics Dashboard

### Current State (S₀)
```
Backend API:
├── Unit Tests:        6/40  (15% of target)
├── Integration Tests: 1/15  (7% of target)
├── Line Coverage:     ~18%  (target: 85%)
├── Branch Coverage:   ~15%  (target: 70%)
└── Function Coverage: ~20%  (target: 70%)

Frontend Web:
├── Component Tests:   0/25  (0%)
├── E2E Tests:         0/8   (0%)
├── Coverage:          0%    (target: 75%)
└── Visual Tests:      0%    (target: 50%)

Integration:
├── API Tests:         1/15  (7%)
└── E2E Flows:         0/8   (0%)
```

### Target State (Goal)
```
Backend API:
├── Unit Tests:        40/40  (100%)
├── Integration Tests: 15/15  (100%)
├── Line Coverage:     87%    ✅
├── Branch Coverage:   78%    ✅
└── Function Coverage: 82%    ✅

Frontend Web:
├── Component Tests:   25/25  (100%)
├── E2E Tests:         8/8    (100%)
├── Coverage:          76%    ✅
└── Visual Tests:      12/24  (50%)

Integration:
├── API Tests:         15/15  (100%)
└── E2E Flows:         8/8    (100%)
```

## Performance Testing

### Load Tests
**Tool:** Artillery / k6

```yaml
# artillery.yml
scenarios:
  - duration: 60
    arrivalRate: 10
    name: "Steady load"
  - duration: 120
    arrivalRate: 50
    name: "High load"
```

### Benchmarks
```
Target Performance (p95):
- API Response Time:     < 200ms
- Database Queries:      < 50ms
- File Upload (10MB):    < 2s
- Page Load Time:        < 1.5s
- Time to Interactive:   < 3s
```

### Current Metrics (S₀)
```
❓ No baselines established
→ Need to run performance suite
```

## Security Testing

### Automated Scans
```bash
# Dependency vulnerabilities
npm audit --audit-level=moderate

# Code security issues
npm run security-scan

# OWASP Top 10 checks
npm run security-test
```

### Penetration Testing Checklist
- [ ] SQL Injection attempts
- [ ] XSS payload injection
- [ ] CSRF token bypass
- [ ] Authentication bypass
- [ ] Authorization escalation
- [ ] Rate limit bypass
- [ ] File upload exploits
- [ ] API abuse patterns

## Mutation Testing

**Tool:** Stryker

Tests the quality of your tests by introducing bugs.

```bash
npm run test:mutation
```

**Target:** 70% mutation score

## Continuous Integration

### GitHub Actions Workflow
```yaml
on: [push, pull_request]
jobs:
  test:
    - Run unit tests
    - Run integration tests
    - Generate coverage report
    - Upload to Codecov
    - Fail if coverage < 70%
```

## Test Data Management

### Fixtures
**Location:** `apps/api/src/__tests__/fixtures/`

```typescript
export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  username: 'testuser',
};

export const mockProduct = {
  id: 'product-123',
  title: 'Test Product',
  priceCents: 2999,
};
```

### Database Seeding (Tests)
```typescript
beforeEach(async () => {
  await clearDatabase();
  await seedTestData();
});
```

## Quality Gates

**Prevent Merging If:**
- ❌ Any test fails
- ❌ Coverage drops below 70%
- ❌ New code has < 80% coverage
- ❌ Performance regresses > 10%
- ❌ Security vulnerabilities found

## Next Steps

1. **Immediate:** Complete unit test coverage for all services
2. **Short-term:** Add integration tests for all API endpoints
3. **Medium-term:** Implement E2E test suite
4. **Long-term:** Mutation testing + performance regression suite
