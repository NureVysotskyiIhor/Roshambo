import { apiClient } from './client'
import type { RoomResponseDto, ParticipantDto } from '@roshambo/shared'

export const roomsApi = {
getMyRoom: (): Promise<RoomResponseDto> => {
  console.log('getMyRoom called')
    return apiClient.get<{ room: RoomResponseDto }>('/rooms/my')
    .then((r) => {
      console.log('getMyRoom response', r.data.room)
      return r.data.room
    })
},

  getParticipants: (roomId: string): Promise<ParticipantDto[]> =>
    apiClient.get<ParticipantDto[]>(`/rooms/${roomId}/participants`).then((r) => r.data),

  createRoom: (data: { name?: string }): Promise<RoomResponseDto> =>
    apiClient.post<RoomResponseDto>('/rooms', data).then((r) => r.data),

  joinRoom: (code: string): Promise<RoomResponseDto> =>
    apiClient.post<RoomResponseDto>(`/rooms/${code}/join`).then((r) => r.data),

  updateRoom: (code: string, data: { name: string }): Promise<RoomResponseDto> =>
    apiClient.patch<RoomResponseDto>(`/rooms/${code}`, data).then((r) => r.data),
}
