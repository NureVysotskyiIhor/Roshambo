import { useEffect } from 'react'
import type { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { EVENTS } from '@roshambo/shared'
import type { RoundResultPayload } from '@roshambo/shared'
import { socket } from '../socket/socket.client'
import { gameSocket } from '../socket/game.socket'
import { roomSocket } from '../socket/room.socket'
import { roomStore } from '../store/room.store'
import { gameStore } from '../store/game.store'
import { roomKeys } from '../queries/rooms.queries'
import { queryClient } from '../lib/query-client'
import { PATHS } from '../routes/paths'

export const LEAVE_REASON_MESSAGES: Record<string, string> = {
  host_left: 'Host left the room',
  host_disconnected: 'Host disconnected',
  opponent_left: 'Opponent left the room',
  opponent_disconnected: 'Opponent disconnected',
}

interface UseGameSocketParams {
  roomCode: string
  myId: string | undefined
  navigate: ReturnType<typeof useNavigate>
  onOpponentDisconnected: () => void
  onOpponentReconnected: () => void
  onWaitingForRestart: (value: boolean) => void
}

export function useGameSocket({
  roomCode,
  myId,
  navigate,
  onOpponentDisconnected,
  onOpponentReconnected,
  onWaitingForRestart,
}: UseGameSocketParams): void {
  // Connect socket + join room on mount
  useEffect(() => {
    if (!socket.connected) socket.connect()
    socket.emit(EVENTS.ROOM.JOIN, { code: roomCode })
  }, [roomCode])

  // Re-join the room after a socket reconnect (e.g. network blip) so the
  // server resyncs Socket.IO room membership for this client
  useEffect(() => {
    const handleReconnect = () => {
      socket.emit(EVENTS.ROOM.JOIN, { code: roomCode })
    }
    socket.io.on('reconnect', handleReconnect)
    return () => {
      socket.io.off('reconnect', handleReconnect)
    }
  }, [roomCode])

  // Socket event listeners
  useEffect(() => {
    const offStarted = gameSocket.onStarted(() => {
      gameStore.getState().resetRound()
      onWaitingForRestart(false)
    })

    const offOpponentChose = gameSocket.onOpponentChose(() => {
      gameStore.getState().setOpponentChose(true)
    })

    const offRoundResult = gameSocket.onRoundResult((result: RoundResultPayload) => {
      gameStore.getState().setRoundResult(result)
      gameStore.getState().setSessionScores(result.scores)
    })

    const offScoreUpdated = gameSocket.onScoreUpdated((data) => {
      gameStore.getState().setSessionScores(data.scores)
    })

    const offRestartRequested = gameSocket.onRestartRequested((data) => {
      gameStore.getState().setRestartRequestedBy(data.requestedBy)
    })

    const offPlayerJoined = roomSocket.onPlayerJoined((data) => {
      onOpponentReconnected()
      roomStore.getState().upsertParticipant(data.participant)
    })

    const offOpponentLeft = roomSocket.onOpponentLeft((data) => {
      onOpponentDisconnected()
      const remaining = roomStore.getState().participants.filter((p) => p.userId === myId)
      roomStore.getState().setParticipants(remaining)
      gameStore.getState().resetSessionScores()
      toast.info(LEAVE_REASON_MESSAGES[data.reason] ?? 'Opponent disconnected')
    })

    const offClosed = roomSocket.onClosed((data) => {
      toast.info(LEAVE_REASON_MESSAGES[data.reason] ?? 'Host disconnected')
      socket.disconnect()
      roomStore.getState().clearRoom()
      gameStore.getState().resetAll()
      queryClient.removeQueries({ queryKey: roomKeys.my() })
      void navigate({ to: PATHS.ROOMS_NEW })
    })

    const handleError = (data: { message: string }) => {
      toast.error(data?.message ?? 'Socket error')
    }
    socket.on(EVENTS.ERROR, handleError)

    return () => {
      offStarted()
      offOpponentChose()
      offRoundResult()
      offScoreUpdated()
      offRestartRequested()
      offPlayerJoined()
      offOpponentLeft()
      offClosed()
      socket.off(EVENTS.ERROR, handleError)
    }
  }, [navigate, myId, onOpponentDisconnected, onOpponentReconnected, onWaitingForRestart])
}
