export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}


