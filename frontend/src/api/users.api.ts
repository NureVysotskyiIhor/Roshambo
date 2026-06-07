import { apiClient } from './client';
import type { UserResponseDto, UpdateUserDto } from '@roshambo/shared';

export const usersApi = {
  getMe: (): Promise<UserResponseDto> =>
    apiClient.get<UserResponseDto>('/users/me').then((r) => r.data),

  updateMe: (data: UpdateUserDto): Promise<UserResponseDto> =>
    apiClient.patch<UserResponseDto>('/users/me', data).then((r) => r.data),
};
