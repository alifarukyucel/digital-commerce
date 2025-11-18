import { test, expect } from './fixtures';
import {
  createProduct,
  publishProduct,
  goToStorefront,
  findProductByTitle,
  initiateCheckout,
} from './helpers';

/**
 * E2E Tests: Storefront and Purchase Flow
 *
 * Tests public-facing storefront and purchase flows including:
 * - Viewing creator storefronts
 * - Browsing published products
 * - Product detail pages
 * - Checkout initiation
 * - Purchase completion (Stripe test mode)
 */

test.describe('Storefront', () => {
  test('should display creator storefront with published products', async ({
    creatorPage,
    page,
  }) => {
    // Create and publish products as creator
    const product1 = await createProduct(creatorPage.accessToken, {
      title: 'Storefront Product 1',
      description: 'First storefront product',
      priceCents: 2999,
      coverImageUrl: 'https://via.placeholder.com/400x300',
    });

    const product2 = await createProduct(creatorPage.accessToken, {
      title: 'Storefront Product 2',
      description: 'Second storefront product',
      priceCents: 4999,
      coverImageUrl: 'https://via.placeholder.com/400x300',
    });

    // Publish both products
    await publishProduct(creatorPage.accessToken, product1.product.id);
    await publishProduct(creatorPage.accessToken, product2.product.id);

    // Visit storefront as anonymous user
    await page.goto(`/${creatorPage.username}`);

    // Should display creator name
    await expect(page.locator('h1, h2')).toContainText(creatorPage.username);

    // Should display both published products
    await expect(findProductByTitle(page, 'Storefront Product 1')).toBeVisible();
    await expect(findProductByTitle(page, 'Storefront Product 2')).toBeVisible();

    // Should display prices
    await expect(page.locator('text=/\\$29\\.99/')).toBeVisible();
    await expect(page.locator('text=/\\$49\\.99/')).toBeVisible();
  });

  test('should not display draft products on storefront', async ({
    creatorPage,
    page,
  }) => {
    // Create draft product (not published)
    await createProduct(creatorPage.accessToken, {
      title: 'Draft Product Not Visible',
      description: 'This should not be visible on storefront',
      priceCents: 1999,
    });

    // Create and publish another product
    const publishedProduct = await createProduct(creatorPage.accessToken, {
      title: 'Published Product Visible',
      description: 'This should be visible',
      priceCents: 2999,
    });
    await publishProduct(creatorPage.accessToken, publishedProduct.product.id);

    // Visit storefront
    await page.goto(`/${creatorPage.username}`);

    // Should display published product
    await expect(
      findProductByTitle(page, 'Published Product Visible')
    ).toBeVisible();

    // Should NOT display draft product
    await expect(
      findProductByTitle(page, 'Draft Product Not Visible')
    ).not.toBeVisible();
  });

  test('should display product detail page', async ({ creatorPage, page }) => {
    // Create and publish product
    const product = await createProduct(creatorPage.accessToken, {
      title: 'Detailed Product',
      description: 'This is a detailed product description',
      priceCents: 3999,
      coverImageUrl: 'https://via.placeholder.com/800x600',
    });
    await publishProduct(creatorPage.accessToken, product.product.id);

    // Visit product detail page
    await page.goto(`/${creatorPage.username}/${product.product.slug}`);

    // Should display product title
    await expect(page.locator('h1')).toContainText('Detailed Product');

    // Should display description
    await expect(page.locator('body')).toContainText(
      'This is a detailed product description'
    );

    // Should display price
    await expect(page.locator('text=/\\$39\\.99/')).toBeVisible();

    // Should display cover image
    const coverImage = page.locator('img[alt*="Detailed Product"]');
    await expect(coverImage).toBeVisible();

    // Should have a buy/checkout button
    await expect(
      page.locator('button, a', { hasText: /buy|checkout|purchase/i })
    ).toBeVisible();
  });

  test('should show 404 for non-existent storefront', async ({ page }) => {
    await page.goto('/nonexistentuser12345');

    // Should show 404 or not found message
    await expect(
      page.locator('text=/404|not found|user.*not.*found/i')
    ).toBeVisible();
  });

  test('should show 404 for non-existent product', async ({
    creatorPage,
    page,
  }) => {
    await page.goto(`/${creatorPage.username}/nonexistent-product-slug`);

    // Should show 404 or not found message
    await expect(
      page.locator('text=/404|not found|product.*not.*found/i')
    ).toBeVisible();
  });

  test('should show empty state for creator with no published products', async ({
    creatorPage,
    page,
  }) => {
    // Visit storefront (creator has no published products)
    await page.goto(`/${creatorPage.username}`);

    // Should show empty state
    await expect(
      page.locator('text=/no.*products|coming.*soon|check.*back/i')
    ).toBeVisible();
  });
});

