// User types
export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  is_admin: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

// Auth request types
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ResendVerificationRequest {
  email: string;
}

// Auth response types
export interface RegisterResponse {
  user: User;
  message: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface VerifyEmailResponse {
  message: string;
}

export interface ResendVerificationResponse {
  message: string;
}

export interface RefreshResponse {
  accessToken: string;
}
