import { test, expect } from './fixtures';
import {
  generateTestEmail,
  generateUsername,
  fillSignupForm,
  fillProductForm,
  waitForNavigation,
  uploadProductFile,
  publishProduct,
} from './helpers';

/**
 * E2E Tests: Complete User Journeys
 *
 * Tests end-to-end workflows that span multiple features:
 * - Creator journey: Signup → Create Product → Publish → View on Storefront
 * - Buyer journey: Browse → Purchase → Download
 * - Complete marketplace flow: Creator sells, buyer purchases
 */

test.describe('Complete User Journeys', () => {
  test('Creator Journey: Signup to Published Product', async ({ page }) => {
    const creatorData = {
      email: generateTestEmail('creator'),
      username: generateUsername('creator'),
      password: 'CreatorPassword123!',
      displayName: 'Test Creator',
    };

    // ==================== STEP 1: Signup ====================
    await page.goto('/signup');
    await fillSignupForm(page, creatorData);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await waitForNavigation(page, /\/dashboard/);
    await expect(page.locator('h1, h2')).toContainText(/dashboard/i);

    // ==================== STEP 2: Create Product ====================
    await page.goto('/dashboard/products/new');

    const productData = {
      title: 'My First Digital Product',
      description:
        'An amazing digital product that will help you learn something new',
      price: '49.99',
      coverImageUrl: 'https://via.placeholder.com/800x600',
    };

    await fillProductForm(page, productData);
    await page.click('button[type="submit"]');

    // Should redirect to product page
    await page.waitForURL(/\/dashboard\/products\/.+/);

    // ==================== STEP 3: Add Files ====================
    // Extract product ID from URL
    const productUrl = page.url();
    const productId = productUrl.match(/products\/([^/]+)/)?.[1];
    expect(productId).toBeDefined();

    // Navigate to files section
    await page.goto(`/dashboard/products/${productId}/files`);

    // Simulate adding a file
    const uploadButton = page.locator('button', {
      hasText: /upload|add file/i,
    });

    if (await uploadButton.isVisible({ timeout: 2000 })) {
      await uploadButton.click();

      // Fill file details
      await page.fill('input[name="filename"]', 'course-materials.zip');
      await page.fill(
        'input[name="url"]',
        'https://example.com/course-materials.zip'
      );
      await page.fill('input[name="sizeBytes"]', '10485760'); // 10MB

      await page.click('button[type="submit"]');

      // Verify file was added
      await expect(page.locator('text=course-materials.zip')).toBeVisible();
    }

    // ==================== STEP 4: Publish Product ====================
    await page.goto(`/dashboard/products/${productId}`);

    const publishButton = page.locator('button', { hasText: /publish/i });
    await publishButton.click();

    // Should show success message
    await expect(
      page.locator('text=/product.*published.*successfully/i')
    ).toBeVisible();

    // ==================== STEP 5: View on Storefront ====================
    // Navigate to public storefront
    await page.goto(`/${creatorData.username}`);

    // Should display the published product
    await expect(page.locator('text=My First Digital Product')).toBeVisible();
    await expect(page.locator('text=/\\$49\\.99/')).toBeVisible();

    // Click on product to view details
    await page.click('text=My First Digital Product');

    // Should be on product detail page
    await expect(page.locator('h1')).toContainText('My First Digital Product');
    await expect(page.locator('body')).toContainText(
      'An amazing digital product that will help you learn something new'
    );

    // ==================== STEP 6: View Analytics ====================
    await page.goto('/dashboard/analytics');

    // Should display analytics dashboard
    await expect(
      page.locator('text=/total.*revenue|sales.*count|overview/i')
    ).toBeVisible();

    // Should show 0 sales initially
    await expect(page.locator('text=/0.*sales|no.*sales/i')).toBeVisible();
  });

  test('Buyer Journey: Browse to Purchase', async ({
    creatorPage,
    page,
    apiClient,
  }) => {
    // ==================== SETUP: Creator has product ====================
    // Create and publish product as creator
    const productResponse = await apiClient.request('POST', '/api/products', {
      token: creatorPage.accessToken,
      body: {
        title: 'Premium E-Course',
        description: 'Learn advanced techniques in this comprehensive course',
        priceCents: 7999, // $79.99
        coverImageUrl: 'https://via.placeholder.com/800x600',
      },
    });

    const productId = productResponse.product.id;
    const productSlug = productResponse.product.slug;

    // Add file to product
    await uploadProductFile(creatorPage.accessToken, productId, {
      filename: 'course-video.mp4',
      url: 'https://example.com/course-video.mp4',
      sizeBytes: 52428800, // 50MB
    });

    // Publish product
    await publishProduct(creatorPage.accessToken, productId);

    // ==================== STEP 1: Discover Storefront ====================
    await page.goto(`/${creatorPage.username}`);

    // Should see creator's storefront
    await expect(page.locator('h1, h2')).toContainText(creatorPage.username);

    // Should see the product
    await expect(page.locator('text=Premium E-Course')).toBeVisible();
    await expect(page.locator('text=/\\$79\\.99/')).toBeVisible();

    // ==================== STEP 2: View Product Details ====================
    await page.click('text=Premium E-Course');

    // Should be on product detail page
    await expect(page.locator('h1')).toContainText('Premium E-Course');
    await expect(page.locator('body')).toContainText(
      'Learn advanced techniques in this comprehensive course'
    );

    // Should see buy button
    const buyButton = page.locator('button, a', {
      hasText: /buy|checkout|purchase/i,
    });
    await expect(buyButton).toBeVisible();

    // ==================== STEP 3: Initiate Checkout ====================
    await buyButton.click();

    // Should navigate to checkout or show checkout form
    await page.waitForURL(/checkout|payment/, { timeout: 10000 });

    // Should display correct product and price
    await expect(page.locator('text=Premium E-Course')).toBeVisible();
    await expect(page.locator('text=/\\$79\\.99/')).toBeVisible();

    // Enter email for guest checkout
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    if (await emailInput.isVisible({ timeout: 2000 })) {
      await emailInput.fill('buyer@test.com');
    }

    // Note: In a real E2E test with Stripe test mode, you would:
    // 1. Fill in test card details (4242 4242 4242 4242)
    // 2. Complete the purchase
    // 3. Verify redirect to success page
    // 4. Verify download link is available

    // For now, we'll verify the checkout session was created via API
    const checkoutResponse = await apiClient.request('POST', '/api/checkout', {
      body: {
        productId: productId,
        buyerEmail: 'buyer@test.com',
      },
    });

    expect(checkoutResponse.sessionId).toBeDefined();
    expect(checkoutResponse.url).toContain('stripe.com');
  });

  test('Full Marketplace Flow: Sale and Analytics Update', async ({
    creatorPage,
    apiClient,
  }) => {
    // ==================== SETUP: Create Product ====================
    const productResponse = await apiClient.request('POST', '/api/products', {
      token: creatorPage.accessToken,
      body: {
        title: 'Complete Marketplace Test Product',
        description: 'Product for full marketplace flow test',
        priceCents: 9999, // $99.99
        coverImageUrl: 'https://via.placeholder.com/800x600',
      },
    });

    const productId = productResponse.product.id;

    // Publish product
    await publishProduct(creatorPage.accessToken, productId);

    // ==================== STEP 1: Check Initial Analytics ====================
    const initialAnalytics = await apiClient.request(
      'GET',
      '/api/analytics/overview',
      { token: creatorPage.accessToken }
    );

    const initialSales = initialAnalytics.salesCount || 0;
    const initialRevenue = initialAnalytics.totalRevenueCents || 0;

    // ==================== STEP 2: Simulate Purchase ====================
    // In a real test, this would be done through Stripe webhook
    // For testing, we'll create an order directly
    const orderResponse = await apiClient.request('POST', '/api/orders', {
      token: creatorPage.accessToken,
      body: {
        productId: productId,
        buyerEmail: 'buyer@test.com',
        amountCents: 9999,
        status: 'completed',
      },
    });

    const orderId = orderResponse.order.id;
    expect(orderId).toBeDefined();

    // ==================== STEP 3: Verify Analytics Updated ====================
    const updatedAnalytics = await apiClient.request(
      'GET',
      '/api/analytics/overview',
      { token: creatorPage.accessToken }
    );

    // Sales count should increase by 1
    expect(updatedAnalytics.salesCount).toBe(initialSales + 1);

    // Revenue should increase by product price
    expect(updatedAnalytics.totalRevenueCents).toBe(initialRevenue + 9999);

    // ==================== STEP 4: Verify Product Sales Count ====================
    const productDetails = await apiClient.request(
      'GET',
      `/api/products/${productId}`,
      { token: creatorPage.accessToken }
    );

    expect(productDetails.product.salesCount).toBeGreaterThan(0);

    // ==================== STEP 5: Verify Order in Dashboard ====================
    await creatorPage.goto('/dashboard/orders');

    // Should display the order
    await expect(creatorPage.locator('text=buyer@test.com')).toBeVisible();
    await expect(creatorPage.locator('text=/\\$99\\.99/')).toBeVisible();

    // ==================== STEP 6: View Sales Timeline ====================
    await creatorPage.goto('/dashboard/analytics');

    // Navigate to sales timeline
    const timelineTab = creatorPage.locator('a, button', {
      hasText: /timeline|sales.*over.*time/i,
    });

    if (await timelineTab.isVisible({ timeout: 2000 })) {
      await timelineTab.click();

      // Should display chart or timeline
      await expect(
        creatorPage.locator('[data-testid="sales-chart"], canvas, svg')
      ).toBeVisible();
    }
  });

  test('Multi-Product Creator Journey', async ({ page, apiClient }) => {
    const creatorData = {
      email: generateTestEmail('multi'),
      username: generateUsername('multi'),
      password: 'MultiCreator123!',
    };

    // ==================== STEP 1: Signup ====================
    await page.goto('/signup');
    await fillSignupForm(page, creatorData);
    await page.click('button[type="submit"]');
    await waitForNavigation(page, /\/dashboard/);

    // Get access token from cookies or API
    const cookies = await page.context().cookies();
    const accessToken = cookies.find((c) => c.name === 'accessToken')?.value;

    if (!accessToken) {
      throw new Error('No access token found after signup');
    }

    // ==================== STEP 2: Create Multiple Products ====================
    const products = [
      {
        title: 'Beginner Course',
        description: 'Start your journey',
        priceCents: 2999,
      },
      {
        title: 'Advanced Course',
        description: 'Take it to the next level',
        priceCents: 4999,
      },
      {
        title: 'Expert Masterclass',
        description: 'Become a master',
        priceCents: 9999,
      },
    ];

    for (const productData of products) {
      const product = await apiClient.request('POST', '/api/products', {
        token: accessToken,
        body: productData,
      });

      // Publish each product
      await publishProduct(accessToken, product.product.id);
    }

    // ==================== STEP 3: View All Products in Dashboard ====================
    await page.goto('/dashboard/products');

    // Should display all 3 products
    await expect(page.locator('text=Beginner Course')).toBeVisible();
    await expect(page.locator('text=Advanced Course')).toBeVisible();
    await expect(page.locator('text=Expert Masterclass')).toBeVisible();

    // ==================== STEP 4: View Storefront ====================
    await page.goto(`/${creatorData.username}`);

    // All products should be visible on storefront
    await expect(page.locator('text=Beginner Course')).toBeVisible();
    await expect(page.locator('text=Advanced Course')).toBeVisible();
    await expect(page.locator('text=Expert Masterclass')).toBeVisible();

    // Should display all prices
    await expect(page.locator('text=/\\$29\\.99/')).toBeVisible();
    await expect(page.locator('text=/\\$49\\.99/')).toBeVisible();
    await expect(page.locator('text=/\\$99\\.99/')).toBeVisible();
  });
});
