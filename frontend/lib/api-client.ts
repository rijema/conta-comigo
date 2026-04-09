import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token on every request
apiClient.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      Cookies.remove("access_token");
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);

// ─── Typed API helpers ─────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post("/auth/login", { email, password }),
  logout: () => apiClient.post("/auth/logout"),
  me: () => apiClient.get("/auth/me"),
};

export const sessionApi = {
  start: (learnerId: string) =>
    apiClient.post("/sessions/start", { learner_id: learnerId }),
  end: (sessionId: string, data: object) =>
    apiClient.post(`/sessions/${sessionId}/end`, data),
  getActive: (learnerId: string) =>
    apiClient.get(`/sessions/active/${learnerId}`),
};

export const activityApi = {
  getNext: (learnerId: string, sessionId: string) =>
    apiClient.get(`/activities/next`, {
      params: { learner_id: learnerId, session_id: sessionId },
    }),
  submitAttempt: (activityId: string, attempt: object) =>
    apiClient.post(`/activities/${activityId}/attempts`, attempt),
  getById: (activityId: string) => apiClient.get(`/activities/${activityId}`),
};

export const analyticsApi = {
  getLearnerSummary: (learnerId: string) =>
    apiClient.get(`/analytics/learner/${learnerId}/summary`),
  getSkillMastery: (learnerId: string) =>
    apiClient.get(`/analytics/learner/${learnerId}/skills`),
  getBNCCProgress: (learnerId: string) =>
    apiClient.get(`/analytics/learner/${learnerId}/bncc`),
};

export const profileApi = {
  getProfile: (learnerId: string) =>
    apiClient.get(`/profiles/learner/${learnerId}`),
  updatePreferences: (learnerId: string, prefs: object) =>
    apiClient.patch(`/profiles/learner/${learnerId}/preferences`, prefs),
};