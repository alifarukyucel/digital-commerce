import { test, expect } from './fixtures';
import {
  generateTestEmail,
  generateUsername,
  fillSignupForm,
  fillLoginForm,
  waitForNavigation,
} from './helpers';

/**
 * E2E Tests: User Authentication
 *
 * Tests complete authentication flows including:
 * - User signup
 * - User login
 * - Session persistence
 * - Protected route access
 * - Logout
 */

test.describe('User Authentication', () => {
  test('should sign up a new user successfully', async ({ page }) => {
    const userData = {
      email: generateTestEmail('signup'),
      username: generateUsername('signup'),
      password: 'TestPassword123!',
      displayName: 'Signup Test User',
    };

    // Navigate to signup page
    await page.goto('/signup');
    await expect(page).toHaveURL('/signup');

    // Fill signup form
    await fillSignupForm(page, userData);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await waitForNavigation(page, /\/dashboard/);

    // Verify user is on dashboard
    await expect(page.locator('h1')).toContainText(/dashboard/i);

    // Verify username is displayed
    await expect(page.locator('body')).toContainText(userData.username);
  });

  test('should show validation errors for invalid signup data', async ({ page }) => {
    await page.goto('/signup');

    // Try to submit with empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=/email.*required/i')).toBeVisible();
    await expect(page.locator('text=/username.*required/i')).toBeVisible();
    await expect(page.locator('text=/password.*required/i')).toBeVisible();
  });

  test('should prevent duplicate email signup', async ({ page, apiClient }) => {
    const userData = {
      email: generateTestEmail('duplicate'),
      username: generateUsername('duplicate'),
      password: 'TestPassword123!',
    };

    // Create user via API first
    await apiClient.request('POST', '/api/auth/signup', { body: userData });

    // Try to signup with same email
    await page.goto('/signup');
    await fillSignupForm(page, {
      ...userData,
      username: generateUsername('different'), // Different username
    });
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/email.*already.*exists/i')).toBeVisible();
  });

  test('should login existing user successfully', async ({ page, apiClient }) => {
    const userData = {
      email: generateTestEmail('login'),
      username: generateUsername('login'),
      password: 'TestPassword123!',
    };

    // Create user via API
    await apiClient.request('POST', '/api/auth/signup', { body: userData });

    // Navigate to login page
    await page.goto('/login');
    await expect(page).toHaveURL('/login');

    // Fill login form
    await fillLoginForm(page, userData.email, userData.password);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await waitForNavigation(page, /\/dashboard/);

    // Verify user is authenticated
    await expect(page.locator('h1')).toContainText(/dashboard/i);
  });

  test('should show error for incorrect password', async ({ page, apiClient }) => {
    const userData = {
      email: generateTestEmail('wrongpass'),
      username: generateUsername('wrongpass'),
      password: 'TestPassword123!',
    };

    // Create user via API
    await apiClient.request('POST', '/api/auth/signup', { body: userData });

    // Try to login with wrong password
    await page.goto('/login');
    await fillLoginForm(page, userData.email, 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Should show error
    await expect(page.locator('text=/invalid.*credentials/i')).toBeVisible();
  });

  test('should show error for non-existent user', async ({ page }) => {
    await page.goto('/login');
    await fillLoginForm(page, 'nonexistent@test.com', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Should show error
    await expect(page.locator('text=/invalid.*credentials|user.*not.*found/i')).toBeVisible();
  });

  test('should protect dashboard route for unauthenticated users', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard');

    // Should redirect to login
    await waitForNavigation(page, /\/login/);
  });

  test('should persist session after page reload', async ({ authenticatedPage }) => {
    // Navigate to dashboard
    await authenticatedPage.goto('/dashboard');
    await expect(authenticatedPage).toHaveURL(/\/dashboard/);

    // Reload page
    await authenticatedPage.reload();

    // Should still be on dashboard (session persisted)
    await expect(authenticatedPage).toHaveURL(/\/dashboard/);
    await expect(authenticatedPage.locator('h1')).toContainText(/dashboard/i);
  });

  test('should logout user successfully', async ({ authenticatedPage }) => {
    // Navigate to dashboard
    await authenticatedPage.goto('/dashboard');

    // Find and click logout button
    const logoutButton = authenticatedPage.locator('button', { hasText: /logout|sign out/i });
    await logoutButton.click();

    // Should redirect to homepage or login
    await waitForNavigation(authenticatedPage, /\/($|login)/);

    // Try to access dashboard again
    await authenticatedPage.goto('/dashboard');

    // Should redirect to login
    await waitForNavigation(authenticatedPage, /\/login/);
  });

  test('should redirect authenticated users from login/signup to dashboard', async ({
    authenticatedPage,
  }) => {
    // Try to access login page while authenticated
    await authenticatedPage.goto('/login');
    await waitForNavigation(authenticatedPage, /\/dashboard/);

    // Try to access signup page while authenticated
    await authenticatedPage.goto('/signup');
    await waitForNavigation(authenticatedPage, /\/dashboard/);
  });
});
