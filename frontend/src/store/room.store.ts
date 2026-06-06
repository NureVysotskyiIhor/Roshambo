import { create } from 'zustand'
import type { RoomResponseDto, ParticipantDto } from '@roshambo/shared'

interface RoomState {
  room: RoomResponseDto | null
  participants: ParticipantDto[]
  setRoom: (room: RoomResponseDto) => void
  setParticipants: (participants: ParticipantDto[]) => void
  addParticipant: (participant: ParticipantDto) => void
  clearRoom: () => void
}

export const roomStore = create<RoomState>()((set) => ({
  room: null,
  participants: [],
  setRoom: (room) => set({ room }),
  setParticipants: (participants) => set({ participants }),
  addParticipant: (participant) =>
    set((state) => ({ participants: [...state.participants, participant] })),
  clearRoom: () => set({ room: null, participants: [] }),
}))
