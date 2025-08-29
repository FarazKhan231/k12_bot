import { test, expect } from '@playwright/test';

const BASE_URL = 'https://laviniagro1stg.wpengine.com/';

test('DP-5195 - Basic page load test', async ({ page }) => {
  // Navigate to the page
  await page.goto(BASE_URL);
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot
  await page.screenshot({ path: 'screenshots/basic-test.png' });
  
  // Basic assertions that will work on any page
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('html')).toBeVisible();
  
  // Check page title exists
  const title = await page.title();
  expect(title).toBeTruthy();
  
  // Check URL
  const url = page.url();
  expect(url).toContain('https://laviniagro1stg.wpengine.com/');
});