import { test, expect } from '@playwright/test';

test('smoke test for https://laviniagro1stg.wpengine.com/', async ({ page }) => {
  // Navigate to the URL
  await page.goto('https://laviniagro1stg.wpengine.com/');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Take initial screenshot
  await page.screenshot({ path: '01_initial.png', fullPage: true });
  
  // Basic page validation
  await expect(page).toHaveTitle(/./);
  
  // Test Steps:
  // 1. Navigate to the homepage
  // 2. Verify page loads without errors
  // 3. Check basic navigation elements
  // 4. Verify login functionality (if applicable)
  // 5. Check critical user flows
  // 6. Verify no console errors
  
  // Example implementation for smoke test:
  if ('smoke' === 'smoke') {
    // Check if page loads without errors
    await expect(page.locator('body')).toBeVisible();
    
    // Check for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    
    // Wait a bit for any console errors to appear
    await page.waitForTimeout(2000);
    
    // Verify no critical errors
    expect(consoleErrors.filter(err => 
      !err.includes('favicon') && 
      !err.includes('analytics') && 
      !err.includes('tracking')
    )).toHaveLength(0);
  }
  
  // Take final screenshot
  await page.screenshot({ path: '02_final.png', fullPage: true });
});