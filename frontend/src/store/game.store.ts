import { create } from 'zustand'
import type { Choice, RoundResultPayload } from '@roshambo/shared'

type GameStatus =
  | 'idle'
  | 'choosing'
  | 'waiting_opponent'
  | 'round_result'
  | 'restart_requested'

interface GameState {
  status: GameStatus
  myChoice: Choice | null
  opponentChose: boolean
  roundResult: RoundResultPayload | null
  restartRequestedBy: string | null
  scores: { [userId: string]: number }
  setStatus: (status: GameStatus) => void
  setMyChoice: (choice: Choice) => void
  setOpponentChose: (value: boolean) => void
  setRoundResult: (result: RoundResultPayload) => void
  setRestartRequestedBy: (userId: string) => void
  setScores: (scores: { [userId: string]: number }) => void
  resetRound: () => void
  resetAll: () => void
}

export const gameStore = create<GameState>()((set) => ({
  status: 'idle',
  myChoice: null,
  opponentChose: false,
  roundResult: null,
  restartRequestedBy: null,
  scores: {},
  setStatus: (status) => set({ status }),
  setMyChoice: (choice) => set({ myChoice: choice }),
  setOpponentChose: (value) => set({ opponentChose: value }),
  setRoundResult: (result) => set({ roundResult: result, status: 'round_result' }),
  setRestartRequestedBy: (userId) =>
    set({ restartRequestedBy: userId, status: 'restart_requested' }),
  setScores: (scores) => set({ scores }),
  resetRound: () =>
    set({
      status: 'choosing',
      myChoice: null,
      opponentChose: false,
      roundResult: null,
      restartRequestedBy: null,
    }),
  resetAll: () =>
    set({
      status: 'idle',
      myChoice: null,
      opponentChose: false,
      roundResult: null,
      restartRequestedBy: null,
      scores: {},
    }),
}))
