import { Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import { roomParticipants, rooms } from '../db/schema.js';
import type {
  RoomInsert,
  RoomParticipantRecord,
  RoomRecord,
} from '../db/types.js';

type CreateRoomData = Pick<RoomInsert, 'code' | 'creatorId'> & { name?: string };

@Injectable()
export class RoomsRepository {
  findByCode(code: string): Promise<RoomRecord | null> {
    return db.query.rooms
      .findFirst({ where: eq(rooms.code, code) })
      .then((row) => row ?? null);
  }

  findActiveByCreatorId(creatorId: string): Promise<RoomRecord | null> {
    return db.query.rooms
      .findFirst({
        where: and(
          eq(rooms.creatorId, creatorId),
          or(eq(rooms.status, 'waiting'), eq(rooms.status, 'in_progress')),
        ),
      })
      .then((row) => row ?? null);
  }

  create(data: CreateRoomData): Promise<RoomRecord> {
    return db.transaction(async (tx) => {
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
    return db.transaction(async (tx) => {
      await tx.insert(roomParticipants).values({ roomId, userId, role: 'player' });
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
    const [updated] = await db
      .update(rooms)
      .set({ status })
      .where(eq(rooms.id, roomId))
      .returning();
    if (!updated) throw new NotFoundException('Room not found');
    return updated;
  }

  async updateName(roomId: string, name: string): Promise<RoomRecord> {
    const [updated] = await db
      .update(rooms)
      .set({ name })
      .where(eq(rooms.id, roomId))
      .returning();
    if (!updated) throw new NotFoundException('Room not found');
    return updated;
  }

  findParticipants(roomId: string): Promise<RoomParticipantRecord[]> {
    return db.query.roomParticipants
      .findMany({ where: eq(roomParticipants.roomId, roomId) });
  }

  findParticipant(roomId: string, userId: string): Promise<RoomParticipantRecord | null> {
    return db.query.roomParticipants
      .findFirst({
        where: and(
          eq(roomParticipants.roomId, roomId),
          eq(roomParticipants.userId, userId),
        ),
      })
      .then((row) => row ?? null);
  }
}
