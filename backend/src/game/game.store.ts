import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import type { ActiveRound, Choice } from './types/game.types.js';

@Injectable()
export class GameStore {
  private readonly rounds = new Map<string, ActiveRound>();

  init(roomCode: string, data: Omit<ActiveRound, 'playerOneChoice' | 'playerTwoChoice'>): void {
    this.rounds.set(roomCode, { ...data, playerOneChoice: null, playerTwoChoice: null });
  }

  get(roomCode: string): ActiveRound | undefined {
    return this.rounds.get(roomCode);
  }

  setChoice(roomCode: string, userId: string, choice: Choice): void {
    const round = this.rounds.get(roomCode);
    if (!round) return;

    if (round.playerOneChoice !== null && round.playerTwoChoice !== null) {
      throw new WsException('Round already completed');
    }

    if (round.playerOneId === userId) {
      round.playerOneChoice = choice;
    } else if (round.playerTwoId === userId) {
      round.playerTwoChoice = choice;
    } else {
      throw new WsException('Not a player in this room');
    }
  }

  clear(roomCode: string): void {
    this.rounds.delete(roomCode);
  }
}
