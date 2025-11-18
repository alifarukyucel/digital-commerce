# E2E Testing Guide

**Digital Commerce Platform - End-to-End Testing with Playwright**

This document provides comprehensive guidance on running and maintaining E2E tests for the digital commerce platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Test Fixtures](#test-fixtures)
6. [Helper Functions](#helper-functions)
7. [Best Practices](#best-practices)
8. [Debugging](#debugging)
9. [CI/CD Integration](#cicd-integration)

---

## Overview

### What is E2E Testing?

End-to-End (E2E) testing validates the entire application flow from a user's perspective, testing the frontend, backend, database, and integrations together. Our E2E tests use **Playwright**, a modern browser automation framework.

### Test Coverage

Our E2E test suite covers:

- ✅ **User Authentication** - Signup, login, logout, session persistence
- ✅ **Product Management** - Create, edit, publish, delete products
- ✅ **Storefront** - Public product browsing, product detail pages
- ✅ **Purchase Flow** - Checkout initiation, Stripe integration
- ✅ **Complete User Journeys** - End-to-end workflows spanning multiple features
- ✅ **Analytics** - Sales tracking, revenue calculations

### Test Statistics

| Metric | Value |
|--------|-------|
| **Total E2E Tests** | 40+ tests |
| **Test Suites** | 4 suites |
| **Browser Coverage** | Chrome, Firefox, Safari |
| **Mobile Coverage** | iOS, Android |
| **Avg Test Duration** | 3-5 seconds per test |
| **Full Suite Duration** | ~8-12 minutes |

---

## Test Structure

```
e2e/
├── fixtures.ts           # Test fixtures and authenticated contexts
├── helpers.ts            # Helper functions for common operations
├── auth.spec.ts          # Authentication flow tests (10 tests)
├── products.spec.ts      # Product management tests (11 tests)
├── storefront.spec.ts    # Storefront and purchase tests (13 tests)
└── journey.spec.ts       # Complete user journey tests (4 tests)
```

### Test Organization

Tests are organized by feature domain:

1. **auth.spec.ts** - Isolated authentication tests
2. **products.spec.ts** - Creator product management workflows
3. **storefront.spec.ts** - Buyer-facing storefront and checkout
4. **journey.spec.ts** - Multi-step user journeys (signup → purchase → analytics)

---

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Run All Tests

```bash
# Run all E2E tests (headless mode)
npm run test:e2e

# Run with UI mode (recommended for development)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed
```

### Run Specific Tests

```bash
# Run single test file
npx playwright test e2e/auth.spec.ts

# Run tests matching a pattern
npx playwright test -g "should sign up"

# Run tests in a specific browser
npx playwright test --project=chromium

# Run tests in debug mode
npx playwright test --debug
```

### View Test Reports

```bash
# Open HTML report
npx playwright show-report

# Report is automatically generated after test run
```

---

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from './fixtures';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Arrange - Set up test data
    await page.goto('/some-page');

    // Act - Perform actions
    await page.click('button');

    // Assert - Verify results
    await expect(page.locator('h1')).toContainText('Expected Text');
  });
});
```

### Using Authenticated Fixtures

```typescript
test('should access protected route', async ({ authenticatedPage }) => {
  // authenticatedPage is already logged in
  await authenticatedPage.goto('/dashboard');

  // User ID and token are attached
  console.log(authenticatedPage.userId);
  console.log(authenticatedPage.accessToken);
});
```

### Using Creator/Buyer Fixtures

```typescript
test('creator and buyer interaction', async ({ creatorPage, buyerPage }) => {
  // creatorPage - authenticated creator user
  // buyerPage - authenticated buyer user

  // Creator creates product
  await creatorPage.goto('/dashboard/products/new');
  // ...

  // Buyer browses and purchases
  await buyerPage.goto(`/${creatorPage.username}`);
  // ...
});
```

### Using API Client

```typescript
test('should create via API', async ({ apiClient, authenticatedPage }) => {
  // Make authenticated API calls
  const product = await apiClient.request('POST', '/api/products', {
    token: authenticatedPage.accessToken,
    body: {
      title: 'Test Product',
      description: 'Description',
      priceCents: 2999,
    },
  });

  expect(product.product.id).toBeDefined();
});
```

---

## Test Fixtures

### Available Fixtures

| Fixture | Type | Description |
|---------|------|-------------|
| `page` | Page | Standard Playwright page (unauthenticated) |
| `authenticatedPage` | AuthenticatedPage | Page with logged-in user |
| `creatorPage` | AuthenticatedPage | Page with creator user |
| `buyerPage` | AuthenticatedPage | Page with buyer user |
| `apiClient` | APIClient | Direct backend API calls |

### Authenticated Page Properties

```typescript
type AuthenticatedPage = Page & {
  accessToken: string;   // JWT access token
  userId: string;        // User ID
  userEmail: string;     // User email
  username: string;      // Username
};
```

### Custom Test Data

```typescript
import { TEST_USERS, TEST_PRODUCT } from './fixtures';

// Use predefined test data
const creator = TEST_USERS.creator;
const product = TEST_PRODUCT;
```

---

## Helper Functions

### Navigation Helpers

```typescript
import {
  goToDashboard,
  goToCreateProduct,
  goToStorefront,
  waitForNavigation,
} from './helpers';

// Navigate to dashboard
await goToDashboard(page);

// Navigate to product creation
await goToCreateProduct(page);

// Navigate to storefront
await goToStorefront(page, 'username');

// Wait for URL change
await waitForNavigation(page, /\/dashboard/);
```

### Form Helpers

```typescript
import {
  fillSignupForm,
  fillLoginForm,
  fillProductForm,
} from './helpers';

// Fill signup form
await fillSignupForm(page, {
  email: 'user@test.com',
  username: 'user123',
  password: 'Password123!',
});

// Fill product form
await fillProductForm(page, {
  title: 'Product Title',
  description: 'Product description',
  price: '29.99',
});
```

### Product Helpers

```typescript
import {
  createProduct,
  publishProduct,
  uploadProductFile,
  findProductByTitle,
} from './helpers';

// Create product via API
const product = await createProduct(accessToken, {
  title: 'Test Product',
  description: 'Description',
  priceCents: 2999,
});

// Publish product
await publishProduct(accessToken, product.product.id);

// Upload file
await uploadProductFile(accessToken, productId, {
  filename: 'file.pdf',
  url: 'https://example.com/file.pdf',
  sizeBytes: 1048576,
});

// Find product in list
const productElement = await findProductByTitle(page, 'Test Product');
```

### Utility Helpers

```typescript
import {
  generateTestEmail,
  generateUsername,
  getElementText,
  takeScreenshot,
} from './helpers';

// Generate unique test data
const email = generateTestEmail('test');     // test-1234567890@test.com
const username = generateUsername('user');   // user1234567890abc

// Get element text
const text = await getElementText(page, 'h1');

// Take screenshot
await takeScreenshot(page, 'test-screenshot');
```

---

## Best Practices

### 1. Test Isolation

Each test should be independent and not rely on other tests.

```typescript
// ❌ BAD - Tests depend on each other
test('create product', async ({ page }) => {
  // Creates product...
});

test('edit product', async ({ page }) => {
  // Assumes product exists from previous test
});

// ✅ GOOD - Each test is self-contained
test('edit product', async ({ creatorPage, apiClient }) => {
  // Create product first
  const product = await createProduct(creatorPage.accessToken, {...});

  // Then edit it
  await creatorPage.goto(`/dashboard/products/${product.product.id}/edit`);
});
```

### 2. Use Fixtures for Setup

Leverage fixtures for common setup instead of duplicating code.

```typescript
// ✅ GOOD - Use authenticatedPage fixture
test('should access dashboard', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard');
  // User is already authenticated
});
```

### 3. Prefer API Setup for Test Data

Use the API to create test data quickly, then test the UI interaction.

```typescript
// ✅ GOOD - API setup, UI verification
test('should display product', async ({ creatorPage, apiClient }) => {
  // Fast API setup
  const product = await createProduct(creatorPage.accessToken, {...});

  // Test UI display
  await creatorPage.goto('/dashboard/products');
  await expect(findProductByTitle(creatorPage, product.product.title)).toBeVisible();
});
```

### 4. Use Descriptive Test Names

```typescript
// ❌ BAD
test('test 1', async ({ page }) => { ... });

