import { apiClient } from './client'
import type { RoomResponseDto } from '@roshambo/shared'

export const roomsApi = {
  getMyRoom: (): Promise<RoomResponseDto> =>
    apiClient.get<{ room: RoomResponseDto }>('/rooms/my').then((r) => r.data.room),

  createRoom: (data: { name?: string }): Promise<RoomResponseDto> =>
    apiClient.post<RoomResponseDto>('/rooms', data).then((r) => r.data),

  joinRoom: (code: string): Promise<RoomResponseDto> =>
    apiClient.post<RoomResponseDto>(`/rooms/${code}/join`).then((r) => r.data),

  updateRoom: (code: string, data: { name: string }): Promise<RoomResponseDto> =>
    apiClient.patch<RoomResponseDto>(`/rooms/${code}`, data).then((r) => r.data),
}
