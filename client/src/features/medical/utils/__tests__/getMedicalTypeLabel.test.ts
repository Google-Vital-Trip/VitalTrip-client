import { getMedicalTypeLabel } from '../getMedicalTypeLabel';
import { MedicalType } from '../../types/medical';

describe('getMedicalTypeLabel', () => {
  describe('t 함수 없이 호출 (fallback 모드)', () => {
    it('"hospital" 타입에 대해 "Hospital"을 반환한다', () => {
      expect(getMedicalTypeLabel('hospital')).toBe('Hospital');
    });

    it('"pharmacy" 타입에 대해 "Pharmacy"를 반환한다', () => {
      expect(getMedicalTypeLabel('pharmacy')).toBe('Pharmacy');
    });

    it('"emergency" 타입에 대해 "Emergency"를 반환한다', () => {
      expect(getMedicalTypeLabel('emergency')).toBe('Emergency');
    });

    it('알 수 없는 타입에 대해 타입 값 자체를 반환한다', () => {
      expect(getMedicalTypeLabel('unknown' as MedicalType)).toBe('unknown');
    });
  });

  describe('t 함수와 함께 호출 (i18n 모드)', () => {
    it('t 함수를 통해 번역 키를 호출한다', () => {
      const mockT = jest.fn().mockReturnValue('병원');
      const result = getMedicalTypeLabel('hospital', mockT as any);

      expect(mockT).toHaveBeenCalledWith('medical.types.hospital');
      expect(result).toBe('병원');
    });

    it('pharmacy 타입에 올바른 번역 키를 사용한다', () => {
      const mockT = jest.fn().mockReturnValue('약국');
      const result = getMedicalTypeLabel('pharmacy', mockT as any);

      expect(mockT).toHaveBeenCalledWith('medical.types.pharmacy');
      expect(result).toBe('약국');
    });

    it('emergency 타입에 올바른 번역 키를 사용한다', () => {
      const mockT = jest.fn().mockReturnValue('응급실');
      const result = getMedicalTypeLabel('emergency', mockT as any);

      expect(mockT).toHaveBeenCalledWith('medical.types.emergency');
      expect(result).toBe('응급실');
    });

    it('t 함수가 주어지면 fallback switch 대신 t 함수 결과를 반환한다', () => {
      const mockT = jest.fn().mockReturnValue('Hospital (EN)');
      const result = getMedicalTypeLabel('hospital', mockT as any);

      // fallback인 'Hospital'이 아닌 t 함수 반환값을 사용
      expect(result).toBe('Hospital (EN)');
    });
  });
});
