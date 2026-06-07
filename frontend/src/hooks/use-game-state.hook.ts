import type { Choice, RoomResponseDto } from '@roshambo/shared';
import { roomStore } from '../store/room.store';
import { gameStore } from '../store/game.store';

const CHOICES: Choice[] = ['rock', 'paper', 'scissors'];

interface UseGameStateParams {
  myId: string | undefined;
  room: RoomResponseDto | null;
  opponentDisconnected: boolean;
}

export function useGameState({ myId, room, opponentDisconnected }: UseGameStateParams) {
  const participants = roomStore((s) => s.participants);
  const opponent = participants.find((p) => p.userId !== myId);
  const opponentId = opponent?.userId;
  const opponentUsername = opponent?.username ?? 'Opponent';
  const opponentAvatarUrl = opponent?.avatarUrl ?? '';

  const gameStatus = gameStore((s) => s.status);
  const myChoice = gameStore((s) => s.myChoice);
  const opponentChose = gameStore((s) => s.opponentChose);
  const roundResult = gameStore((s) => s.roundResult);
  const sessionScores = gameStore((s) => s.sessionScores);

  const myScore = sessionScores[myId ?? ''] ?? 0;
  const opponentScore = sessionScores[opponentId ?? ''] ?? 0;
  const roundNumber = myScore + opponentScore + 1;

  // room is part of the hook's contract for callers, but not used in derivations here
  void room;

  // Derived choices from round result
  const myRoundChoice: Choice | null = roundResult
    ? roundResult.playerOneId === myId
      ? roundResult.playerOneChoice
      : roundResult.playerTwoChoice
    : null;

  const opponentRoundChoice: Choice | null = roundResult
    ? roundResult.playerOneId === myId
      ? roundResult.playerTwoChoice
      : roundResult.playerOneChoice
    : null;

  // Result label for score circle
  let resultLabel: 'VICTORY' | 'DEFEAT' | 'DRAW' | 'FINAL' | undefined;
  if (opponentDisconnected) {
    resultLabel = 'FINAL';
  } else if (roundResult) {
    if (roundResult.isDraw) resultLabel = 'DRAW';
    else if (roundResult.winnerId === myId) resultLabel = 'VICTORY';
    else resultLabel = 'DEFEAT';
  }

  // Badge logic
  const myBadgeVariant: 'ready' | 'choosing' = myChoice ? 'ready' : 'choosing';
  const myBadgeText: string = myChoice ? 'Ready' : 'Your turn';

  let opponentBadgeVariant: 'ready' | 'choosing' | 'waiting' | 'disconnected';
  let opponentBadgeText: string;
  if (opponentDisconnected) {
    opponentBadgeVariant = 'disconnected';
    opponentBadgeText = 'Disconnected';
  } else if (opponentChose || roundResult) {
    opponentBadgeVariant = 'ready';
    opponentBadgeText = 'Ready';
  } else {
    opponentBadgeVariant = 'waiting';
    opponentBadgeText = 'Choosing...';
  }

  // Opponent card state
  let opponentCardState: 'waiting' | 'chosen' | 'revealed';
  if (roundResult && opponentRoundChoice) {
    opponentCardState = 'revealed';
  } else if (opponentChose) {
    opponentCardState = 'chosen';
  } else {
    opponentCardState = 'waiting';
  }

  // Score circle game state
  const circleGameState: 'playing' | 'round_result' | 'disconnected' = opponentDisconnected
    ? 'disconnected'
    : roundResult
      ? 'round_result'
      : 'playing';

  // Status text
  let myStatusText: string;
  if (roundResult && myRoundChoice) {
    myStatusText = myRoundChoice.charAt(0).toUpperCase() + myRoundChoice.slice(1);
  } else if (myChoice) {
    myStatusText = 'Your choice is made';
  } else {
    myStatusText = 'Choose your move';
  }

  let opponentStatusText: string;
  if (opponentDisconnected) {
    opponentStatusText = 'Left the game';
  } else if (roundResult && opponentRoundChoice) {
    opponentStatusText = opponentRoundChoice.charAt(0).toUpperCase() + opponentRoundChoice.slice(1);
  } else if (opponentChose) {
    opponentStatusText = 'Ready for round';
  } else {
    opponentStatusText = 'Making a choice...';
  }

  const showCards = gameStatus === 'choosing' || gameStatus === 'waiting_opponent';
  const showResult = roundResult !== null || opponentDisconnected;
  const otherChoices = CHOICES.filter((c) => c !== myChoice);

  return {
    opponent,
    opponentId,
    opponentUsername,
    opponentAvatarUrl,
    gameStatus,
    myChoice,
    opponentChose,
    roundResult,
    myScore,
    opponentScore,
    roundNumber,
    myRoundChoice,
    opponentRoundChoice,
    resultLabel,
    myBadgeVariant,
    myBadgeText,
    opponentBadgeVariant,
    opponentBadgeText,
    opponentCardState,
    circleGameState,
    myStatusText,
    opponentStatusText,
    showCards,
    showResult,
    otherChoices,
    CHOICES,
  };
}
