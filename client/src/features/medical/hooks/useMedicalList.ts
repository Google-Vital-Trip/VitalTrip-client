import { i18n } from '@/src/shared/lib/i18n';
import { useCurrentLocation } from '@/src/shared/hooks/useCurrentLocation';
import { useState } from 'react';
import { useMedicalListQuery } from '../api/useMedicalListQuery';
import { MedicalType } from '../types/medical';

export const useMedicalList = () => {
  const { coords } = useCurrentLocation();
  const [medicalType, setMedicalType] = useState<MedicalType>('hospital');
  const [radius, setRadius] = useState<number>(1000);

  const handleMedicalTypeChange = (type: MedicalType) => {
    setMedicalType(type);
  };

  const handleRadiusChange = (radius: number) => {
    setRadius(radius);
  };

  const {
    data: medicalList,
    isLoading,
    error,
  } = useMedicalListQuery({
    latitude: coords?.latitude ?? 37.5665,
    longitude: coords?.longitude ?? 126.978,
    type: medicalType,
    radius,
    language: i18n.language,
  });

  return {
    medicalList,
    medicalType,
    radius,
    isLoading,
    error,
    handleMedicalTypeChange,
    handleRadiusChange,
  };
};
