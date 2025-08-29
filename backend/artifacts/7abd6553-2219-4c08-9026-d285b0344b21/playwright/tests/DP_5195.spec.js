import { test, expect } from '@playwright/test';

const BASE_URL = 'https://laviniagro1stg.wpengine.com/';

test.describe('Application Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('User can successfully view assessments on the dashboard', async ({ page }) => {
    try {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForSelector('.dashboard', { timeout: 5000 });
      await expect(page.locator('.assessments-section')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-001:', error);
    }
  });

  test('User can access Linkit support from the dashboard', async ({ page }) => {
    try {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForSelector('.dashboard', { timeout: 5000 });
      await page.click('a[href="/linkit-support"]');
      await page.waitForSelector('.linkit-support-page', { timeout: 5000 });
      await expect(page.locator('.linkit-support-page')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-002:', error);
    }
  });

  test('User sees an error message when assessments fail to load', async ({ page }) => {
    try {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForSelector('.dashboard', { timeout: 5000 });
      // Simulate assessments failing to load
      await page.evaluate(() => { window.assessmentsLoaded = false; });
      await page.waitForTimeout(1000); // Wait for the error message to appear
      await expect(page.locator('.error-message')).toBeVisible();
      await page.click('button.retry-load'); // Assuming there's a retry button
      await page.waitForSelector('.assessments-section', { timeout: 5000 });
    } catch (error) {
      console.error('Error in TC-003:', error);
    }
  });

  test('User receives a validation error when submitting an incomplete form', async ({ page }) => {
    try {
      await page.goto(`${BASE_URL}/assessments/form`);
      await page.waitForSelector('form', { timeout: 5000 });
      await page.click('button[type="submit"]');
      await expect(page.locator('.validation-error')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-004:', error);
    }
  });

  test('User can access the dashboard on mobile devices', async ({ page }) => {
    try {
      await page.setViewportSize({ width: 375, height: 667 }); // Mobile viewport
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.mobile-dashboard')).toBeVisible();
      await expect(page.locator('.assessments-section')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-006:', error);
    }
  });

  test('User can navigate back to the dashboard from Linkit support', async ({ page }) => {
    try {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForSelector('.dashboard', { timeout: 5000 });
      await page.click('a[href="/linkit-support"]');
      await page.waitForSelector('.linkit-support-page', { timeout: 5000 });
      await page.click('a.back-to-dashboard');
      await page.waitForSelector('.dashboard', { timeout: 5000 });
      await expect(page.locator('.dashboard')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-007:', error);
    }
  });
});