import { test, expect } from '@playwright/test';
import { setupPage, mockAuthAPIs, mockTranslateAPI } from './helpers/mock';

test.describe('AI 번역 (Translate)', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await mockAuthAPIs(page);
    await mockTranslateAPI(page);
    await page.goto('/translate');
  });

  test('페이지 렌더링', async ({ page }) => {
    await expect(page.locator('main')).toBeVisible();
  });

  test('소스 텍스트 입력 영역 존재', async ({ page }) => {
    await expect(page.locator('textarea').first()).toBeVisible();
  });

  test('텍스트 입력', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await textarea.fill('I have a headache and fever');
    await expect(textarea).toHaveValue('I have a headache and fever');
  });

test('번역 결과 표시 (mock 응답)', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await textarea.pressSequentially('I have a headache');

    const translateBtn = page
      .locator('button')
      .filter({ hasText: /translate|번역/i })
      .first();

    // sourceText React state 반영 후 버튼 활성화까지 대기
    await expect(translateBtn).toBeEnabled({ timeout: 5_000 });
    await translateBtn.click();
    await expect(page.getByText('두통이 있습니다')).toBeVisible({ timeout: 5_000 });
  });

  test('언어 목록 GET /api/translate 호출', async ({ page }) => {
    // 페이지 로드 시 언어 목록을 가져오는 요청 발생
    const langRequest = page.waitForRequest(
      (req) => req.url().includes('/api/translate') && req.method() === 'GET',
    );
    await page.goto('/translate');
    await expect(langRequest).resolves.toBeTruthy();
  });
});
