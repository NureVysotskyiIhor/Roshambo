import axios from 'axios'
import { queryClient } from '../lib/query-client'
import { authStore } from '../store/auth.store'

const BASE_URL = import.meta.env.VITE_API_URL as string

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const originalRequest = error.config
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      originalRequest._retry = true
      try {
        await apiClient.post('/auth/refresh')
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return await apiClient(originalRequest)
      } catch {
        authStore.getState().clearUser()
        queryClient.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)
