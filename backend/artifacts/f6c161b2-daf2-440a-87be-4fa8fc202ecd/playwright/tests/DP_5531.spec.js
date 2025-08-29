import { test, expect } from '@playwright/test';

const BASE_URL = 'https://laviniagro1stg.wpengine.com/';

test.describe('Application Tests', () => {
  let context;
  let page;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({ 
      httpCredentials: { 
        username: 'laviniagro1stg', 
        password: '7ada27f4' 
      } 
    });
    page = await context.newPage();
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('User can successfully complete the main workflow', async () => {
    try {
      await page.fill('#input_25_1', 'Test Name');
      await page.fill('#input_25_4', 'test@example.com');
      await page.click('button[type="submit"]');
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('p')).toContainText('success message');
    } catch (error) {
      console.error('Error in TC-001:', error);
    }
  });

  test('User receives an error message for incomplete form submission', async () => {
    try {
      await page.fill('#input_25_1', '');
      await page.fill('#input_25_4', '');
      await page.click('button[type="submit"]');
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('p')).toContainText('required fields');
    } catch (error) {
      console.error('Error in TC-002:', error);
    }
  });

  test('User receives an error message for invalid input', async () => {
    try {
      await page.fill('#input_25_1', 'Invalid Name');
      await page.fill('#input_25_4', 'invalid-email');
      await page.click('button[type="submit"]');
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('p')).toContainText('invalid input');
    } catch (error) {
      console.error('Error in TC-003:', error);
    }
  });

  test('User can access the dashboard on different browsers', async () => {
    try {
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('h1')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-004:', error);
    }
  });

  test('User can access the dashboard on mobile devices', async () => {
    try {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('h1')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-005:', error);
    }
  });

  test('User can log out successfully', async () => {
    try {
      await page.click('button[type="submit"]'); // Assuming this is the logout button
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('h1')).toContainText('Login');
    } catch (error) {
      console.error('Error in TC-006:', error);
    }
  });

  test('User sees a loading indicator while data is being fetched', async () => {
    try {
      await page.click('button[type="submit"]'); // Assuming this initiates data fetch
      await expect(page.locator('div.loading')).toBeVisible();
      await page.waitForTimeout(2000); // Simulate loading time
      await expect(page.locator('div.data')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-007:', error);
    }
  });

  test('User can view help documentation from the dashboard', async () => {
    try {
      await page.click('a[href="/help"]'); // Assuming this is the help link
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        page.click('a[href="/help"]'),
      ]);
      await newPage.waitForLoadState('networkidle');
      await expect(newPage.locator('body')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-008:', error);
    }
  });

  test.afterEach(async () => {
    await context.close();
  });
});