const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  /** Internal: set on the retried call after a 401 refresh, to prevent refresh loops. */
  _isRetry?: boolean;
}

// Access tokens are short-lived (1h in production). Sessions routinely outlive
// that — e.g. a professional's "atendimento" with a child, or just a long
// dashboard session — so a bare 401 must not be a dead end. When a request
// fails with 401, we transparently redeem the refresh token for a new access
// token and retry once before giving up. Without this, callers that swallow
// errors (`.catch(console.error)`) were silently left showing stale/empty
// data (e.g. "Alunos (0)") instead of the real list, with no visible error.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        if (!data?.accessToken) return null;
        localStorage.setItem("access_token", data.accessToken);
        if (data.refreshToken) localStorage.setItem("refresh_token", data.refreshToken);
        return data.accessToken as string;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, token, signal, headers: extraHeaders = {}, _isRetry = false } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
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

  if (response.status === 401 && token && !_isRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(endpoint, { method, body, token: newToken, signal, headers: extraHeaders, _isRetry: true });
    }
  }

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

  post: <T,>(endpoint: string, body: unknown, token?: string, signal?: AbortSignal, headers?: Record<string, string>): Promise<T> =>
    request<T>(endpoint, { method: "POST", body, token, signal, headers }),

  put: <T,>(endpoint: string, body: unknown, token?: string): Promise<T> =>
    request<T>(endpoint, { method: "PUT", body, token }),

  patch: <T,>(endpoint: string, body: unknown, token?: string): Promise<T> =>
    request<T>(endpoint, { method: "PATCH", body, token }),

  delete: <T,>(endpoint: string, token?: string): Promise<T> =>
    request<T>(endpoint, { method: "DELETE", token }),
};

export const apiClient = api;
