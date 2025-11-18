import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * E2E Test Helpers
 *
 * Common operations for E2E tests
 */

const API_BASE_URL = process.env.E2E_API_URL || 'http://localhost:4000';

/**
 * Create a product via API
 */
export async function createProduct(
  accessToken: string,
  productData: {
    title: string;
    description: string;
    priceCents: number;
    coverImageUrl?: string;
  }
) {
  const response = await fetch(`${API_BASE_URL}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create product: ${response.status}`);
  }

  return await response.json();
}

/**
 * Publish a product via API
 */
export async function publishProduct(accessToken: string, productId: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/products/${productId}/publish`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to publish product: ${response.status}`);
  }

  return await response.json();
}

/**
 * Upload a file to a product via API
 */
export async function uploadProductFile(
  accessToken: string,
  productId: string,
  fileData: { filename: string; url: string; sizeBytes: number }
) {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}/files`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(fileData),
  });

  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.status}`);
  }

  return await response.json();
}

/**
 * Fill in signup form
 */
export async function fillSignupForm(
  page: Page,
  userData: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
  }
) {
  await page.fill('input[name="email"]', userData.email);
  await page.fill('input[name="username"]', userData.username);
  await page.fill('input[name="password"]', userData.password);

  if (userData.displayName) {
    const displayNameInput = page.locator('input[name="displayName"]');
    if (await displayNameInput.isVisible()) {
      await displayNameInput.fill(userData.displayName);
    }
  }
}

/**
 * Fill in login form
 */
export async function fillLoginForm(page: Page, email: string, password: string) {
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
}

/**
 * Fill in product creation form
 */
export async function fillProductForm(
  page: Page,
  productData: {
    title: string;
    description: string;
    price: string;
    coverImageUrl?: string;
  }
) {
  await page.fill('input[name="title"]', productData.title);
  await page.fill('textarea[name="description"]', productData.description);
  await page.fill('input[name="price"]', productData.price);

  if (productData.coverImageUrl) {
    const coverImageInput = page.locator('input[name="coverImageUrl"]');
    if (await coverImageInput.isVisible()) {
      await coverImageInput.fill(productData.coverImageUrl);
    }
  }
}

/**
 * Wait for navigation and verify URL
 */
export async function waitForNavigation(
  page: Page,
  expectedUrlPattern: string | RegExp
) {
  await page.waitForURL(expectedUrlPattern, { timeout: 10000 });
  expect(page.url()).toMatch(expectedUrlPattern);
}

/**
 * Wait for success message
 */
export async function waitForSuccessMessage(page: Page, message?: string) {
  const successLocator = page.locator('[role="alert"]', { hasText: message });
  await expect(successLocator).toBeVisible({ timeout: 5000 });
}

/**
 * Wait for error message
 */
export async function waitForErrorMessage(page: Page, message?: string) {
  const errorLocator = message
    ? page.locator('[role="alert"]', { hasText: message })
    : page.locator('[role="alert"]');
  await expect(errorLocator).toBeVisible({ timeout: 5000 });
}

/**
 * Check if user is authenticated (by checking dashboard access)
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    await page.goto('/dashboard');
    await page.waitForURL(/\/dashboard/, { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Navigate to dashboard
 */
export async function goToDashboard(page: Page) {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard/);
}

/**
 * Navigate to product creation page
 */
export async function goToCreateProduct(page: Page) {
  await page.goto('/dashboard/products/new');
  await expect(page).toHaveURL(/\/dashboard\/products\/new/);
}

/**
 * Navigate to storefront
 */
export async function goToStorefront(page: Page, username: string) {
  await page.goto(`/${username}`);
  await expect(page).toHaveURL(new RegExp(`/${username}`));
}

/**
 * Get product from list by title
 */
export async function findProductByTitle(page: Page, title: string) {
  return page.locator(`[data-testid="product-item"]`, { hasText: title });
}

/**
 * Click checkout button and wait for Stripe
 */
export async function initiateCheckout(page: Page) {
  const checkoutButton = page.locator('button', { hasText: /checkout|buy now/i });
  await checkoutButton.click();

  // Wait for redirect to checkout or Stripe
  await page.waitForURL(/checkout|stripe\.com/, { timeout: 10000 });
}

/**
 * Fill in Stripe test card (in test mode)
 */
export async function fillStripeTestCard(page: Page) {
  // Wait for Stripe iframe to load
  await page.waitForSelector('iframe[name*="stripe"]', { timeout: 10000 });

  const stripeFrame = page.frameLocator('iframe[name*="stripe"]').first();

  // Fill in test card number (4242 4242 4242 4242)
  await stripeFrame.locator('input[name="cardnumber"]').fill('4242424242424242');

  // Fill in expiry (any future date)
  await stripeFrame.locator('input[name="exp-date"]').fill('12/25');

  // Fill in CVC
  await stripeFrame.locator('input[name="cvc"]').fill('123');

  // Fill in ZIP
  await stripeFrame.locator('input[name="postal"]').fill('12345');
}

/**
 * Generate unique test email
 */
export function generateTestEmail(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
}

/**
 * Generate unique username
 */
export function generateUsername(prefix: string = 'user'): string {
  return `${prefix}${Date.now()}${Math.random().toString(36).substring(7)}`;
}

/**
 * Wait for element to be visible and get text
 */
export async function getElementText(page: Page, selector: string): Promise<string> {
  const element = page.locator(selector);
  await expect(element).toBeVisible();
  return (await element.textContent()) || '';
}

/**
 * Take screenshot with name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
}
