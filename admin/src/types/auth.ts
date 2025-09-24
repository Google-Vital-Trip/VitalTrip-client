export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  data: {
    user: {
      id: number;
      email: string;
      name: string;
      role: 'USER' | 'ADMIN';
    };
  };
}
