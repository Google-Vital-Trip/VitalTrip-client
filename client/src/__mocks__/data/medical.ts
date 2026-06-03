import type { Medical } from '@/src/features/medical/types/medical';

export const mockMedicalList: Medical[] = [
  {
    name: '서울병원',
    address: '서울시 중구 을지로 100',
    phoneNumber: '02-1234-5678',
    latitude: 37.566,
    longitude: 126.978,
    distance: 300,
    openNow: true,
    opendingHours: ['09:00 - 18:00'],
    websiteUrl: 'https://hospital.com',
    imageUrl: '',
  },
  {
    name: '중구약국',
    address: '서울시 중구 명동길 10',
    phoneNumber: '02-9876-5432',
    latitude: 37.563,
    longitude: 126.982,
    distance: 800,
    openNow: false,
    opendingHours: ['10:00 - 20:00'],
    websiteUrl: '',
    imageUrl: '',
  },
];
