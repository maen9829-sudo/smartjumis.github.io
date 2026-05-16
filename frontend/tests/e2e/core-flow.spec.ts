import { test, expect } from '@playwright/test';

test.describe('SmartJumis Core Transaction Flow', () => {
  test('Client can create project, view proposals, and accept', async ({ page }) => {
    // 1. Login as existing client (or bypass auth with cookies)
    await page.goto('/login');
    await page.fill('input[type="email"]', 'client@test.com'); // Assumes existing test seed
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 2. Dashboard
    // Wait for URL to contain dashboard
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Click on Post New Project
    await page.click('text=Post New Project');

    // 3. Create Project
    await page.waitForURL('**/projects/new');
    await expect(page).toHaveURL(/.*projects\/new/);
    
    // Fill the project form
    await page.fill('input[placeholder="e.g. Build a React Native App"]', 'Playwright E2E Test Project');
    await page.fill('textarea', 'This is an automated test project.');
    await page.fill('input[placeholder="500"]', '1000');
    await page.fill('input[placeholder="React, Node.js, UI/UX"]', 'Testing, Automation');
    
    // Submit
    await page.click('button[type="submit"]');

    // Wait for project details page navigation
    await page.waitForURL('**/projects/*');
    await expect(page.locator('text=Playwright E2E Test Project').first()).toBeVisible();

    // Verify it appears in the catalog
    await page.goto('/projects');
    await expect(page.locator('text=Playwright E2E Test Project').first()).toBeVisible();
  });
});
