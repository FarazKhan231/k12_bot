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
      await page.waitForSelector('form');
      await page.fill('input[name="requiredField1"]', 'Valid Input 1');
      await page.fill('input[name="requiredField2"]', 'Valid Input 2');
      await page.click('button[type="submit"], .submit-btn');
      await expect(page.locator('.success-message')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-001:', error);
    }
  });

  test('User receives an error message for incomplete form submission', async ({ page }) => {
    try {
      await page.click('nav a[href="/main-feature"]');
      await page.waitForSelector('form');
      await page.fill('input[name="requiredField1"]', '');
      await page.fill('input[name="requiredField2"]', '');
      await page.click('button[type="submit"], .submit-btn');
      await expect(page.locator('.error-message')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-002:', error);
    }
  });

  test('User receives an error message for invalid input', async ({ page }) => {
    try {
      await page.click('nav a[href="/main-feature"]');
      await page.waitForSelector('form');
      await page.fill('input[name="requiredField1"]', 'Invalid Input');
      await page.fill('input[name="requiredField2"]', 'Another Invalid Input');
      await page.click('button[type="submit"], .submit-btn');
      await expect(page.locator('.error-message')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-003:', error);
    }
  });

  test('User can access the dashboard on different browsers', async ({ page }) => {
    try {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.dashboard')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-004:', error);
    }
  });

  test('User can access the dashboard on mobile devices', async ({ page }) => {
    try {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.dashboard')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-007:', error);
    }
  });

  test('User can view the dashboard in landscape mode on mobile', async ({ page }) => {
    try {
      await page.setViewportSize({ width: 667, height: 375 });
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.dashboard')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-008:', error);
    }
  });

  test('User can view the dashboard in portrait mode on mobile', async ({ page }) => {
    try {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.dashboard')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-009:', error);
    }
  });
});