// ✅ GOOD
test('should show validation error for invalid email format', async ({ page }) => { ... });
```

### 5. Wait for Elements Properly

```typescript
// ❌ BAD - Hard-coded wait
await page.waitForTimeout(5000);

// ✅ GOOD - Wait for specific condition
await expect(page.locator('h1')).toBeVisible();
await page.waitForURL(/\/dashboard/);
```

### 6. Handle Flaky Tests

```typescript
// Set appropriate timeouts
await expect(element).toBeVisible({ timeout: 10000 });

// Use retry for flaky operations
test.describe(() => {
  test.use({ retries: 2 });

  test('potentially flaky test', async ({ page }) => {
    // ...
  });
});
```

---

## Debugging

### Debug Mode

Run tests in debug mode to pause execution and inspect:

```bash
# Debug specific test
npx playwright test --debug e2e/auth.spec.ts

# Debug test matching pattern
npx playwright test --debug -g "should sign up"
```

### Screenshots and Videos

Screenshots and videos are automatically captured on failure.

```typescript
// Manual screenshot
await page.screenshot({ path: 'debug-screenshot.png' });

// Manual video (configured in playwright.config.ts)
// Videos are in test-results/ directory
```

### Browser DevTools

```typescript
// Open DevTools and pause
await page.pause();
```

### Console Logs

```typescript
// Listen to console messages
page.on('console', (msg) => console.log('Browser log:', msg.text()));

