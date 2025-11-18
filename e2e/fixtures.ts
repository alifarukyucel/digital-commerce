import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * E2E Test Fixtures
 *
 * Provides authenticated contexts and helper methods for E2E tests
 */

const API_BASE_URL = process.env.E2E_API_URL || 'http://localhost:4000';
const WEB_BASE_URL = process.env.E2E_WEB_URL || 'http://localhost:3000';

// Test user credentials
export const TEST_USERS = {
  creator: {
    email: `creator-${Date.now()}@test.com`,
    username: `creator${Date.now()}`,
    password: 'TestPassword123!',
    displayName: 'Test Creator',
  },
  buyer: {
    email: `buyer-${Date.now()}@test.com`,
    username: `buyer${Date.now()}`,
    password: 'TestPassword123!',
    displayName: 'Test Buyer',
  },
};

// Test product data
export const TEST_PRODUCT = {
  title: 'E2E Test Digital Product',
  description: 'A test product for E2E testing',
  priceCents: 2999, // $29.99
  coverImageUrl: 'https://via.placeholder.com/800x600',
};

type AuthenticatedPage = Page & {
  accessToken: string;
  userId: string;
  userEmail: string;
  username: string;
};

type TestFixtures = {
  authenticatedPage: AuthenticatedPage;
  creatorPage: AuthenticatedPage;
  buyerPage: AuthenticatedPage;
  apiClient: {
    baseURL: string;
    request: (
      method: string,
      endpoint: string,
      options?: { token?: string; body?: any }
    ) => Promise<any>;
  };
};

/**
 * Sign up a new user via API
 */
async function signupUser(userData: {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    throw new Error(`Signup failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Login user via API
 */
async function loginUser(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Set authentication cookie in browser
 */
async function setAuthCookie(page: Page, accessToken: string) {
  await page.context().addCookies([
    {
      name: 'accessToken',
      value: accessToken,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

// Extend base test with custom fixtures
export const test = base.extend<TestFixtures>({
  /**
   * Generic authenticated page
   */
  authenticatedPage: async ({ page }, use) => {
    // Create unique user for this test
    const userCreds = {
      email: `user-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`,
      username: `user${Date.now()}${Math.random().toString(36).substring(7)}`,
      password: 'TestPassword123!',
      displayName: 'Test User',
    };

    // Signup via API
    const signupData = await signupUser(userCreds);

    // Set auth cookie
    await setAuthCookie(page, signupData.tokens.accessToken);

    // Attach user data to page
    const authPage = page as AuthenticatedPage;
    authPage.accessToken = signupData.tokens.accessToken;
    authPage.userId = signupData.user.id;
    authPage.userEmail = signupData.user.email;
    authPage.username = signupData.user.username;

    await use(authPage);
  },

  /**
   * Authenticated creator user
   */
  creatorPage: async ({ page }, use) => {
    const creatorCreds = {
      ...TEST_USERS.creator,
      email: `creator-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`,
      username: `creator${Date.now()}${Math.random().toString(36).substring(7)}`,
    };

    const signupData = await signupUser(creatorCreds);
    await setAuthCookie(page, signupData.tokens.accessToken);

    const authPage = page as AuthenticatedPage;
    authPage.accessToken = signupData.tokens.accessToken;
    authPage.userId = signupData.user.id;
    authPage.userEmail = signupData.user.email;
    authPage.username = signupData.user.username;

    await use(authPage);
  },

  /**
   * Authenticated buyer user
   */
  buyerPage: async ({ page }, use) => {
    const buyerCreds = {
      ...TEST_USERS.buyer,
      email: `buyer-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`,
      username: `buyer${Date.now()}${Math.random().toString(36).substring(7)}`,
    };

    const signupData = await signupUser(buyerCreds);
    await setAuthCookie(page, signupData.tokens.accessToken);

    const authPage = page as AuthenticatedPage;
    authPage.accessToken = signupData.tokens.accessToken;
    authPage.userId = signupData.user.id;
    authPage.userEmail = signupData.user.email;
    authPage.username = signupData.user.username;

    await use(authPage);
  },

  /**
   * API client for direct backend calls
   */
  apiClient: async ({}, use) => {
    const client = {
      baseURL: API_BASE_URL,
      async request(
        method: string,
        endpoint: string,
        options?: { token?: string; body?: any }
      ) {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (options?.token) {
          headers['Authorization'] = `Bearer ${options.token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method,
          headers,
          body: options?.body ? JSON.stringify(options.body) : undefined,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            `API request failed: ${response.status} ${JSON.stringify(data)}`
          );
        }

        return data;
      },
    };

    await use(client);
  },
});

export { expect };
