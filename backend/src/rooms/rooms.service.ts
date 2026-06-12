import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
import type { ParticipantDto } from '@roshambo/shared';
import type { RoomParticipantRecord, RoomRecord } from '../db/types.js';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../shared/exceptions/domain.exception.js';
import { CreateRoomDto } from './dto/create-room.dto.js';
import { RoomResponseDto } from './dto/room-response.dto.js';
import { UpdateRoomDto } from './dto/update-room.dto.js';
import { RoomsMapper } from './rooms.mapper.js';
import { RoomsRepository } from './rooms.repository.js';

export type RoomJoinResult =
  | { type: 'not_found' }
  | { type: 'active_game_conflict' }
  | { type: 'unavailable' }
  | {
      type: 'joined';
      room: RoomResponseDto;
      role: 'creator' | 'opponent';
      previousRoomClosed: { code: string } | null;
      forceNewRound: boolean;
    };

@Injectable()
export class RoomsService {
  constructor(
    private readonly repository: RoomsRepository,
    private readonly mapper: RoomsMapper,
  ) {}

  async getMyRoom(userId: string): Promise<RoomResponseDto | null> {
    const room = await this.repository.findByCreatorId(userId);
    if (!room) return null;
    if (room.status === 'finished') {
      const updated = await this.repository.updateStatus(room.id, 'waiting');
      return this.mapper.toResponse(updated);
    }
    return this.mapper.toResponse(room);
  }

  async createRoom(
    userId: string,
    dto: CreateRoomDto,
  ): Promise<RoomResponseDto> {
    const myRoom = await this.repository.findByCreatorId(userId);
    if (myRoom && myRoom.status !== 'finished') {
      throw new BadRequestError('You already have an active room');
    }

    let code: string;
    do {
      code = nanoid(6);
    } while (await this.repository.findByCode(code));

    const room = await this.repository.create({
      code,
      creatorId: userId,
      name: dto.name,
    });
    return this.mapper.toResponse(room);
  }

  async joinRoom(userId: string, code: string): Promise<RoomResponseDto> {
    const room = await this.repository.findByCode(code);
    if (!room) throw new NotFoundError('Room not found');
    if (room.status !== 'waiting')
      throw new BadRequestError('Room is not available');
    if (room.creatorId === userId)
      throw new BadRequestError('Cannot join your own room');

    const myRoom = await this.repository.findByCreatorId(userId);
    if (myRoom && myRoom.status === 'in_progress') {
      throw new BadRequestError('You already have an active game');
    }
    if (myRoom && myRoom.status === 'waiting') {
      await this.repository.setParticipantLeft(myRoom.id, userId);
      await this.repository.updateStatus(myRoom.id, 'finished');
    }

    const existing = await this.repository.findParticipant(room.id, userId);
    if (existing) {
      const updatedRoom = await this.repository.updateStatus(
        room.id,
        'in_progress',
      );
      return this.mapper.toResponse(updatedRoom);
    }

    const updatedRoom = await this.repository.joinRoom(room.id, userId);
    return this.mapper.toResponse(updatedRoom);
  }

  async updateRoom(
    userId: string,
    code: string,
    dto: UpdateRoomDto,
  ): Promise<RoomResponseDto> {
    const room = await this.repository.findByCode(code);
    if (!room) throw new NotFoundError('Room not found');
    if (room.creatorId !== userId)
      throw new ForbiddenError('Not room creator');

    const updatedRoom = await this.repository.updateName(room.id, dto.name);
    return this.mapper.toResponse(updatedRoom);
  }

  async findByCode(code: string): Promise<RoomResponseDto | null> {
    const room = await this.repository.findByCode(code);
    return room ? this.mapper.toResponse(room) : null;
  }

  async getRoomByCode(code: string): Promise<RoomResponseDto> {
    const room = await this.repository.findByCode(code);
    if (!room) throw new NotFoundError('Room not found');
    return this.mapper.toResponse(room);
  }

  async updateStatus(
    roomId: string,
    status: 'waiting' | 'in_progress' | 'finished',
  ): Promise<void> {
    await this.repository.updateStatus(roomId, status);
  }

