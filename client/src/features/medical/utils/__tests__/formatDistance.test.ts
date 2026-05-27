import { formatDistance } from '../formatDistance';

describe('formatDistance', () => {
  describe('미터 단위 표시 (distance < 1000)', () => {
    it('0m를 "0m"으로 반환한다', () => {
      expect(formatDistance(0)).toBe('0m');
    });

    it('정수 거리를 "Nm" 형식으로 반환한다', () => {
      expect(formatDistance(500)).toBe('500m');
    });

    it('999m를 "999m"으로 반환한다', () => {
      expect(formatDistance(999)).toBe('999m');
    });

    it('소수점 거리를 반올림하여 반환한다', () => {
      expect(formatDistance(123.4)).toBe('123m');
      expect(formatDistance(123.5)).toBe('124m');
      expect(formatDistance(999.9)).toBe('1000m');
    });
  });

  describe('킬로미터 단위 표시 (distance >= 1000)', () => {
    it('정확히 1000m를 "1.0km"으로 반환한다', () => {
      expect(formatDistance(1000)).toBe('1.0km');
    });

    it('1500m를 "1.5km"으로 반환한다', () => {
      expect(formatDistance(1500)).toBe('1.5km');
    });

    it('10000m를 "10.0km"으로 반환한다', () => {
      expect(formatDistance(10000)).toBe('10.0km');
    });

    it('소수점 첫째 자리까지 표시한다', () => {
      expect(formatDistance(1234)).toBe('1.2km');
      expect(formatDistance(9876)).toBe('9.9km');
    });

    it('JavaScript 부동소수점 특성을 그대로 반영한다', () => {
      // 1950 / 1000 = 1.95이지만 부동소수점 표현상 1.9로 나옴
      expect(formatDistance(1950)).toBe('1.9km');
      expect(formatDistance(1940)).toBe('1.9km'); // 1.94 → 1.9
      expect(formatDistance(2000)).toBe('2.0km'); // 정확히 2.0
    });
  });
});
