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

  public delete<ResponseType>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<ResponseType>> {
    return this.request<ResponseType>(endpoint, "DELETE", options);
  }

  public async upload(
    endpoint: string,
    formData: FormData,
  ): Promise<ApiResponse<unknown>> {
    const token = rootStore.authStore.accessToken;
    const authHeaders: Record<string, string> = {};
    if (token) {
      authHeaders["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: authHeaders,
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.message || "Upload failed");
    }

    const data = await response.json();
    return { data };
  }
}

const client = new ApiClient(API_URL);
export default client;
