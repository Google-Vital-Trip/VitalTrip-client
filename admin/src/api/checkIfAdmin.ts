import { httpClient } from '../utils/httpClient';

interface AdminMeResponse {
  message: string;
  data: {
    isAdmin: boolean;
  };
}

export const checkIfAdmin = async (): Promise<AdminMeResponse> => {
  return await httpClient.get<AdminMeResponse>('/admin/me');
};
