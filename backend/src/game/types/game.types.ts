export type Choice = 'rock' | 'paper' | 'scissors';
export type RoundResult = 'player1' | 'player2' | 'draw';

export interface ActiveRound {
  roomId: string;
  playerOneId: string;
  playerTwoId: string;
  playerOneChoice: Choice | null;
  playerTwoChoice: Choice | null;
}

export interface RoundResultPayload {
  playerOneId: string;
  playerTwoId: string;
  playerOneChoice: Choice;
  playerTwoChoice: Choice;
  winnerId: string | null;
  isDraw: boolean;
  scores: {
    [userId: string]: number;
  };
}
