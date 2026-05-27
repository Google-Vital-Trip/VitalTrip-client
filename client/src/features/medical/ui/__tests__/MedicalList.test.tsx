import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MedicalList from '../MedicalList';
import { Medical } from '../../types/medical';

// ── 외부 의존성 모킹 ────────────────────────────────────────────────────

jest.mock('../../../../shared/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'medical.title': 'Medical Facilities',
        'medical.subtitle': 'Find healthcare services near you',
        'medical.facility_type': 'Facility Type',
        'medical.search_radius': 'Search Radius',
        'medical.searching': 'Searching nearby facilities',
        'medical.please_wait': 'Please wait a moment...',
        'medical.something_wrong': 'Something went wrong',
        'medical.try_again': 'Please try again later',
        'medical.no_facilities_found': `No ${opts?.type}s found nearby`,
        'medical.try_increase_radius': 'Try increasing the search radius',
        'medical.facilities_found': `${opts?.count} ${opts?.type}${opts?.plural} found`,
        'medical.within_radius': `Within ${opts?.radius}km radius`,
        'medical.open_now': 'Open Now',
        'medical.closed': 'Closed',
        'medical.visit_website': 'Visit Website',
        'medical.types.hospital': 'Hospital',
        'medical.types.pharmacy': 'Pharmacy',
        'medical.types.emergency': 'Emergency',
      };
      return translations[key] ?? key;
    },
    i18n: { language: 'en' },
  }),
  i18n: { language: 'en' },
}));

jest.mock('../../../../shared/hooks/useHydration', () => ({
  useHydration: () => true,
}));

jest.mock('../../hooks/useMedicalList');

// ── 테스트 데이터 ────────────────────────────────────────────────────────

const mockHospital: Medical = {
  name: 'Seoul General Hospital',
  address: '123 Main St, Seoul',
  phoneNumber: '02-1234-5678',
  latitude: 37.5665,
  longitude: 126.978,
  distance: 350,
  openNow: true,
  opendingHours: ['Mon-Fri: 09:00-18:00'],
  websiteUrl: 'https://hospital.example.com',
  imageUrl: '',
};

const mockPharmacy: Medical = {
  name: 'City Pharmacy',
  address: '456 Side St, Seoul',
  phoneNumber: '02-9876-5432',
  latitude: 37.567,
  longitude: 126.979,
  distance: 1500,
  openNow: false,
  opendingHours: [],
  websiteUrl: '',
  imageUrl: '',
};

// ── 헬퍼 ────────────────────────────────────────────────────────────────

const { useMedicalList } = jest.requireMock('../../hooks/useMedicalList');

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderMedicalList() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MedicalList />
    </QueryClientProvider>,
  );
}

// ── 테스트 ───────────────────────────────────────────────────────────────

