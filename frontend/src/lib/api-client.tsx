const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, token } = options;

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
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  get: <T,>(endpoint: string, token?: string): Promise<T> =>
    request<T>(endpoint, { token }),

  post: <T,>(endpoint: string, body: unknown, token?: string): Promise<T> =>
    request<T>(endpoint, { method: "POST", body, token }),

  put: <T,>(endpoint: string, body: unknown, token?: string): Promise<T> =>
    request<T>(endpoint, { method: "PUT", body, token }),

  delete: <T,>(endpoint: string, token?: string): Promise<T> =>
    request<T>(endpoint, { method: "DELETE", token }),
};

export const apiClient = api;