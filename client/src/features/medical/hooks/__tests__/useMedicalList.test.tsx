import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { mockMedicalList } from '../../../../__mocks__/data/medical';
import { useMedicalList } from '../useMedicalList';

jest.mock('../../../../shared/hooks/useCurrentLocation', () => ({
  useCurrentLocation: () => ({
    coords: { latitude: 37.5665, longitude: 126.978 },
  }),
}));

jest.mock('../../../../shared/lib/i18n', () => ({
  i18n: { language: 'ko' },
}));

jest.mock('../../../../shared/utils/httpClient', () => ({
  httpClient: {
    get: jest.fn(),
  },
}));

import { httpClient } from '../../../../shared/utils/httpClient';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  (httpClient.get as jest.Mock).mockResolvedValue({ data: mockMedicalList });
});

describe('useMedicalList', () => {
  describe('초기 상태', () => {
    it('medicalType이 hospital로 시작한다', () => {
      const { result } = renderHook(() => useMedicalList(), { wrapper: createWrapper() });
      expect(result.current.medicalType).toBe('hospital');
    });

    it('radius가 1000으로 시작한다', () => {
      const { result } = renderHook(() => useMedicalList(), { wrapper: createWrapper() });
      expect(result.current.radius).toBe(1000);
    });
  });

  describe('handleMedicalTypeChange', () => {
    it('pharmacy로 변경하면 medicalType이 업데이트된다', () => {
      const { result } = renderHook(() => useMedicalList(), { wrapper: createWrapper() });
      act(() => {
        result.current.handleMedicalTypeChange('pharmacy');
      });
      expect(result.current.medicalType).toBe('pharmacy');
    });

    it('emergency로 변경하면 medicalType이 업데이트된다', () => {
      const { result } = renderHook(() => useMedicalList(), { wrapper: createWrapper() });
      act(() => {
        result.current.handleMedicalTypeChange('emergency');
      });
      expect(result.current.medicalType).toBe('emergency');
    });
  });

  describe('handleRadiusChange', () => {
    it('radius를 2000으로 변경하면 업데이트된다', () => {
      const { result } = renderHook(() => useMedicalList(), { wrapper: createWrapper() });
      act(() => {
        result.current.handleRadiusChange(2000);
      });
      expect(result.current.radius).toBe(2000);
    });
  });

  describe('데이터 페칭', () => {
    it('API 응답 데이터를 올바르게 반환한다', async () => {
      const { result } = renderHook(() => useMedicalList(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.medicalList).toEqual(mockMedicalList);
    });

    it('API 에러 시 error 상태가 설정된다', async () => {
      (httpClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useMedicalList(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
    });

    it('medicalType 변경 시 새로운 쿼리가 실행된다', async () => {
      const { result } = renderHook(() => useMedicalList(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.handleMedicalTypeChange('pharmacy');
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(httpClient.get).toHaveBeenCalledTimes(2);
    });
  });
});
