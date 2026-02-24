import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const TOKEN_KEY = 'jwt_token';
const TOKEN_EXPIRATION_KEY = 'jwt_token_expiration';
const REFRESH_TOKEN_KEY = 'refresh_token';
const REFRESH_TOKEN_EXPIRATION_KEY = 'refresh_token_expiration';

const api = axios.create({
  baseURL: '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Token helpers ---

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(token: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

  // Decode JWT to get expiration
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    localStorage.setItem(TOKEN_EXPIRATION_KEY, String(payload.exp * 1000));
  } catch {
    // ignore decode error
  }
  try {
    const payload = JSON.parse(atob(refreshToken.split('.')[1]));
    localStorage.setItem(REFRESH_TOKEN_EXPIRATION_KEY, String(payload.exp * 1000));
  } catch {
    // ignore decode error
  }
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRATION_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_EXPIRATION_KEY);
}

export function isTokenValid(): boolean {
  const token = getToken();
  const expiration = localStorage.getItem(TOKEN_EXPIRATION_KEY);
  if (!token || !expiration) return false;
  return Date.now() < Number(expiration) - 2000; // 2s buffer
}

export function isRefreshTokenValid(): boolean {
  const token = getRefreshToken();
  const expiration = localStorage.getItem(REFRESH_TOKEN_EXPIRATION_KEY);
  if (!token || !expiration) return false;
  return Date.now() < Number(expiration) - 2000;
}

// --- Request interceptor: inject JWT ---

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token && !config.url?.includes('/api/noauth/') && !config.url?.includes('/api/auth/token')) {
    config.headers.set('X-Authorization', `Bearer ${token}`);
  }
  return config;
});

// --- Response interceptor: handle 401 with token refresh ---

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else if (token) {
      p.resolve(token);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry auth endpoints
      if (originalRequest.url?.includes('/api/auth/login') || originalRequest.url?.includes('/api/auth/token')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.set('X-Authorization', `Bearer ${token}`);
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken || !isRefreshTokenValid()) {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post('/api/auth/token', { refreshToken });
        const { token, refreshToken: newRefreshToken } = response.data;
        setTokens(token, newRefreshToken);
        processQueue(null, token);
        originalRequest.headers.set('X-Authorization', `Bearer ${token}`);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
