export interface User {
  id: number;
  email: string;
  name: string;
  birthDate: string;
  countryCode: string;
  phoneNumber: string;
  profileImageUrl: string | null;
  provider: 'LOCAL' | 'GOOGLE';
  providerId: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse {
  message: string;
  data: {
    content: User[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    hasContent: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface UserListParams {
  page?: number;
  size?: number;
}