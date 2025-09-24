import { httpClient } from '../utils/httpClient';

export const refreshToken = async () => {
  return await httpClient.post('/auth/admin/refresh');
};