  findParticipants(roomId: string): Promise<RoomParticipantRecord[]> {
    return this.repository.findParticipants(roomId);
  }

  findParticipant(
    roomId: string,
    userId: string,
  ): Promise<RoomParticipantRecord | null> {
    return this.repository.findParticipant(roomId, userId);
  }

  async getParticipants(roomId: string): Promise<ParticipantDto[]> {
    const participants =
      await this.repository.findParticipantsWithUsers(roomId);
    return participants.map((p) => this.mapper.toParticipantDto(p));
  }

  async setParticipantLeft(roomId: string, userId: string): Promise<void> {
    await this.repository.setParticipantLeft(roomId, userId);
  }

  async setParticipantActive(roomId: string, userId: string): Promise<void> {
    await this.repository.setParticipantActive(roomId, userId);
  }

  async findActiveOpponent(
    roomId: string,
    creatorId: string,
  ): Promise<RoomParticipantRecord | null> {
    const participants = await this.repository.findParticipants(roomId);
    return (
      participants.find((p) => p.userId !== creatorId && p.leftAt === null) ??
      null
    );
  }

  async resolveJoin(userId: string, code: string): Promise<RoomJoinResult> {
    const room = await this.repository.findByCode(code);
    if (!room) return { type: 'not_found' };

    if (room.status === 'waiting' && room.creatorId !== userId) {
      return this.resolveJoinAsOpponent(userId, room);
    }

    if (room.creatorId === userId && room.status !== 'finished') {
      return this.resolveCreatorReturn(room);
    }

    if (room.status === 'in_progress' && room.creatorId !== userId) {
      return this.resolveReconnectAsOpponent(userId, room);
    }

    return { type: 'unavailable' };
  }

  private async resolveJoinAsOpponent(
    userId: string,
    room: RoomRecord,
  ): Promise<RoomJoinResult> {
    const myRoom = await this.repository.findByCreatorId(userId);
    let previousRoomClosed: { code: string } | null = null;

    if (myRoom && myRoom.status !== 'finished') {
      if (myRoom.status === 'in_progress') {
        return { type: 'active_game_conflict' };
      }

      const participants = await this.repository.findParticipants(myRoom.id);
      for (const p of participants) {
        if (p.leftAt === null) {
          await this.repository.setParticipantLeft(myRoom.id, p.userId);
        }
      }
      await this.repository.updateStatus(myRoom.id, 'finished');
      previousRoomClosed = { code: myRoom.code };
    }

    const existing = await this.repository.findParticipant(room.id, userId);
    const updatedRoom = existing
      ? await this.repository.updateStatus(room.id, 'in_progress')
      : await this.repository.joinRoom(room.id, userId);
    await this.repository.setParticipantActive(updatedRoom.id, userId);

    return {
      type: 'joined',
      room: this.mapper.toResponse(updatedRoom),
      role: 'opponent',
      previousRoomClosed,
      forceNewRound: true,
    };
  }

  private async resolveCreatorReturn(room: RoomRecord): Promise<RoomJoinResult> {
    await this.repository.setParticipantActive(room.id, room.creatorId);

    let updatedRoom = room;
    if (room.status === 'in_progress') {
      const activeOpponent = await this.findActiveOpponent(
        room.id,
        room.creatorId,
      );
      if (!activeOpponent) {
        updatedRoom = await this.repository.updateStatus(room.id, 'waiting');
      }
    }

    return {
      type: 'joined',
      room: this.mapper.toResponse(updatedRoom),
      role: 'creator',
      previousRoomClosed: null,
      forceNewRound: false,
    };
  }

  private async resolveReconnectAsOpponent(
    userId: string,
    room: RoomRecord,
  ): Promise<RoomJoinResult> {
    const participant = await this.repository.findParticipant(room.id, userId);
    if (!participant) return { type: 'unavailable' };

    await this.repository.setParticipantActive(room.id, userId);

    return {
      type: 'joined',
      room: this.mapper.toResponse(room),
      role: 'opponent',
      previousRoomClosed: null,
      forceNewRound: false,
    };
  }
}
