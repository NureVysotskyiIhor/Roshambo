import { useState } from 'react'
import type { useNavigate } from '@tanstack/react-router'
import { EVENTS } from '@roshambo/shared'
import type { Choice } from '@roshambo/shared'
import { socket } from '../socket/socket.client'
import { gameSocket } from '../socket/game.socket'
import { roomStore } from '../store/room.store'
import { gameStore } from '../store/game.store'
import { roomKeys } from '../queries/rooms.queries'
import { queryClient } from '../lib/query-client'
import { PATHS } from '../routes/paths'

interface UseGameActionsParams {
  roomCode: string | undefined
  navigate: ReturnType<typeof useNavigate>
}

export function useGameActions({ roomCode, navigate }: UseGameActionsParams) {
  const [waitingForRestart, setWaitingForRestart] = useState(false)

  const handleChoice = (choice: Choice) => {
    const state = gameStore.getState()
    if (state.myChoice && state.opponentChose) return
    gameStore.getState().setMyChoice(choice)
    gameSocket.makeChoice(choice)
    gameStore.getState().setStatus('waiting_opponent')
  }

  const handlePlayAgain = () => {
    if (waitingForRestart) return
    setWaitingForRestart(true)
    gameSocket.requestRestart()
  }

  const handleExit = () => {
    const finish = () => {
      socket.disconnect()
      roomStore.getState().clearRoom()
      gameStore.getState().resetAll()
      queryClient.removeQueries({ queryKey: roomKeys.my() })
      void navigate({ to: PATHS.ROOMS_NEW })
    }

    const timeout = setTimeout(finish, 3000)

    socket.emit(EVENTS.ROOM.LEFT, {}, async () => {
      clearTimeout(timeout)
      finish()
    })
  }

  void roomCode

  return { handleChoice, handlePlayAgain, handleExit, waitingForRestart, setWaitingForRestart }
}
