import { test, expect } from '@playwright/test';
import {
  setupPage,
  mockAuthAPIs,
  mockEncyclopediaAPI,
  MOCK_ENCYCLOPEDIA_ITEMS,
} from './helpers/mock';

test.describe('응급 사전 (Encyclopedia)', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await mockAuthAPIs(page);
    await mockEncyclopediaAPI(page);
    await page.goto('/encyclopedia');
  });

  test('페이지 타이틀', async ({ page }) => {
    await expect(page).toHaveTitle(/응급 사전.*Vital Trip/i);
  });

  test('검색 input 렌더링', async ({ page }) => {
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('검색어 입력 시 /api/encyclopedia 호출', async ({ page }) => {
    const searchInput = page.locator('input').first();

    const [request] = await Promise.all([
      page.waitForRequest('**/api/encyclopedia**'),
      searchInput.pressSequentially('fever'),
    ]);

    expect(request.url()).toContain('search=fever');
  });

  test('검색어 지우기', async ({ page }) => {
    const searchInput = page.locator('input').first();
    await searchInput.fill('test');
    await page.waitForTimeout(400);
    await searchInput.clear();
    await expect(searchInput).toHaveValue('');
  });

  test('카테고리 버튼이 여러 개 렌더링', async ({ page }) => {
    const buttons = page.locator('button');
    await expect(buttons.first()).toBeVisible();
    expect(await buttons.count()).toBeGreaterThan(1);
  });
});
