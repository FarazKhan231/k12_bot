import { test, expect } from '@playwright/test';

const BASE_URL = 'https://laviniagro1stg.wpengine.com/';

test.describe('Application Tests', () => {
  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext({ 
      httpCredentials: { 
        username: 'laviniagro1stg', 
        password: '7ada27f4' 
      } 
    });
    const page = await context.newPage();
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('User can successfully view the assessments dashboard', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('User can access Linkit support from the dashboard', async ({ page }) => {
    await page.click('a[href*="linkit-support"]');
    await expect(page).toHaveURL(/.*linkit-support/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('User receives an error message when submitting an incomplete assessment', async ({ page }) => {
    await page.goto(`${BASE_URL}/assessment-submission`);
    await page.click('button[type="submit"]');
    await expect(page.locator('p.error')).toBeVisible();
  });

  test('User sees a loading indicator when assessments are being fetched', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page.locator('div.loading')).toBeVisible();
    await page.waitForSelector('div.assessments', { state: 'visible' });
    await expect(page.locator('div.loading')).not.toBeVisible();
  });

  test('User can filter assessments by status', async ({ page }) => {
    await page.goto(`${BASE_URL}/assessments`);
    await page.selectOption('select[name="status-filter"]', 'completed');
    await expect(page.locator('div.assessment.completed')).toBeVisible();
  });

  test('User receives a notification for successful assessment submission', async ({ page }) => {
    await page.goto(`${BASE_URL}/assessment-submission`);
    await page.fill('#input_25_1', 'Test Name');
    await page.fill('#input_25_4', 'test@example.com');
    await page.click('button[type="submit"]');
    await expect(page.locator('p.success')).toBeVisible();
  });
});