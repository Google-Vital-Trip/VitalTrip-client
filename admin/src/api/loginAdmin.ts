import type { LoginRequest, LoginResponse } from 'src/types/auth';
import { httpClient } from 'src/utils/httpClient';

export const loginAdmin = async (formData: LoginRequest) => {
  return await httpClient.post<LoginResponse>('/auth/admin/login', formData);
};
