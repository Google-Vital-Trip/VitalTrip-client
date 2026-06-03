import { BrowserContext, Page } from '@playwright/test';

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

export const MOCK_MEDICAL_LIST = [
  {
    name: '서울대학교병원',
    address: '서울특별시 종로구 대학로 101',
    phoneNumber: '02-2072-2114',
    latitude: 37.5796,
    longitude: 126.9988,
    distance: 350,
    openNow: true,
    opendingHours: ['09:00 - 18:00'],
    websiteUrl: 'https://www.snuh.org',
    imageUrl: '',
  },
  {
    name: '종로약국',
    address: '서울특별시 종로구 종로 100',
    phoneNumber: '02-123-4567',
    latitude: 37.5706,
    longitude: 126.991,
    distance: 820,
    openNow: false,
    opendingHours: ['10:00 - 20:00'],
    websiteUrl: '',
    imageUrl: '',
  },
];

export async function mockMedicalAPI(page: Page, data = MOCK_MEDICAL_LIST) {
  await page.route('**/api/medical**', (route) =>
    route.fulfill({ json: { message: 'success', data } }),
  );
}

// Google Maps SDK 로딩을 차단 — mapInstance가 null로 유지되지만
// MedicalList는 mapInstance와 독립적이므로 테스트에 영향 없음.
export async function blockGoogleMaps(page: Page) {
  await page.route('**maps.googleapis.com/**', (route) => route.abort());
}

export async function setupHomePageContext(page: Page, context: BrowserContext) {
  await setupPage(page);
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 37.5665, longitude: 126.978 });
  await blockGoogleMaps(page);
  await page.route('**/api/auth/isLoggedIn', (route) =>
    route.fulfill({ json: { isLoggedIn: false } }),
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
