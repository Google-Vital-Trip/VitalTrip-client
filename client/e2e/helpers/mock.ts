import { Locator, Page } from '@playwright/test';

// LanguageSelectionModal은 localStorage에 'user-set-language'가 없으면
// portal backdrop을 열어 모든 클릭을 차단함. page.goto() 전에 반드시 호출.
export async function setupPage(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('user-set-language', 'true');
  });
}

export const MOCK_ENCYCLOPEDIA_ITEMS = [
  {
    id: 1,
    title: 'Fever',
    altTitles: ['Pyrexia', 'High temperature'],
    summary: 'A temporary increase in body temperature, often caused by an illness.',
    categories: ['infectious'],
    url: '',
  },
  {
    id: 2,
    title: 'Headache',
    altTitles: ['Cephalgia'],
    summary: 'Pain or discomfort in the head, scalp, or neck.',
    categories: ['neurological'],
    url: '',
  },
  {
    id: 3,
    title: 'Fracture',
    altTitles: ['Broken bone'],
    summary: 'A crack or complete break in a bone.',
    categories: ['injury'],
    url: '',
  },
];

export const MOCK_LANGUAGES = [
  { language: 'en', name: 'English' },
  { language: 'ko', name: 'Korean' },
  { language: 'ja', name: 'Japanese' },
  { language: 'zh', name: 'Chinese (Simplified)' },
  { language: 'es', name: 'Spanish' },
];

export async function mockAuthAPIs(page: Page) {
  await page.route('**/api/auth/isLoggedIn', (route) =>
    route.fulfill({ json: { isLoggedIn: false } }),
  );

  await page.route('**/api/auth/login', (route) =>
    route.fulfill({
      status: 401,
      json: { message: 'The email or password is incorrect' },
    }),
  );

  await page.route('**/api/auth/check-email**', (route) =>
    route.fulfill({ json: { available: true } }),
  );

  await page.route('**/api/auth/signup', (route) =>
    route.fulfill({ status: 201, json: { message: 'Signup success' } }),
  );
}

export async function mockEncyclopediaAPI(page: Page) {
  await page.route('**/api/encyclopedia**', (route) =>
    route.fulfill({
      json: {
        message: 'success',
        data: {
          total: MOCK_ENCYCLOPEDIA_ITEMS.length,
          items: MOCK_ENCYCLOPEDIA_ITEMS,
        },
      },
    }),
  );
}

export async function mockTranslateAPI(page: Page) {
  await page.route('**/api/translate', async (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ json: MOCK_LANGUAGES });
    }
    return route.fulfill({
      json: { translatedText: '두통이 있습니다', detectedSourceLanguage: 'en' },
    });
  });
}
