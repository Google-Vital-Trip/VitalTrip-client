import crypto from 'crypto';
import { verifySentrySignature } from '../verifySignature';

const CLIENT_SECRET = 'test-secret-key';

/** 테스트용 유효한 HMAC SHA-256 서명 생성 헬퍼 */
function generateValidSignature(rawBody: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
}

describe('verifySentrySignature', () => {
  describe('signatureHeader가 null인 경우', () => {
    it('null 서명 헤더에 대해 false를 반환한다', () => {
      expect(verifySentrySignature('body', null, CLIENT_SECRET)).toBe(false);
    });
  });

  describe('유효한 서명 검증', () => {
    it('올바른 서명에 대해 true를 반환한다', () => {
      const rawBody = '{"action":"resolved"}';
      const validSignature = generateValidSignature(rawBody, CLIENT_SECRET);

      expect(verifySentrySignature(rawBody, validSignature, CLIENT_SECRET)).toBe(true);
    });

    it('빈 body에 대한 유효한 서명도 검증한다', () => {
      const rawBody = '';
      const validSignature = generateValidSignature(rawBody, CLIENT_SECRET);

      expect(verifySentrySignature(rawBody, validSignature, CLIENT_SECRET)).toBe(true);
    });

    it('서명 헤더의 앞뒤 공백을 trim하고 검증한다', () => {
      const rawBody = '{"event":"test"}';
      const validSignature = generateValidSignature(rawBody, CLIENT_SECRET);

      // 앞뒤 공백이 있어도 정상 검증
      expect(verifySentrySignature(rawBody, `  ${validSignature}  `, CLIENT_SECRET)).toBe(true);
    });
  });

  describe('유효하지 않은 서명 검증', () => {
    it('잘못된 서명에 대해 false를 반환한다', () => {
      const rawBody = '{"action":"resolved"}';
      const invalidSignature = 'invalid-signature-string';

      expect(verifySentrySignature(rawBody, invalidSignature, CLIENT_SECRET)).toBe(false);
    });

    it('다른 secret으로 생성된 서명에 대해 false를 반환한다', () => {
      const rawBody = '{"action":"resolved"}';
      const signatureWithWrongSecret = generateValidSignature(rawBody, 'wrong-secret');

      expect(verifySentrySignature(rawBody, signatureWithWrongSecret, CLIENT_SECRET)).toBe(false);
    });

    it('body가 변조된 경우 false를 반환한다', () => {
      const originalBody = '{"action":"resolved"}';
      const tamperedBody = '{"action":"resolved","malicious":true}';
      const validSignature = generateValidSignature(originalBody, CLIENT_SECRET);

      expect(verifySentrySignature(tamperedBody, validSignature, CLIENT_SECRET)).toBe(false);
    });

    it('빈 문자열 서명 헤더에 대해 false를 반환한다', () => {
      const rawBody = '{"action":"resolved"}';

      expect(verifySentrySignature(rawBody, '', CLIENT_SECRET)).toBe(false);
    });
  });
});
