import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ResendVerificationRequest,
  ResendVerificationResponse,
  VerifyEmailResponse,
} from "@/types";

import client from "./client";

export const authApi = {
  /**
   * Register a new user account
   */
  register: (data: RegisterRequest) =>
    client.post<RegisterResponse, RegisterRequest>("/auth/register", data, {
      skipAuth: true,
    }),

  /**
   * Login with username/email and password
   */
  login: (data: LoginRequest) =>
    client.post<LoginResponse, LoginRequest>("/auth/login", data, {
      skipAuth: true,
    }),

  /**
   * Verify email address with token
   */
  verifyEmail: (token: string) =>
    client.get<VerifyEmailResponse>(`/auth/verify-email?token=${token}`, {
      skipAuth: true,
    }),

  /**
   * Resend verification email
   */
  resendVerification: (data: ResendVerificationRequest) =>
    client.post<ResendVerificationResponse, ResendVerificationRequest>(
      "/auth/resend-verification",
      data,
      { skipAuth: true },
    ),

  /**
   * Logout and invalidate session
   */
  logout: () => client.post("/auth/logout", {}, { skipAuth: true }),
};
