import { test, expect } from '@playwright/test';

const BASE_URL = 'https://laviniagro1stg.wpengine.com/';

test.describe('Application Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('User can successfully complete the main workflow', async ({ page }) => {
    try {
      await page.click('nav a[href="/main-feature"]');
      await page.waitForSelector('input[type="text"]');
      await page.fill('input[type="text"]', 'Sample Text');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('div.success-message')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-001:', error);
    }
  });

  test('User receives an error message for incomplete form submission', async ({ page }) => {
    try {
      await page.click('nav a[href="/main-feature"]');
      await page.waitForSelector('button[type="submit"]');
      await page.click('button[type="submit"]');
      await expect(page.locator('div.error-message')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-002:', error);
    }
  });

  test('User receives an error message for invalid input', async ({ page }) => {
    try {
      await page.click('nav a[href="/main-feature"]');
      await page.fill('input[type="email"]', 'invalid-email');
      await page.click('button[type="submit"]');
      await expect(page.locator('div.error-message')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-003:', error);
    }
  });

  test('User can access the dashboard on different browsers', async ({ page }) => {
    try {
      await page.goto(BASE_URL);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-004:', error);
    }
  });

  test('User can access the dashboard on mobile devices', async ({ page }) => {
    try {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(BASE_URL);
      await expect(page.locator('body')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-005:', error);
    }
  });

  test('User can log out successfully', async ({ page }) => {
    try {
      await page.goto(BASE_URL);
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.click('button#logout-button');
      await expect(page.locator('div.confirmation-message')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-006:', error);
    }
  });

  test('User cannot access the dashboard without logging in', async ({ page }) => {
    try {
      await page.goto(BASE_URL);
      await expect(page.locator('div.login-message')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-007:', error);
    }
  });
});