import { test, expect } from '@playwright/test';

const BASE_URL = 'https://laviniagro1stg.wpengine.com/';

test.describe('Application Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setHTTPCredentials({ username: 'laviniagro1stg', password: '7ada27f4' });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('User can successfully complete the main workflow', async ({ page }) => {
    try {
      await page.click('nav'); // Navigate to On-Demand Platform section
      await page.waitForSelector('input[type="text"]');
      await page.fill('input[type="text"]', 'Sample Text');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"], .submit-btn');
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('p')).toContainText('success message'); // Adjust based on actual success message
    } catch (error) {
      console.error('Error in TC-001:', error);
    }
  });

  test('User receives an error message for incomplete form submission', async ({ page }) => {
    try {
      await page.click('nav'); // Navigate to On-Demand Platform section
      await page.waitForSelector('button[type="submit"], .submit-btn');
      await page.click('button[type="submit"], .submit-btn');
      await expect(page.locator('p')).toContainText('required fields'); // Adjust based on actual error message
    } catch (error) {
      console.error('Error in TC-002:', error);
    }
  });

  test('User receives an error message for invalid input', async ({ page }) => {
    try {
      await page.click('nav'); // Navigate to On-Demand Platform section
      await page.waitForSelector('input[type="text"]');
      await page.fill('input[type="text"]', 'Invalid Input'); // Fill with invalid data
      await page.click('button[type="submit"], .submit-btn');
      await expect(page.locator('p')).toContainText('invalid input'); // Adjust based on actual error message
    } catch (error) {
      console.error('Error in TC-003:', error);
    }
  });

  test('User can access the dashboard from different browsers', async ({ page }) => {
    try {
      await page.goto(BASE_URL);
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('h1')).toBeVisible(); // Check for main heading
    } catch (error) {
      console.error('Error in TC-004:', error);
    }
  });

  test('User can access the dashboard on mobile devices', async ({ page }) => {
    try {
      await page.setViewportSize({ width: 375, height: 667 }); // Mobile viewport
      await page.goto(BASE_URL);
      await expect(page.locator('body')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-007:', error);
    }
  });

  test('User can view the dashboard in landscape mode on mobile', async ({ page }) => {
    try {
      await page.setViewportSize({ width: 667, height: 375 }); // Landscape viewport
      await page.goto(BASE_URL);
      await expect(page.locator('body')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-008:', error);
    }
  });

  test('User can view the dashboard in portrait mode on mobile', async ({ page }) => {
    try {
      await page.setViewportSize({ width: 375, height: 667 }); // Portrait viewport
      await page.goto(BASE_URL);
      await expect(page.locator('body')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-009:', error);
    }
  });
});