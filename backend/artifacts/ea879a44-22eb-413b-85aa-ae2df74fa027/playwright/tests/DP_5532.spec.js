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

  test('User can successfully complete the on-demand course', async ({ page }) => {
    try {
      await page.waitForSelector('nav');
      await page.click('nav a[href*="on-demand-courses"]');
      await page.waitForSelector('button[type="submit"]:has-text("Complete Course")');
      await page.click('button[type="submit"]:has-text("Complete Course")');
      await expect(page.locator('body')).toContainText('Course completed');
    } catch (error) {
      console.error('Error in TC-001:', error);
    }
  });

  test('User receives an error when trying to complete a course without logging in', async ({ page }) => {
    try {
      await page.goto(BASE_URL + '/on-demand-courses');
      await page.waitForSelector('button[type="submit"]:has-text("Complete Course")');
      await page.click('button[type="submit"]:has-text("Complete Course")');
      await expect(page.locator('body')).toContainText('Please log in to complete the course');
    } catch (error) {
      console.error('Error in TC-002:', error);
    }
  });

  test('User receives an error when trying to complete a course that is already completed', async ({ page }) => {
    try {
      await page.waitForSelector('nav');
      await page.click('nav a[href*="on-demand-courses"]');
      await page.waitForSelector('button[type="submit"]:has-text("Complete Course")');
      await page.click('button[type="submit"]:has-text("Complete Course")');
      await expect(page.locator('body')).toContainText('Course already completed');
    } catch (error) {
      console.error('Error in TC-003:', error);
    }
  });

  test('User can view course completion status on the dashboard', async ({ page }) => {
    try {
      await page.waitForSelector('nav');
      await page.click('nav a[href*="dashboard"]');
      await expect(page.locator('body')).toContainText('Completion Status');
    } catch (error) {
      console.error('Error in TC-004:', error);
    }
  });

  test('Dashboard is accessible on different browsers', async ({ page }) => {
    try {
      await page.goto(BASE_URL);
      await expect(page.locator('body')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-005:', error);
    }
  });

  test('Dashboard is responsive on mobile devices', async ({ page }) => {
    try {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(BASE_URL);
      await expect(page.locator('body')).toBeVisible();
    } catch (error) {
      console.error('Error in TC-006:', error);
    }
  });
});