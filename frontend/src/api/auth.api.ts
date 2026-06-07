import { apiClient } from './client';
import type { UserResponseDto } from '@roshambo/shared';

export const authApi = {
  register: (data: {
    username: string;
    password: string;
    email?: string;
  }): Promise<UserResponseDto> =>
    apiClient.post<UserResponseDto>('/auth/register', data).then((r) => r.data),

  login: (data: { username: string; password: string }): Promise<UserResponseDto> =>
    apiClient.post<UserResponseDto>('/auth/login', data).then((r) => r.data),

  logout: (): Promise<void> => apiClient.post<void>('/auth/logout').then((r) => r.data),

  refresh: (): Promise<UserResponseDto> =>
    apiClient.post<UserResponseDto>('/auth/refresh').then((r) => r.data),
};
