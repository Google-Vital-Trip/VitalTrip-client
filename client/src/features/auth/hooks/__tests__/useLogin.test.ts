import { act, renderHook } from '@testing-library/react';
import { useLoginMutation } from '../../api/useLoginMutation';
import { useLogin } from '../useLogin';

jest.mock('../../api/useLoginMutation');

const mockMutateAsync = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useLoginMutation as jest.Mock).mockReturnValue({
    mutateAsync: mockMutateAsync,
    isPending: false,
    isError: false,
    error: null,
  });
});

describe('useLogin', () => {
  describe('초기 상태', () => {
    it('폼이 빈 상태로 시작한다', () => {
      const { result } = renderHook(() => useLogin());
      expect(result.current.loginForm).toEqual({ email: '', password: '' });
    });

    it('에러가 없는 상태로 시작한다', () => {
      const { result } = renderHook(() => useLogin());
      expect(result.current.invalidErrors).toEqual({ email: '', password: '' });
    });

    it('isValid가 false다', () => {
      const { result } = renderHook(() => useLogin());
      expect(result.current.isValid).toBeFalsy();
    });
  });

  describe('updateLoginForm - 이메일', () => {
    it('이메일 입력 시 폼이 업데이트된다', () => {
      const { result } = renderHook(() => useLogin());
      act(() => {
        result.current.updateLoginForm('email', 'test@example.com');
      });
      expect(result.current.loginForm.email).toBe('test@example.com');
    });

    it('유효한 이메일 입력 시 에러가 없다', () => {
      const { result } = renderHook(() => useLogin());
      act(() => {
        result.current.updateLoginForm('email', 'valid@example.com');
      });
      expect(result.current.invalidErrors.email).toBe('');
    });

    it('유효하지 않은 이메일 입력 시 에러가 설정된다', () => {
      const { result } = renderHook(() => useLogin());
      act(() => {
        result.current.updateLoginForm('email', 'not-an-email');
      });
      expect(result.current.invalidErrors.email).not.toBe('');
    });
  });

  describe('updateLoginForm - 비밀번호', () => {
    it('비밀번호 입력 시 폼이 업데이트된다', () => {
      const { result } = renderHook(() => useLogin());
      act(() => {
        result.current.updateLoginForm('password', 'Password1!');
      });
      expect(result.current.loginForm.password).toBe('Password1!');
    });

    it('유효한 비밀번호 입력 시 에러가 없다', () => {
      const { result } = renderHook(() => useLogin());
      act(() => {
        result.current.updateLoginForm('password', 'Password1!');
      });
      expect(result.current.invalidErrors.password).toBe('');
    });

    it('유효하지 않은 비밀번호 입력 시 에러가 설정된다', () => {
      const { result } = renderHook(() => useLogin());
      act(() => {
        result.current.updateLoginForm('password', 'weak');
      });
      expect(result.current.invalidErrors.password).not.toBe('');
    });
  });

  describe('isValid', () => {
    it('이메일과 비밀번호가 모두 유효하면 true다', () => {
      const { result } = renderHook(() => useLogin());
      act(() => {
        result.current.updateLoginForm('email', 'valid@example.com');
        result.current.updateLoginForm('password', 'Password1!');
      });
      expect(result.current.isValid).toBeTruthy();
    });

    it('이메일이 유효하지 않으면 false다', () => {
      const { result } = renderHook(() => useLogin());
      act(() => {
        result.current.updateLoginForm('email', 'invalid');
        result.current.updateLoginForm('password', 'Password1!');
      });
      expect(result.current.isValid).toBeFalsy();
    });

    it('비밀번호가 유효하지 않으면 false다', () => {
      const { result } = renderHook(() => useLogin());
      act(() => {
        result.current.updateLoginForm('email', 'valid@example.com');
        result.current.updateLoginForm('password', 'weak');
      });
      expect(result.current.isValid).toBeFalsy();
    });
  });

  describe('handleLoginSubmit', () => {
    it('폼 제출 시 mutateAsync가 현재 폼 데이터로 호출된다', async () => {
      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.updateLoginForm('email', 'test@example.com');
        result.current.updateLoginForm('password', 'Password1!');
      });

      const mockEvent = {
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>;

      await act(async () => {
        await result.current.handleLoginSubmit(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockMutateAsync).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password1!',
      });
    });

    it('mutation 실패 시에도 에러가 외부로 전파되지 않는다', async () => {
      mockMutateAsync.mockRejectedValueOnce(new Error('Network error'));
      const { result } = renderHook(() => useLogin());

      const mockEvent = {
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>;

      await expect(
        act(async () => {
          await result.current.handleLoginSubmit(mockEvent);
        }),
      ).resolves.not.toThrow();
    });
  });
});
