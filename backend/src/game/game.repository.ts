import { Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { roomParticipants, rounds } from '../db/schema.js';
import type { RoundInsert, RoundRecord } from '../db/types.js';

type CreateRoundData = Pick<
  RoundInsert,
  | 'roomId'
  | 'playerOneId'
  | 'playerTwoId'
  | 'playerOneChoice'
  | 'playerTwoChoice'
  | 'winnerId'
  | 'finishedAt'
>;

@Injectable()
export class GameRepository {
  async saveRound(data: CreateRoundData): Promise<RoundRecord> {
    const [round] = await db.insert(rounds).values(data).returning();
    return round;
  }

  async updateParticipantScore(roomId: string, userId: string): Promise<void> {
    await db
      .update(roomParticipants)
      .set({ score: sql`${roomParticipants.score} + 1` })
      .where(
        and(
          eq(roomParticipants.roomId, roomId),
          eq(roomParticipants.userId, userId),
        ),
      );
  }

  getParticipantScores(roomId: string): Promise<{ userId: string; score: number }[]> {
    return db
      .select({ userId: roomParticipants.userId, score: roomParticipants.score })
      .from(roomParticipants)
      .where(eq(roomParticipants.roomId, roomId));
  }

  async resetScores(roomId: string): Promise<void> {
    await db
      .update(roomParticipants)
      .set({ score: 0 })
      .where(eq(roomParticipants.roomId, roomId));
  }
}
