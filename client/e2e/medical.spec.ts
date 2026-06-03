import { test, expect } from '@playwright/test';
import { mockMedicalAPI, setupHomePageContext, MOCK_MEDICAL_LIST } from './helpers/mock';

test.describe('의료시설 찾기 (Medical)', () => {
  test.beforeEach(async ({ page, context }) => {
    await setupHomePageContext(page, context);
    await mockMedicalAPI(page);
  });

  test.describe('홈 페이지 진입', () => {
    test('사이드 패널 토글 버튼이 표시된다', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('button', { name: '☰' })).toBeVisible();
    });

    test('토글 버튼 클릭 시 사이드 패널이 열린다', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: '☰' }).click();
      await expect(page.getByText('Medical Facilities')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Find healthcare services near you')).toBeVisible({
        timeout: 10000,
      });
    });

    test('사이드 패널 닫기(✕) 버튼이 동작한다', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: '☰' }).click();
      await page.getByRole('button', { name: '✕' }).click();
      await expect(page.getByRole('button', { name: '☰' })).toBeVisible();
    });
  });

  test.describe('병원 목록 렌더링', () => {
    test('API 응답 데이터가 목록으로 렌더링된다', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: '☰' }).click();

      await expect(page.getByText('서울대학교병원')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('종로약국')).toBeVisible();
    });

    test('병원 카드에 거리·영업 상태·전화번호가 표시된다', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: '☰' }).click();

      await expect(page.getByText('서울대학교병원')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('350m')).toBeVisible();
      await expect(page.getByText('Open Now').first()).toBeVisible();
      await expect(page.locator('a[href="tel:02-2072-2114"]')).toBeVisible();
    });

    test('영업 중인 병원과 영업 종료 병원 상태가 각각 표시된다', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: '☰' }).click();

      await expect(page.getByText('서울대학교병원')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Open Now')).toBeVisible();
      await expect(page.getByText('Closed')).toBeVisible();
    });

    test('목록 상단에 조회된 시설 수와 반경이 표시된다', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: '☰' }).click();

      await expect(page.getByText('서울대학교병원')).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByText(new RegExp(`${MOCK_MEDICAL_LIST.length}.*hospital`, 'i')),
      ).toBeVisible();
      await expect(page.getByText(/Within 1km radius/i)).toBeVisible();
    });
  });

  test.describe('시설 타입 필터', () => {
    test('초기 선택 타입은 Hospital이다', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: '☰' }).click();

      await expect(page.getByText('Facility Type')).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('button', { name: 'Hospital' })).toHaveClass(/bg-blue-600/);
    });

    test('Pharmacy 버튼 클릭 시 활성화된다', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: '☰' }).click();

      await expect(page.getByText('Facility Type')).toBeVisible({ timeout: 10000 });
      await page.getByRole('button', { name: 'Pharmacy' }).click();
      await expect(page.getByRole('button', { name: 'Pharmacy' })).toHaveClass(/bg-blue-600/);
      await expect(page.getByRole('button', { name: 'Hospital' })).not.toHaveClass(/bg-blue-600/);
    });

    test('Emergency 버튼 클릭 시 활성화된다', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: '☰' }).click();

      await expect(page.getByText('Facility Type')).toBeVisible({ timeout: 10000 });
      await page.getByRole('button', { name: 'Emergency' }).click();
      await expect(page.getByRole('button', { name: 'Emergency' })).toHaveClass(/bg-blue-600/);
    });
  });

  test.describe('검색 반경', () => {
    test('기본 반경이 1km로 표시된다', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: '☰' }).click();

      await expect(page.getByText('Search Radius')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('1km').first()).toBeVisible();
    });
  });

  test.describe('예외 상태', () => {
    test('API 에러 시 에러 메시지가 표시된다', async ({ page }) => {
      await page.route('**/api/medical**', (route) =>
        route.fulfill({ status: 500, json: { message: 'Internal Server Error' } }),
      );

      await page.goto('/');
      await page.getByRole('button', { name: '☰' }).click();

      await expect(page.getByText('Something went wrong')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Please try again later')).toBeVisible();
    });

    test('결과 없을 시 안내 메시지가 표시된다', async ({ page }) => {
      await page.route('**/api/medical**', (route) =>
        route.fulfill({ json: { message: 'success', data: [] } }),
      );

      await page.goto('/');
      await page.getByRole('button', { name: '☰' }).click();

      await expect(page.getByText(/No hospitals found nearby/i)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/Try increasing the search radius/i)).toBeVisible();
    });
  });
});
