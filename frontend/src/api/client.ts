import { rootStore } from "@/stores/Root.store";

const API_URL = import.meta.env.VITE_API_URL;

interface RequestOptions<BodyType = unknown> {
  headers?: Record<string, string>;
  body?: BodyType;
  skipAuth?: boolean;
}

interface ErrorResponse {
  error: string;
  message: string;
}

interface ApiResponse<ResponseType> {
  data: ResponseType;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<ResponseType, BodyType = unknown>(
    endpoint: string,
    method: string,
    options: RequestOptions<BodyType> = {},
  ): Promise<ApiResponse<ResponseType>> {
    const { headers = {}, body, skipAuth = false } = options;

    const authHeaders: Record<string, string> = {};
    const token = rootStore.authStore.accessToken;
    if (token && !skipAuth) {
      authHeaders["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers: {
        ...headers,
        ...authHeaders,
      },
      credentials: "include",
    };

    if (body) {
      config.body = JSON.stringify(body);
      config.headers = {
        ...config.headers,
        "Content-Type": "application/json",
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);

      const data = (await response.json()) as ResponseType | ErrorResponse;

      if (!response.ok) {
        // Only try to refresh token if we got a 401 on an authenticated request
        if (response.status === 401 && !skipAuth) {
          const refreshed = await rootStore.authStore.refresh();
          if (refreshed) {
            return this.request<ResponseType, BodyType>(
              endpoint,
              method,
              options,
            );
          }
        }

        throw new Error(
          `API Error: ${(data as ErrorResponse).error || (data as ErrorResponse).message || response.statusText}`,
        );
      }

      return { data: data as ResponseType };
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  public get<ResponseType>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<ResponseType>> {
    return this.request<ResponseType>(endpoint, "GET", options);
  }

  public post<ResponseType, BodyType>(
    endpoint: string,
    body: BodyType,
    options?: RequestOptions<BodyType>,
  ): Promise<ApiResponse<ResponseType>> {
    return this.request<ResponseType, BodyType>(endpoint, "POST", {
      ...options,
      body,
    });
  }

  public put<ResponseType, BodyType>(
    endpoint: string,
    body: BodyType,
    options?: RequestOptions<BodyType>,
  ): Promise<ApiResponse<ResponseType>> {
    return this.request<ResponseType, BodyType>(endpoint, "PUT", {
      ...options,
      body,
    });
  }

  public patch<ResponseType, BodyType>(
    endpoint: string,
    body: BodyType,
    options?: RequestOptions<BodyType>,
  ): Promise<ApiResponse<ResponseType>> {
    return this.request<ResponseType, BodyType>(endpoint, "PATCH", {
      ...options,
      body,
    });
  }

  public delete<ResponseType>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<ResponseType>> {
    return this.request<ResponseType>(endpoint, "DELETE", options);
  }
}

const client = new ApiClient(API_URL);
export default client;
