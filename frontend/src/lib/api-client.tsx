const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, token, signal } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!response.ok) {
    const payload = await response.text();
    let message = `HTTP ${response.status}`;
    if (payload) {
      try {
        const error = JSON.parse(payload) as { message?: string };
        message = error.message || message;
      } catch {
        message = payload;
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  const payload = await response.text();
  return payload ? JSON.parse(payload) as T : undefined as T;
}

export const api = {
  get: <T,>(endpoint: string, token?: string): Promise<T> =>
    request<T>(endpoint, { token }),

  post: <T,>(endpoint: string, body: unknown, token?: string, signal?: AbortSignal): Promise<T> =>
    request<T>(endpoint, { method: "POST", body, token, signal }),

  put: <T,>(endpoint: string, body: unknown, token?: string): Promise<T> =>
    request<T>(endpoint, { method: "PUT", body, token }),

  patch: <T,>(endpoint: string, body: unknown, token?: string): Promise<T> =>
    request<T>(endpoint, { method: "PATCH", body, token }),

  delete: <T,>(endpoint: string, token?: string): Promise<T> =>
    request<T>(endpoint, { method: "DELETE", token }),
};

export const apiClient = api;
