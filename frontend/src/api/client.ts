import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { queryClient } from '../lib/query-client';
import { authStore } from '../store/auth.store';
import { router } from '../routes';

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
        if (originalRequest.url?.includes('/users/me')) {
          // Bootstrap check — useGetMe catches this and resolves with
          // data: null. Don't clear the query cache or navigate out
          // from under the in-flight ['me'] query.
          return Promise.reject(error);
        }
        queryClient.clear();
        void router.navigate({ to: '/login' });
        return Promise.reject(error)
      }
    }
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  },
);
