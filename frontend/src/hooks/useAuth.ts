import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { authApi } from "@/api/auth";
import { useStores } from "@/stores/useStores";
import type { LoginRequest, RegisterRequest } from "@/types";

export type AuthMode = "login" | "register";

export const useAuth = () => {
  const navigate = useNavigate();
  const { authStore } = useStores();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const register = async (data: RegisterRequest) => {
    setError("");
    setLoading(true);

    try {
      const response = await authApi.register(data);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Registration failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: LoginRequest) => {
    setError("");
    setLoading(true);

    try {
      const response = await authApi.login(data);
      const { user, token } = response.data;

      authStore.setToken(token);
      authStore.setUser(user);
      navigate("/dashboard");

      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async (email: string) => {
    setError("");
    setLoading(true);

    try {
      const response = await authApi.resendVerification({ email });
      return { success: true, message: response.data.message };
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to resend verification email";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = () => {
    // Build OAuth URL - VITE_API_URL includes /api, so append /auth/google
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    window.location.href = `${apiUrl}/auth/google`;
  };

  const useOfflineMode = () => {
    navigate("/offline");
  };

  return {
    error,
    loading,
    setError,
    register,
    login,
    resendVerification,
    loginWithGoogle,
    useOfflineMode,
  };
};
