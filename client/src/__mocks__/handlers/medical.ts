import { http, HttpResponse } from 'msw';
import { mockMedicalList } from '../data/medical';

export { mockMedicalList } from '../data/medical';

export const medicalHandlers = [
  http.get('/api/medical', () => HttpResponse.json({ message: 'success', data: mockMedicalList })),
];
