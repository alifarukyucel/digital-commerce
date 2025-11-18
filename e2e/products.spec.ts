import { test, expect } from './fixtures';
import {
  goToDashboard,
  goToCreateProduct,
  fillProductForm,
  waitForNavigation,
  findProductByTitle,
  createProduct,
} from './helpers';

/**
 * E2E Tests: Product Management
 *
 * Tests complete product management flows including:
 * - Creating products
 * - Editing products
 * - Publishing/unpublishing
 * - Deleting products
 * - File uploads
 */

test.describe('Product Management', () => {
  test('should create a new product successfully', async ({ creatorPage }) => {
    const productData = {
      title: 'E2E Test Product',
      description: 'A test product created via E2E test',
      price: '29.99',
      coverImageUrl: 'https://via.placeholder.com/800x600',
    };

    // Navigate to product creation page
    await goToCreateProduct(creatorPage);

    // Fill product form
    await fillProductForm(creatorPage, productData);

    // Submit form
    await creatorPage.click('button[type="submit"]');

    // Should redirect to product edit page or dashboard
    await creatorPage.waitForURL(/\/dashboard\/products\/.+/);

    // Verify success message
    await expect(
      creatorPage.locator('text=/product.*created.*successfully/i')
    ).toBeVisible();
  });

  test('should show validation errors for invalid product data', async ({
    creatorPage,
  }) => {
    await goToCreateProduct(creatorPage);

    // Try to submit empty form
    await creatorPage.click('button[type="submit"]');

    // Should show validation errors
    await expect(creatorPage.locator('text=/title.*required/i')).toBeVisible();
    await expect(creatorPage.locator('text=/description.*required/i')).toBeVisible();
    await expect(creatorPage.locator('text=/price.*required/i')).toBeVisible();
  });

  test('should show validation error for invalid price', async ({ creatorPage }) => {
    await goToCreateProduct(creatorPage);

    await fillProductForm(creatorPage, {
      title: 'Test Product',
      description: 'Test description',
      price: '-10', // Invalid price
    });

    await creatorPage.click('button[type="submit"]');

    // Should show error for negative price
    await expect(
      creatorPage.locator('text=/price.*must.*be.*positive|invalid.*price/i')
    ).toBeVisible();
  });

  test('should list all user products in dashboard', async ({ creatorPage }) => {
    // Create a few products via API
    const product1 = await createProduct(creatorPage.accessToken, {
      title: 'Test Product 1',
      description: 'First test product',
      priceCents: 1999,
    });

    const product2 = await createProduct(creatorPage.accessToken, {
      title: 'Test Product 2',
      description: 'Second test product',
      priceCents: 2999,
    });

    // Navigate to dashboard products page
    await creatorPage.goto('/dashboard/products');

    // Should display both products
    await expect(findProductByTitle(creatorPage, 'Test Product 1')).toBeVisible();
    await expect(findProductByTitle(creatorPage, 'Test Product 2')).toBeVisible();
  });

  test('should edit an existing product', async ({ creatorPage }) => {
    // Create product via API
    const product = await createProduct(creatorPage.accessToken, {
      title: 'Original Title',
      description: 'Original description',
      priceCents: 1999,
    });

    // Navigate to edit page
    await creatorPage.goto(`/dashboard/products/${product.product.id}/edit`);

    // Update title and description
    await creatorPage.fill('input[name="title"]', 'Updated Title');
    await creatorPage.fill('textarea[name="description"]', 'Updated description');

    // Submit form
    await creatorPage.click('button[type="submit"]');

    // Should show success message
    await expect(
      creatorPage.locator('text=/product.*updated.*successfully/i')
    ).toBeVisible();

    // Verify changes by navigating back to products list
    await creatorPage.goto('/dashboard/products');
    await expect(findProductByTitle(creatorPage, 'Updated Title')).toBeVisible();
  });

  test('should publish a product', async ({ creatorPage }) => {
    // Create draft product via API
    const product = await createProduct(creatorPage.accessToken, {
      title: 'Draft Product',
      description: 'A draft product',
      priceCents: 2999,
    });

    // Navigate to product page
    await creatorPage.goto(`/dashboard/products/${product.product.id}`);

    // Verify product is draft
    await expect(creatorPage.locator('text=/draft|unpublished/i')).toBeVisible();

    // Click publish button
    const publishButton = creatorPage.locator('button', {
      hasText: /publish/i,
    });
    await publishButton.click();

    // Should show success message
    await expect(
      creatorPage.locator('text=/product.*published.*successfully/i')
    ).toBeVisible();

    // Verify product is now published
    await expect(creatorPage.locator('text=/published/i')).toBeVisible();
  });

  test('should unpublish a published product', async ({ creatorPage, apiClient }) => {
    // Create and publish product via API
    const product = await createProduct(creatorPage.accessToken, {
      title: 'Published Product',
      description: 'A published product',
      priceCents: 2999,
    });

    // Publish via API
    await apiClient.request(
      'POST',
      `/api/products/${product.product.id}/publish`,
      { token: creatorPage.accessToken }
    );

    // Navigate to product page
    await creatorPage.goto(`/dashboard/products/${product.product.id}`);

    // Verify product is published
    await expect(creatorPage.locator('text=/published/i')).toBeVisible();

    // Click unpublish button
    const unpublishButton = creatorPage.locator('button', {
      hasText: /unpublish/i,
    });
    await unpublishButton.click();

    // Should show success message
    await expect(
      creatorPage.locator('text=/product.*unpublished.*successfully/i')
    ).toBeVisible();

    // Verify product is now draft
    await expect(creatorPage.locator('text=/draft|unpublished/i')).toBeVisible();
  });

  test('should delete a product', async ({ creatorPage }) => {
    // Create product via API
    const product = await createProduct(creatorPage.accessToken, {
      title: 'Product to Delete',
      description: 'This product will be deleted',
      priceCents: 1999,
    });

    // Navigate to product page
    await creatorPage.goto(`/dashboard/products/${product.product.id}`);

    // Click delete button
    const deleteButton = creatorPage.locator('button', {
      hasText: /delete/i,
    });
    await deleteButton.click();

    // Confirm deletion (if confirmation dialog exists)
    const confirmButton = creatorPage.locator('button', {
      hasText: /confirm|yes|delete/i,
    });
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }

    // Should redirect to products list
    await waitForNavigation(creatorPage, /\/dashboard\/products$/);

    // Should show success message
    await expect(
      creatorPage.locator('text=/product.*deleted.*successfully/i')
    ).toBeVisible();

    // Product should not be in list
    await expect(
      findProductByTitle(creatorPage, 'Product to Delete')
    ).not.toBeVisible();
  });

  test('should upload a file to a product', async ({ creatorPage }) => {
    // Create product via API
    const product = await createProduct(creatorPage.accessToken, {
      title: 'Product with File',
      description: 'Product for file upload test',
      priceCents: 4999,
    });

    // Navigate to product files page
    await creatorPage.goto(`/dashboard/products/${product.product.id}/files`);

    // Click upload button
    const uploadButton = creatorPage.locator('button', {
      hasText: /upload|add file/i,
    });
    await uploadButton.click();

    // For now, we'll simulate file upload via form inputs
    // In a real scenario, you'd use page.setInputFiles()
    await creatorPage.fill('input[name="filename"]', 'test-file.pdf');
    await creatorPage.fill('input[name="url"]', 'https://example.com/test-file.pdf');
    await creatorPage.fill('input[name="sizeBytes"]', '1048576'); // 1MB

    // Submit
    await creatorPage.click('button[type="submit"]');

    // Should show success message
    await expect(
      creatorPage.locator('text=/file.*uploaded.*successfully/i')
    ).toBeVisible();

    // File should be visible in list
    await expect(creatorPage.locator('text=test-file.pdf')).toBeVisible();
  });

  test('should show empty state when user has no products', async ({
    authenticatedPage,
  }) => {
    // Navigate to products page (new user with no products)
    await authenticatedPage.goto('/dashboard/products');

    // Should show empty state
    await expect(
      authenticatedPage.locator('text=/no.*products|create.*your.*first.*product/i')
    ).toBeVisible();

    // Should show create product button
    await expect(
      authenticatedPage.locator('a, button', { hasText: /create.*product|new.*product/i })
    ).toBeVisible();
  });

  test('should filter products by status', async ({ creatorPage, apiClient }) => {
    // Create draft product
    await createProduct(creatorPage.accessToken, {
      title: 'Draft Product Filter',
      description: 'Draft product',
      priceCents: 1999,
    });

    // Create and publish product
    const publishedProduct = await createProduct(creatorPage.accessToken, {
      title: 'Published Product Filter',
      description: 'Published product',
      priceCents: 2999,
    });

    await apiClient.request(
      'POST',
      `/api/products/${publishedProduct.product.id}/publish`,
      { token: creatorPage.accessToken }
    );

    // Navigate to products page
    await creatorPage.goto('/dashboard/products');

    // Filter by draft
    const draftFilter = creatorPage.locator('button, a', { hasText: /draft/i });
    if (await draftFilter.isVisible({ timeout: 2000 })) {
      await draftFilter.click();

      // Should show only draft product
      await expect(
        findProductByTitle(creatorPage, 'Draft Product Filter')
      ).toBeVisible();
      await expect(
        findProductByTitle(creatorPage, 'Published Product Filter')
      ).not.toBeVisible();
    }

    // Filter by published
    const publishedFilter = creatorPage.locator('button, a', {
      hasText: /published/i,
    });
    if (await publishedFilter.isVisible({ timeout: 2000 })) {
      await publishedFilter.click();

      // Should show only published product
      await expect(
        findProductByTitle(creatorPage, 'Published Product Filter')
      ).toBeVisible();
      await expect(
        findProductByTitle(creatorPage, 'Draft Product Filter')
      ).not.toBeVisible();
    }
  });
});
