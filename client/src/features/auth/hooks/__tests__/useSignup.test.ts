import { act, renderHook } from '@testing-library/react';
import { useCompleteAppleProfileMutation } from '../../api/useCompleteAppleProfileMutation';
import { useSignupGoogleMutation } from '../../api/useSignupGoogleMutation';
import { useSignupMutation } from '../../api/useSignupMutation';
import { useSignup } from '../useSignup';

jest.mock('../../api/useSignupMutation');
jest.mock('../../api/useSignupGoogleMutation');
jest.mock('../../api/useCompleteAppleProfileMutation');

const mockSignupUser = jest.fn();
const mockGoogleUser = jest.fn();
const mockAppleProfile = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useSignupMutation as jest.Mock).mockReturnValue({
    mutateAsync: mockSignupUser,
    isPending: false,
    error: null,
  });
  (useSignupGoogleMutation as jest.Mock).mockReturnValue({
    mutateAsync: mockGoogleUser,
    isPending: false,
    error: null,
  });
  (useCompleteAppleProfileMutation as jest.Mock).mockReturnValue({
    mutateAsync: mockAppleProfile,
    isPending: false,
    error: null,
  });
});

describe('useSignup', () => {
  describe('초기 상태', () => {
    it('폼이 빈 상태로 시작한다', () => {
      const { result } = renderHook(() => useSignup());
      expect(result.current.signupForm).toEqual({
        email: '',
        password: '',
        passwordConfirm: '',
        name: '',
        birthDate: '',
        countryCode: '',
        phoneNumber: '',
      });
    });

    it('isFirstStepValid가 false다', () => {
      const { result } = renderHook(() => useSignup());
      expect(result.current.isFirstStepValid).toBe(false);
    });

    it('isSecondStepValid가 false다', () => {
      const { result } = renderHook(() => useSignup());
      expect(result.current.isSecondStepValid).toBe(false);
    });
  });

  describe('isFirstStepValid', () => {
    it('이메일/비밀번호/비밀번호 확인이 모두 유효하면 true다', () => {
      const { result } = renderHook(() => useSignup());
      // passwordConfirm 검증이 클로저로 password를 읽으므로 순서대로 별도 act 사용
      act(() => {
        result.current.handleFormChange('email', 'test@example.com');
        result.current.handleFormChange('password', 'Password1!');
      });
      act(() => {
        result.current.handleFormChange('passwordConfirm', 'Password1!');
      });
      expect(result.current.isFirstStepValid).toBe(true);
    });

    it('비밀번호가 일치하지 않으면 false다', () => {
      const { result } = renderHook(() => useSignup());
      act(() => {
        result.current.handleFormChange('email', 'test@example.com');
        result.current.handleFormChange('password', 'Password1!');
      });
      act(() => {
        result.current.handleFormChange('passwordConfirm', 'Different1!');
      });
      expect(result.current.isFirstStepValid).toBe(false);
    });

    it('이메일이 유효하지 않으면 false다', () => {
      const { result } = renderHook(() => useSignup());
      act(() => {
        result.current.handleFormChange('email', 'not-an-email');
        result.current.handleFormChange('password', 'Password1!');
      });
      act(() => {
        result.current.handleFormChange('passwordConfirm', 'Password1!');
      });
      expect(result.current.isFirstStepValid).toBe(false);
    });
  });

  describe('isSecondStepValid', () => {
    it('이름/생년월일/국가코드/전화번호가 모두 입력되면 true다', () => {
      const { result } = renderHook(() => useSignup());
      act(() => {
        result.current.handleFormChange('name', 'John');
        result.current.handleFormChange('birthDate', '1990-01-01');
        result.current.handleFormChange('countryCode', '+82');
        result.current.handleFormChange('phoneNumber', '01012345678');
      });
      expect(result.current.isSecondStepValid).toBe(true);
    });

    it('이름이 유효하지 않으면 false다', () => {
      const { result } = renderHook(() => useSignup());
      act(() => {
        result.current.handleFormChange('name', 'A');
        result.current.handleFormChange('birthDate', '1990-01-01');
        result.current.handleFormChange('countryCode', '+82');
        result.current.handleFormChange('phoneNumber', '01012345678');
      });
      expect(result.current.isSecondStepValid).toBe(false);
    });

    it('필수 필드가 하나라도 비어있으면 false다', () => {
      const { result } = renderHook(() => useSignup());
      act(() => {
        result.current.handleFormChange('name', 'John');
        result.current.handleFormChange('birthDate', '1990-01-01');
        // countryCode, phoneNumber 누락
      });
      expect(result.current.isSecondStepValid).toBe(false);
    });
  });

  describe('handleSubmit', () => {
    it('provider 없이 호출하면 일반 회원가입 mutation이 실행된다', async () => {
      const { result } = renderHook(() => useSignup());
      await act(async () => {
        await result.current.handleSubmit();
      });
      expect(mockSignupUser).toHaveBeenCalled();
      expect(mockGoogleUser).not.toHaveBeenCalled();
      expect(mockAppleProfile).not.toHaveBeenCalled();
    });

    it('provider가 google이면 구글 회원가입 mutation이 실행된다', async () => {
      const { result } = renderHook(() => useSignup());
      await act(async () => {
        await result.current.handleSubmit('google');
      });
      expect(mockGoogleUser).toHaveBeenCalled();
      expect(mockSignupUser).not.toHaveBeenCalled();
    });

    it('provider가 apple이면 애플 프로필 완성 mutation이 실행된다', async () => {
      const { result } = renderHook(() => useSignup());
      await act(async () => {
        await result.current.handleSubmit('apple');
      });
      expect(mockAppleProfile).toHaveBeenCalled();
      expect(mockSignupUser).not.toHaveBeenCalled();
    });

    it('google/apple 제출 시 프로필 데이터(name, birthDate, countryCode, phoneNumber)만 전달된다', async () => {
      const { result } = renderHook(() => useSignup());
      act(() => {
        result.current.handleFormChange('name', 'John');
        result.current.handleFormChange('birthDate', '1990-01-01');
        result.current.handleFormChange('countryCode', '+82');
        result.current.handleFormChange('phoneNumber', '01012345678');
      });

      await act(async () => {
        await result.current.handleSubmit('google');
      });

      expect(mockGoogleUser).toHaveBeenCalledWith({
        name: 'John',
        birthDate: '1990-01-01',
        countryCode: '+82',
        phoneNumber: '01012345678',
      });
    });
  });
});
