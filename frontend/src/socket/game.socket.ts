import { socket } from './socket.client'
import { EVENTS } from '@roshambo/shared'
import type { Choice, RoundResultPayload } from '@roshambo/shared'

export const gameSocket = {
  makeChoice: (choice: Choice) => socket.emit(EVENTS.GAME.CHOICE, { choice }),
  requestRestart: () => socket.emit(EVENTS.GAME.RESTART, {}),

  onOpponentChose: (cb: () => void) => {
    socket.on(EVENTS.GAME.OPPONENT_CHOSE, cb)
    return () => socket.off(EVENTS.GAME.OPPONENT_CHOSE, cb)
  },

  onRoundResult: (cb: (data: RoundResultPayload) => void) => {
    socket.on(EVENTS.GAME.ROUND_RESULT, cb)
    return () => socket.off(EVENTS.GAME.ROUND_RESULT, cb)
  },

  onRestartRequested: (cb: (data: { requestedBy: string }) => void) => {
    socket.on(EVENTS.GAME.RESTART_REQUESTED, cb)
    return () => socket.off(EVENTS.GAME.RESTART_REQUESTED, cb)
  },

  onStarted: (cb: () => void) => {
    socket.on(EVENTS.GAME.STARTED, cb)
    return () => socket.off(EVENTS.GAME.STARTED, cb)
  },

  onScoreUpdated: (cb: (data: { scores: { [userId: string]: number } }) => void) => {
    socket.on(EVENTS.GAME.SCORE_UPDATED, cb)
    return () => socket.off(EVENTS.GAME.SCORE_UPDATED, cb)
  },
}
