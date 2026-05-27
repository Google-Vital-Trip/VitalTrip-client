import { APIError } from '../apiError';

describe('APIError', () => {
  it('Error를 상속한다', () => {
    const error = new APIError('Not Found', 404);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(APIError);
  });

  it('name이 "APIError"로 설정된다', () => {
    const error = new APIError('Not Found', 404);
    expect(error.name).toBe('APIError');
  });

  it('전달한 message를 올바르게 저장한다', () => {
    const error = new APIError('Unauthorized', 401);
    expect(error.message).toBe('Unauthorized');
  });

  it('전달한 status 코드를 올바르게 저장한다', () => {
    const error = new APIError('Unauthorized', 401);
    expect(error.status).toBe(401);
  });

  describe('HTTP 상태 코드별 시나리오', () => {
    it('400 Bad Request를 올바르게 생성한다', () => {
      const error = new APIError('Bad Request', 400);
      expect(error.message).toBe('Bad Request');
      expect(error.status).toBe(400);
    });

    it('401 Unauthorized를 올바르게 생성한다', () => {
      const error = new APIError('Unauthorized', 401);
      expect(error.status).toBe(401);
    });

    it('403 Forbidden을 올바르게 생성한다', () => {
      const error = new APIError('Forbidden', 403);
      expect(error.status).toBe(403);
    });

    it('404 Not Found를 올바르게 생성한다', () => {
      const error = new APIError('Not Found', 404);
      expect(error.status).toBe(404);
    });

    it('500 Internal Server Error를 올바르게 생성한다', () => {
      const error = new APIError('Internal Server Error', 500);
      expect(error.status).toBe(500);
    });
  });

  it('try/catch로 잡을 수 있다', () => {
    expect(() => {
      throw new APIError('Something went wrong', 500);
    }).toThrow('Something went wrong');
  });

  it('catch 블록에서 APIError 인스턴스인지 확인할 수 있다', () => {
    try {
      throw new APIError('Not Found', 404);
    } catch (error) {
      expect(error).toBeInstanceOf(APIError);
      if (error instanceof APIError) {
        expect(error.status).toBe(404);
      }
    }
  });
});
