import { create } from 'zustand';
import type { Choice, RoundResultPayload } from '@roshambo/shared';

type GameStatus = 'idle' | 'choosing' | 'waiting_opponent' | 'round_result' | 'restart_requested';

interface GameState {
  status: GameStatus;
  myChoice: Choice | null;
  opponentChose: boolean;
  roundResult: RoundResultPayload | null;
  restartRequestedBy: string | null;
  sessionScores: { [userId: string]: number };
  historicalScores: { [userId: string]: number };
  setStatus: (status: GameStatus) => void;
  setMyChoice: (choice: Choice) => void;
  setOpponentChose: (value: boolean) => void;
  setRoundResult: (result: RoundResultPayload) => void;
  setRestartRequestedBy: (userId: string) => void;
  setSessionScores: (scores: { [userId: string]: number }) => void;
  setHistoricalScores: (scores: { [userId: string]: number }) => void;
  resetSessionScores: () => void;
  resetRound: () => void;
  resetAll: () => void;
}

export const gameStore = create<GameState>()((set) => ({
  status: 'idle',
  myChoice: null,
  opponentChose: false,
  roundResult: null,
  restartRequestedBy: null,
  sessionScores: {},
  historicalScores: {},
  setStatus: (status) => set({ status }),
  setMyChoice: (choice) => set({ myChoice: choice }),
  setOpponentChose: (value) => set({ opponentChose: value }),
  setRoundResult: (result) => set({ roundResult: result, status: 'round_result' }),
  setRestartRequestedBy: (userId) =>
    set({ restartRequestedBy: userId, status: 'restart_requested' }),
  setSessionScores: (scores) => set({ sessionScores: scores }),
  setHistoricalScores: (scores) => set({ historicalScores: scores }),
  resetSessionScores: () => set({ sessionScores: {} }),
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
      sessionScores: {},
    }),
}));
