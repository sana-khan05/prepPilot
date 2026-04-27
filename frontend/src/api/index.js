import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
});

// ── Request Interceptor: attach token ──────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: handle errors ───────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // If 401 and not a retry attempt — try to refresh token
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        }
      } catch {
        // Refresh failed — clear auth and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ── Auth API ───────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  refreshToken: (token) => api.post('/auth/refresh', { refreshToken: token }),
};

// ── Resume API ─────────────────────────────────────────
export const resumeAPI = {
  upload: (formData, onProgress) =>
    api.post('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    }),
  getAll: () => api.get('/resumes'),
  getOne: (id) => api.get(`/resumes/${id}`),
  delete: (id) => api.delete(`/resumes/${id}`),
  updateLabel: (id, data) => api.put(`/resumes/${id}/label`, data),
  getStats: () => api.get('/resumes/stats'),
  download: (id) => api.get(`/resumes/${id}/download`, { responseType: 'blob' }),
};

// ── Dashboard API ──────────────────────────────────────
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
  getRecruiter: () => api.get('/dashboard/recruiter'),
};

// ── Interview API (Phase 3) ────────────────────────────
export const interviewAPI = {
  start: (data) => api.post('/interviews/start', data),
  getSession: (id) => api.get(`/interviews/${id}`),
  submitAnswer: (id, data) => api.post(`/interviews/${id}/answer`, data),
  complete: (id) => api.post(`/interviews/${id}/complete`),
  getAll: () => api.get('/interviews'),
};

export default api;
