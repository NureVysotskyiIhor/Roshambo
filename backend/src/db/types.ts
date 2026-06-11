import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { roomParticipants, rooms, rounds, users } from './schema.js';
import type * as schema from './schema.js';

export type Database = NodePgDatabase<typeof schema>;

export type UserRecord = typeof users.$inferSelect;
export type RoomRecord = typeof rooms.$inferSelect;
export type RoomParticipantRecord = typeof roomParticipants.$inferSelect;
export type RoundRecord = typeof rounds.$inferSelect;

export type UserInsert = typeof users.$inferInsert;
export type RoomInsert = typeof rooms.$inferInsert;
export type RoomParticipantInsert = typeof roomParticipants.$inferInsert;
export type RoundInsert = typeof rounds.$inferInsert;

export interface ParticipantWithUser {
  userId: string;
  username: string;
  avatarUrl: string;
  score: number;
  role: string;
  joinedAt: Date;
}