describe('MedicalList 컴포넌트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('로딩 상태', () => {
    it('isLoading이 true이면 로딩 스피너와 텍스트를 표시한다', () => {
      useMedicalList.mockReturnValue({
        medicalList: undefined,
        medicalType: 'hospital',
        radius: 1000,
        isLoading: true,
        error: null,
        handleMedicalTypeChange: jest.fn(),
        handleRadiusChange: jest.fn(),
      });

      renderMedicalList();

      expect(screen.getByText('Searching nearby facilities')).toBeInTheDocument();
      expect(screen.getByText('Please wait a moment...')).toBeInTheDocument();
    });
  });

  describe('에러 상태', () => {
    it('error가 있으면 에러 메시지를 표시한다', () => {
      useMedicalList.mockReturnValue({
        medicalList: undefined,
        medicalType: 'hospital',
        radius: 1000,
        isLoading: false,
        error: new Error('Network Error'),
        handleMedicalTypeChange: jest.fn(),
        handleRadiusChange: jest.fn(),
      });

      renderMedicalList();

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Please try again later')).toBeInTheDocument();
    });
  });

  describe('빈 목록 상태', () => {
    it('결과가 없을 때 안내 메시지를 표시한다', () => {
      useMedicalList.mockReturnValue({
        medicalList: [],
        medicalType: 'hospital',
        radius: 1000,
        isLoading: false,
        error: null,
        handleMedicalTypeChange: jest.fn(),
        handleRadiusChange: jest.fn(),
      });

      renderMedicalList();

      expect(screen.getByText('No hospitals found nearby')).toBeInTheDocument();
      expect(screen.getByText('Try increasing the search radius')).toBeInTheDocument();
    });
  });

  describe('데이터 렌더링', () => {
    beforeEach(() => {
      useMedicalList.mockReturnValue({
        medicalList: [mockHospital, mockPharmacy],
        medicalType: 'hospital',
        radius: 2000,
        isLoading: false,
        error: null,
        handleMedicalTypeChange: jest.fn(),
        handleRadiusChange: jest.fn(),
      });
    });

    it('병원 이름을 렌더링한다', () => {
      renderMedicalList();
      expect(screen.getByText('Seoul General Hospital')).toBeInTheDocument();
      expect(screen.getByText('City Pharmacy')).toBeInTheDocument();
    });

    it('거리를 올바른 형식으로 렌더링한다 (350m, 1.5km)', () => {
      renderMedicalList();
      expect(screen.getByText('350m')).toBeInTheDocument();
      expect(screen.getByText('1.5km')).toBeInTheDocument();
    });

    it('영업 상태 배지를 렌더링한다', () => {
      renderMedicalList();
      expect(screen.getByText('Open Now')).toBeInTheDocument();
      expect(screen.getByText('Closed')).toBeInTheDocument();
    });

    it('전화번호 링크를 렌더링한다', () => {
      renderMedicalList();
      const phoneLink = screen.getByText('02-1234-5678');
      expect(phoneLink).toHaveAttribute('href', 'tel:02-1234-5678');
    });

    it('웹사이트 링크를 렌더링한다', () => {
      renderMedicalList();
      const websiteLink = screen.getByText('Visit Website');
      expect(websiteLink).toHaveAttribute('href', 'https://hospital.example.com');
    });
  });

  describe('시설 타입 버튼 (i18n)', () => {
    beforeEach(() => {
      useMedicalList.mockReturnValue({
        medicalList: [],
        medicalType: 'hospital',
        radius: 1000,
        isLoading: false,
        error: null,
        handleMedicalTypeChange: jest.fn(),
        handleRadiusChange: jest.fn(),
      });
    });

    it('세 가지 시설 타입 버튼을 렌더링한다', () => {
      renderMedicalList();
      expect(screen.getByText('Hospital')).toBeInTheDocument();
      expect(screen.getByText('Pharmacy')).toBeInTheDocument();
      expect(screen.getByText('Emergency')).toBeInTheDocument();
    });

    it('현재 선택된 타입 버튼에 활성 스타일이 적용된다', () => {
      renderMedicalList();
      const hospitalBtn = screen.getByText('Hospital').closest('button');
      expect(hospitalBtn).toHaveClass('bg-blue-600');
    });

    it('다른 타입 버튼 클릭 시 handleMedicalTypeChange를 호출한다', () => {
      const handleMedicalTypeChange = jest.fn();
      useMedicalList.mockReturnValue({
        medicalList: [],
        medicalType: 'hospital',
        radius: 1000,
        isLoading: false,
        error: null,
        handleMedicalTypeChange,
        handleRadiusChange: jest.fn(),
      });

      renderMedicalList();
      fireEvent.click(screen.getByText('Pharmacy'));
      expect(handleMedicalTypeChange).toHaveBeenCalledWith('pharmacy');
    });
  });

  describe('헤더 텍스트 (i18n)', () => {
    it('페이지 제목과 부제목을 렌더링한다', () => {
      useMedicalList.mockReturnValue({
        medicalList: [],
        medicalType: 'hospital',
        radius: 1000,
        isLoading: false,
        error: null,
        handleMedicalTypeChange: jest.fn(),
        handleRadiusChange: jest.fn(),
      });

      renderMedicalList();

      expect(screen.getByText('Medical Facilities')).toBeInTheDocument();
      expect(screen.getByText('Find healthcare services near you')).toBeInTheDocument();
    });
  });
});
