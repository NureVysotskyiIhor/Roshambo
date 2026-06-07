import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { queryClient } from '../lib/query-client';
import { authStore } from '../store/auth.store';

const BASE_URL = import.meta.env.VITE_API_URL as string;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequest | undefined;
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      originalRequest._retry = true;
      try {
        await apiClient.post('/auth/refresh');
        return await apiClient(originalRequest);
      } catch {
        authStore.getState().clearUser();
        queryClient.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  },
);
