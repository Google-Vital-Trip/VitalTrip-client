import { http, HttpResponse } from 'msw';

export const authHandlers = [
  http.post('/api/auth/login', () =>
    HttpResponse.json({
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        birthDate: '1990-01-01',
        countryCode: '+82',
        phoneNumber: '01012345678',
        profileImageUrl: null,
      },
    }),
  ),

  http.post('/api/auth/signup', () => HttpResponse.json({ message: 'success' }, { status: 201 })),
];
