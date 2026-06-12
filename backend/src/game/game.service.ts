import { Injectable } from '@nestjs/common';
import { BadRequestError } from '../shared/exceptions/domain.exception.js';
import { GameRepository } from './game.repository.js';
import { GameStore } from './game.store.js';
import type {
  ActiveRound,
  Choice,
  RoundResult,
  RoundResultPayload,
} from './types/game.types.js';

@Injectable()
export class GameService {
  constructor(
    private readonly store: GameStore,
    private readonly repository: GameRepository,
  ) {}

  initRound(
    roomCode: string,
    roomId: string,
    playerOneId: string,
    playerTwoId: string,
  ): void {
    this.store.init(roomCode, { roomId, playerOneId, playerTwoId });
  }

  async makeChoice(
    roomCode: string,
    userId: string,
    choice: Choice,
  ): Promise<RoundResultPayload | null> {
    const round = this.store.get(roomCode);
    if (!round) throw new BadRequestError('Round not initialized');

    this.store.setChoice(roomCode, userId, choice);

    const updated = this.store.get(roomCode)!;
    if (updated.playerOneChoice === null || updated.playerTwoChoice === null) {
      return null;
    }

    const result = this.determineWinner(updated);
    const winnerId =
      result === 'player1'
        ? updated.playerOneId
        : result === 'player2'
          ? updated.playerTwoId
          : null;

    await this.repository.saveRound({
      roomId: updated.roomId,
      playerOneId: updated.playerOneId,
      playerTwoId: updated.playerTwoId,
      playerOneChoice: updated.playerOneChoice,
      playerTwoChoice: updated.playerTwoChoice,
      winnerId,
      finishedAt: new Date(),
    });

    if (winnerId) {
      await this.repository.updateParticipantScore(updated.roomId, winnerId);
      this.store.incrementSessionScore(roomCode, winnerId);
    }

    const scores = this.store.getSessionScores(roomCode);
    this.store.clear(roomCode);

    return {
      playerOneId: updated.playerOneId,
      playerTwoId: updated.playerTwoId,
      playerOneChoice: updated.playerOneChoice,
      playerTwoChoice: updated.playerTwoChoice,
      winnerId,
      isDraw: winnerId === null,
      scores,
    };
  }

  resetRound(roomCode: string): void {
    this.store.clear(roomCode);
  }

  resetSessionScores(roomCode: string): void {
    this.store.resetSessionScores(roomCode);
  }

  requestRestart(roomCode: string, userId: string): boolean {
    return this.store.requestRestart(roomCode, userId);
  }

  clearRestartRequests(roomCode: string): void {
    this.store.clearRestartRequests(roomCode);
  }

  getRoundState(roomCode: string): ActiveRound | undefined {
    return this.store.get(roomCode);
  }

  private determineWinner(round: ActiveRound): RoundResult {
    const { playerOneChoice, playerTwoChoice } = round;
    if (playerOneChoice === playerTwoChoice) return 'draw';
    if (
      (playerOneChoice === 'rock' && playerTwoChoice === 'scissors') ||
      (playerOneChoice === 'scissors' && playerTwoChoice === 'paper') ||
      (playerOneChoice === 'paper' && playerTwoChoice === 'rock')
    )
      return 'player1';
    return 'player2';
  }
}
