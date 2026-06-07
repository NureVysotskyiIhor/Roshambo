import { useEffect } from 'react'
import type { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { EVENTS } from '@roshambo/shared'
import type { RoomResponseDto, ParticipantDto } from '@roshambo/shared'
import { socket } from '../socket/socket.client'
import { roomStore } from '../store/room.store'
import { authStore } from '../store/auth.store'

export const STATUS_BADGES: Record<
  RoomResponseDto['status'],
  { label: string; color: string; background: string; border: string }
> = {
  waiting: {
    label: 'Waiting',
    color: 'var(--color-draw)',
    background: 'rgba(245, 158, 11, 0.15)',
    border: '1px solid rgba(245, 158, 11, 0.4)',
  },
  in_progress: {
    label: 'In progress',
    color: 'var(--color-scissors)',
    background: 'rgba(34, 197, 94, 0.15)',
    border: '1px solid rgba(34, 197, 94, 0.4)',
  },
  finished: {
    label: 'Finished',
    color: 'var(--color-text-muted)',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid var(--color-border)',
  },
}

interface UseRoomSocketParams {
  existingRoom: RoomResponseDto | null | undefined
  sessionRoom: RoomResponseDto | null
  navigate: ReturnType<typeof useNavigate>
  onOpponentLeft: (name: string) => void
  markNavigatedToGame: () => void
}

export function useRoomSocket({
  existingRoom,
  sessionRoom,
  navigate,
  onOpponentLeft,
  markNavigatedToGame,
}: UseRoomSocketParams): void {
  const user = authStore((s) => s.user)
  const currentRoom = sessionRoom ?? existingRoom ?? null
  const pageState = currentRoom ? 'waiting' : 'create'

  // Connect socket when existing room found on mount
  useEffect(() => {
    if (existingRoom && !sessionRoom) {
      socket.connect()
      socket.emit(EVENTS.ROOM.JOIN, { code: existingRoom.code })
    }
  }, [existingRoom, sessionRoom])

  // Socket listeners — set up and cleaned up when in waiting state
  useEffect(() => {
    if (pageState !== 'waiting' || !currentRoom) return

    const handleJoined = (data: { room: RoomResponseDto; participant: ParticipantDto }) => {
      roomStore.getState().setRoom(data.room)
      roomStore.getState().addParticipant(data.participant)
      if (data.room.status === 'in_progress') {
        markNavigatedToGame()
        void navigate({ to: '/rooms/$code', params: { code: data.room.code } })
      }
    }

    const handlePlayerJoined = (data: { participant: ParticipantDto }) => {
      markNavigatedToGame()
      roomStore.getState().upsertParticipant(data.participant)
      void navigate({ to: '/rooms/$code', params: { code: currentRoom.code } })
    }

    const handleOpponentLeft = () => {
      const participants = roomStore.getState().participants
      const opponent = participants.find((p) => p.userId !== user?.id)
      onOpponentLeft(opponent?.username ?? '')
    }

    const handleError = (data: { message: string }) => {
      toast.error(data?.message ?? 'Socket error')
    }

    socket.on(EVENTS.ROOM.JOINED, handleJoined)
    socket.on(EVENTS.ROOM.PLAYER_JOINED, handlePlayerJoined)
    socket.on(EVENTS.ROOM.OPPONENT_LEFT, handleOpponentLeft)
    socket.on(EVENTS.ERROR, handleError)

    return () => {
      socket.off(EVENTS.ROOM.JOINED, handleJoined)
      socket.off(EVENTS.ROOM.PLAYER_JOINED, handlePlayerJoined)
      socket.off(EVENTS.ROOM.OPPONENT_LEFT, handleOpponentLeft)
      socket.off(EVENTS.ERROR, handleError)
    }
  }, [pageState, currentRoom, navigate, user?.id, onOpponentLeft, markNavigatedToGame])
}
