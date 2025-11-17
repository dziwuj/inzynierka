import client from "./client";

export const authApi = {
  login: (email: string, password: string) =>
    client.post<{ accessToken: string }, { email: string; password: string }>(
      "/auth/login",
      { email, password },
      { skipAuth: true },
    ),

  refresh: () =>
    client.get<{ accessToken: string }>("/auth/refresh", { skipAuth: true }),

  logout: () => client.post("/auth/logout", {}, { skipAuth: true }),
};
