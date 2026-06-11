import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE } from '../db/db.constants.js';
import { roomParticipants, rooms, users } from '../db/schema.js';
import type {
  Database,
  ParticipantWithUser,
  RoomInsert,
  RoomParticipantRecord,
  RoomRecord,
} from '../db/types.js';

type CreateRoomData = Pick<RoomInsert, 'code' | 'creatorId'> & {
  name?: string;
};

@Injectable()
export class RoomsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  findByCode(code: string): Promise<RoomRecord | null> {
    return this.db.query.rooms
      .findFirst({ where: eq(rooms.code, code) })
      .then((row) => row ?? null);
  }

  findByCreatorId(creatorId: string): Promise<RoomRecord | null> {
    return this.db.query.rooms
      .findFirst({
        where: eq(rooms.creatorId, creatorId),
        orderBy: (rooms, { desc }) => [desc(rooms.createdAt)],
      })
      .then((row) => row ?? null);
  }

  create(data: CreateRoomData): Promise<RoomRecord> {
    return this.db.transaction(async (tx) => {
      const [room] = await tx
        .insert(rooms)
        .values({ code: data.code, creatorId: data.creatorId, name: data.name })
        .returning();
      await tx.insert(roomParticipants).values({
        roomId: room.id,
        userId: data.creatorId,
        role: 'player',
      });
      return room;
    });
  }

  joinRoom(roomId: string, userId: string): Promise<RoomRecord> {
    return this.db.transaction(async (tx) => {
      await tx
        .insert(roomParticipants)
        .values({ roomId, userId, role: 'player' });
      const [updated] = await tx
        .update(rooms)
        .set({ status: 'in_progress' })
        .where(eq(rooms.id, roomId))
        .returning();
      if (!updated) throw new NotFoundException('Room not found');
      return updated;
    });
  }

  async updateStatus(
    roomId: string,
    status: 'waiting' | 'in_progress' | 'finished',
  ): Promise<RoomRecord> {
    const [updated] = await this.db
      .update(rooms)
      .set({ status })
      .where(eq(rooms.id, roomId))
      .returning();
    if (!updated) throw new NotFoundException('Room not found');
    return updated;
  }

  async updateName(roomId: string, name: string): Promise<RoomRecord> {
    const [updated] = await this.db
      .update(rooms)
      .set({ name })
      .where(eq(rooms.id, roomId))
      .returning();
    if (!updated) throw new NotFoundException('Room not found');
    return updated;
  }

  findParticipants(roomId: string): Promise<RoomParticipantRecord[]> {
    return this.db.query.roomParticipants.findMany({
      where: eq(roomParticipants.roomId, roomId),
    });
  }

  findParticipantsWithUsers(roomId: string): Promise<ParticipantWithUser[]> {
    return this.db
      .select({
        userId: roomParticipants.userId,
        username: users.username,
        avatarUrl: users.avatarUrl,
        score: roomParticipants.score,
        role: roomParticipants.role,
        joinedAt: roomParticipants.joinedAt,
      })
      .from(roomParticipants)
      .innerJoin(users, eq(roomParticipants.userId, users.id))
      .where(
        and(
          eq(roomParticipants.roomId, roomId),
          isNull(roomParticipants.leftAt),
        ),
      );
  }

  async setParticipantLeft(roomId: string, userId: string): Promise<void> {
    await this.db
      .update(roomParticipants)
      .set({ leftAt: new Date() })
      .where(
        and(
          eq(roomParticipants.roomId, roomId),
          eq(roomParticipants.userId, userId),
        ),
      );
  }

  async setParticipantActive(roomId: string, userId: string): Promise<void> {
    await this.db
      .update(roomParticipants)
      .set({ leftAt: null })
      .where(
        and(
          eq(roomParticipants.roomId, roomId),
          eq(roomParticipants.userId, userId),
        ),
      );
  }

  findParticipant(
    roomId: string,
    userId: string,
  ): Promise<RoomParticipantRecord | null> {
    return this.db.query.roomParticipants
      .findFirst({
        where: and(
          eq(roomParticipants.roomId, roomId),
          eq(roomParticipants.userId, userId),
        ),
      })
      .then((row) => row ?? null);
  }
}
