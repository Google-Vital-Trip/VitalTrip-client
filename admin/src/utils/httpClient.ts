import type { FetchConfig } from '../types/http';
import { APIError } from './apiError';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason: unknown) => void }> = [];

async function refreshTokens(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/admin/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }
}

async function request<T = unknown>(url: string, config: FetchConfig = {}): Promise<T> {
  const { method = 'GET', headers = {}, body } = config;
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  const response = await fetch(fullUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401 && !url.includes('/auth/admin/refresh')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return request<T>(url, config);
        });
      }

      isRefreshing = true;

      try {
        await refreshTokens();

        failedQueue.forEach(({ resolve }) => {
          resolve(null);
        });
        failedQueue = [];

        isRefreshing = false;

        return request<T>(url, config);
      } catch (refreshError) {
        failedQueue.forEach(({ reject }) => {
          reject(refreshError);
        });
        failedQueue = [];
        isRefreshing = false;

        window.location.href = '/login';
        throw new APIError('Authentication failed', 401);
      }
    }

    const errorMessage = data.message || `HTTP ${response.status}`;
    throw new APIError(errorMessage, response.status);
  }

  return data;
}

export const httpClient = {
  get<T = unknown>(url: string, config?: Omit<FetchConfig, 'method'>): Promise<T> {
    return request<T>(url, { ...config, method: 'GET' });
  },

  post<T = unknown>(url: string, body?: unknown, config?: Omit<FetchConfig, 'method' | 'body'>): Promise<T> {
    return request<T>(url, { ...config, method: 'POST', body });
  },

  put<T = unknown>(url: string, body?: unknown, config?: Omit<FetchConfig, 'method' | 'body'>): Promise<T> {
    return request<T>(url, { ...config, method: 'PUT', body });
  },

  patch<T = unknown>(url: string, body?: unknown, config?: Omit<FetchConfig, 'method' | 'body'>): Promise<T> {
    return request<T>(url, { ...config, method: 'PATCH', body });
  },

  delete<T = unknown>(url: string, config?: Omit<FetchConfig, 'method'>): Promise<T> {
    return request<T>(url, { ...config, method: 'DELETE' });
  },

  getWithoutError(url: string, config?: Omit<FetchConfig, 'method'>): Promise<Response> {
    return requestWithoutError(url, { ...config, method: 'GET' });
  },
};

async function requestWithoutError(url: string, config: FetchConfig = {}): Promise<Response> {
  const { method = 'GET', headers = {}, body } = config;
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  return fetch(fullUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
}