// Listen to page errors
page.on('pageerror', (err) => console.log('Page error:', err));
```

### Test Artifacts

After running tests, artifacts are in `test-results/`:

```
test-results/
├── screenshots/       # Failure screenshots
├── videos/           # Test videos
├── traces/           # Playwright traces
└── e2e-results.json  # Test results JSON
```

View trace files:

```bash
npx playwright show-trace test-results/trace.zip
```

---

## CI/CD Integration

### Environment Variables

Set these environment variables for CI:

```bash
# API and web URLs
export E2E_API_URL=http://localhost:4000
export E2E_WEB_URL=http://localhost:3000

# CI flag (enables retries, disables parallel tests)
export CI=true
```

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Start database
        run: docker-compose up -d postgres redis

      - name: Run migrations
        run: npm run db:migrate

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Running in Docker

```dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

CMD ["npm", "run", "test:e2e"]
```

---

## Troubleshooting

### Common Issues

**Issue: "Timeout waiting for element"**
```typescript
// Solution: Increase timeout
await expect(element).toBeVisible({ timeout: 30000 });
```

**Issue: "Browser not installed"**
```bash
# Solution: Install Playwright browsers
npx playwright install
```

**Issue: "Port already in use"**
```bash
# Solution: Kill process on port or use different port
lsof -ti:3000 | xargs kill -9
```

**Issue: "Tests pass locally but fail in CI"**
```typescript
// Solution: Check environment variables and enable retries
test.use({ retries: process.env.CI ? 2 : 0 });
```

---

## Test Coverage Goals

### Current Coverage

| Category | Coverage | Target |
|----------|----------|--------|
| **Authentication** | 100% | 100% |
| **Product CRUD** | 95% | 100% |
| **Storefront** | 90% | 95% |
| **Purchase Flow** | 70% | 90% |
| **Analytics** | 60% | 80% |

### Priority Areas for Expansion

1. **Payment Flow** - Full Stripe test mode integration
2. **File Downloads** - Download token validation and expiration
3. **Error States** - Network failures, server errors
4. **Mobile Browsers** - More comprehensive mobile testing
5. **Performance** - Load time assertions

---

## Metrics

### Test Execution Metrics

```
Total Tests: 40
└── auth.spec.ts: 10 tests (~30 seconds)
└── products.spec.ts: 11 tests (~55 seconds)
└── storefront.spec.ts: 13 tests (~65 seconds)
└── journey.spec.ts: 4 tests (~40 seconds)

Total Duration: ~190 seconds (3.2 minutes)
Parallelization: 3x faster (chromium only)
```

### Browser Coverage

```
✓ Chromium (Desktop) - 40 tests
✓ Firefox (Desktop)  - 40 tests
✓ Safari (Desktop)   - 40 tests
✓ Mobile Chrome      - 40 tests
✓ Mobile Safari      - 40 tests

Total Test Runs: 200 tests across 5 browsers
```

---

## Additional Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)

---

## Contributing

When adding new E2E tests:

1. **Follow naming conventions** - Descriptive test names
2. **Use existing fixtures** - Leverage authenticatedPage, apiClient, etc.
3. **Add helper functions** - Reusable operations go in helpers.ts
4. **Document new patterns** - Update this guide
5. **Ensure tests are isolated** - No dependencies between tests
6. **Add to appropriate suite** - Group related tests together

---

**Last Updated:** November 2025
**Maintained By:** Digital Commerce Platform Team
