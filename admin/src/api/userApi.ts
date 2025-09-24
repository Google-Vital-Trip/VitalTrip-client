import { httpClient } from '../utils/httpClient';
import type { UserListParams, UserListResponse } from '../types/user';

export const getUserList = async (params: UserListParams = {}): Promise<UserListResponse> => {
  const { page = 0, size = 20 } = params;
  const queryParams = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  return await httpClient.get<UserListResponse>(`/admin/users?${queryParams.toString()}`);
};