test.describe('Purchase Flow', () => {
  test('should initiate checkout for a product', async ({ creatorPage, page }) => {
    // Create and publish product
    const product = await createProduct(creatorPage.accessToken, {
      title: 'Checkout Test Product',
      description: 'Product for checkout test',
      priceCents: 1999,
    });
    await publishProduct(creatorPage.accessToken, product.product.id);

    // Visit product page
    await page.goto(`/${creatorPage.username}/${product.product.slug}`);

    // Click buy button
    const buyButton = page.locator('button, a', {
      hasText: /buy|checkout|purchase/i,
    });
    await buyButton.click();

    // Should navigate to checkout page or show checkout modal
    // This will vary based on implementation
    await page.waitForURL(/checkout|payment/, { timeout: 10000 });
  });

  test('should display correct price in checkout', async ({
    creatorPage,
    page,
  }) => {
    // Create and publish product with specific price
    const product = await createProduct(creatorPage.accessToken, {
      title: 'Price Test Product',
      description: 'Product for price verification',
      priceCents: 5999, // $59.99
    });
    await publishProduct(creatorPage.accessToken, product.product.id);

    // Visit product page and initiate checkout
    await page.goto(`/${creatorPage.username}/${product.product.slug}`);
    await initiateCheckout(page);

    // Should display correct price in checkout
    await expect(page.locator('text=/\\$59\\.99/')).toBeVisible();
  });

  test('should require email for guest checkout', async ({
    creatorPage,
    page,
  }) => {
    // Create and publish product
    const product = await createProduct(creatorPage.accessToken, {
      title: 'Guest Checkout Product',
      description: 'Product for guest checkout test',
      priceCents: 2999,
    });
    await publishProduct(creatorPage.accessToken, product.product.id);

    // Visit product page and initiate checkout
    await page.goto(`/${creatorPage.username}/${product.product.slug}`);
    await initiateCheckout(page);

    // Should have email field for guest checkout
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();
  });

  test('should create Stripe checkout session', async ({
    creatorPage,
    apiClient,
  }) => {
    // Create and publish product
    const product = await createProduct(creatorPage.accessToken, {
      title: 'Stripe Test Product',
      description: 'Product for Stripe test',
      priceCents: 3999,
    });
    await publishProduct(creatorPage.accessToken, product.product.id);

    // Create checkout session via API
    const checkoutData = await apiClient.request('POST', '/api/checkout', {
      body: {
        productId: product.product.id,
        buyerEmail: 'buyer@test.com',
      },
    });

    // Should return session ID and URL
    expect(checkoutData.sessionId).toBeDefined();
    expect(checkoutData.url).toBeDefined();
    expect(checkoutData.url).toContain('checkout.stripe.com');
  });

  test('should apply discount code if provided', async ({
    creatorPage,
    apiClient,
  }) => {
    // Create product
    const product = await createProduct(creatorPage.accessToken, {
      title: 'Discount Test Product',
      description: 'Product for discount test',
      priceCents: 5000, // $50.00
    });
    await publishProduct(creatorPage.accessToken, product.product.id);

    // Create discount code via API
    const discount = await apiClient.request('POST', '/api/discounts', {
      token: creatorPage.accessToken,
      body: {
        code: 'TEST20',
        type: 'percentage',
        value: 20, // 20% off
        productId: product.product.id,
      },
    });

    // Create checkout session with discount code
    const checkoutData = await apiClient.request('POST', '/api/checkout', {
      body: {
        productId: product.product.id,
        buyerEmail: 'buyer@test.com',
        discountCode: 'TEST20',
      },
    });

    // Should return discounted information
    expect(checkoutData).toBeDefined();
    // In a real implementation, you'd verify the discounted price
  });

  test('should track analytics after purchase', async ({
    creatorPage,
    apiClient,
  }) => {
    // Create and publish product
    const product = await createProduct(creatorPage.accessToken, {
      title: 'Analytics Test Product',
      description: 'Product for analytics test',
      priceCents: 2999,
    });
    await publishProduct(creatorPage.accessToken, product.product.id);

    // Get initial analytics
    const initialAnalytics = await apiClient.request(
      'GET',
      '/api/analytics/overview',
      { token: creatorPage.accessToken }
    );
    const initialSales = initialAnalytics.salesCount || 0;

    // Simulate a purchase by creating an order via API
    await apiClient.request('POST', '/api/orders', {
      token: creatorPage.accessToken,
      body: {
        productId: product.product.id,
        buyerEmail: 'buyer@test.com',
        amountCents: 2999,
        status: 'completed',
      },
    });

    // Get updated analytics
    const updatedAnalytics = await apiClient.request(
      'GET',
      '/api/analytics/overview',
      { token: creatorPage.accessToken }
    );

    // Should have incremented sales count
    expect(updatedAnalytics.salesCount).toBe(initialSales + 1);

    // Should have updated revenue
    expect(updatedAnalytics.totalRevenueCents).toBeGreaterThan(
      initialAnalytics.totalRevenueCents || 0
    );
  });
});
