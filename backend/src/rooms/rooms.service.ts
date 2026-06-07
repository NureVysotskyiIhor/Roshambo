import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { nanoid } from 'nanoid';
import type { ParticipantDto } from '@roshambo/shared';
import type { RoomParticipantRecord } from '../db/types.js';
import { CreateRoomDto } from './dto/create-room.dto.js';
import { RoomResponseDto } from './dto/room-response.dto.js';
import { UpdateRoomDto } from './dto/update-room.dto.js';
import { RoomsMapper } from './rooms.mapper.js';
import { RoomsRepository } from './rooms.repository.js';

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

  async createRoom(userId: string, dto: CreateRoomDto): Promise<RoomResponseDto> {
    const myRoom = await this.repository.findByCreatorId(userId);
    if (myRoom && myRoom.status !== 'finished') {
      throw new BadRequestException('You already have an active room');
    }

    let code: string;
    do {
      code = nanoid(6);
    } while (await this.repository.findByCode(code));

    const room = await this.repository.create({ code, creatorId: userId, name: dto.name });
    return this.mapper.toResponse(room);
  }

  async joinRoom(userId: string, code: string): Promise<RoomResponseDto> {
    const room = await this.repository.findByCode(code);
    if (!room) throw new NotFoundException('Room not found');
    if (room.status !== 'waiting') throw new BadRequestException('Room is not available');
    if (room.creatorId === userId) throw new BadRequestException('Cannot join your own room');

    const myRoom = await this.repository.findByCreatorId(userId);
    if (myRoom && myRoom.status === 'in_progress') {
      throw new BadRequestException('You already have an active game');
    }
    if (myRoom && myRoom.status === 'waiting') {
      await this.repository.setParticipantLeft(myRoom.id, userId);
      await this.repository.updateStatus(myRoom.id, 'finished');
    }

    const existing = await this.repository.findParticipant(room.id, userId);
    if (existing) {
      const updatedRoom = await this.repository.updateStatus(room.id, 'in_progress');
      return this.mapper.toResponse(updatedRoom);
    }

    const updatedRoom = await this.repository.joinRoom(room.id, userId);
    return this.mapper.toResponse(updatedRoom);
  }

  async updateRoom(userId: string, code: string, dto: UpdateRoomDto): Promise<RoomResponseDto> {
    const room = await this.repository.findByCode(code);
    if (!room) throw new NotFoundException('Room not found');
    if (room.creatorId !== userId) throw new ForbiddenException('Not room creator');

    const updatedRoom = await this.repository.updateName(room.id, dto.name);
    return this.mapper.toResponse(updatedRoom);
  }

  async findByCode(code: string): Promise<RoomResponseDto | null> {
    const room = await this.repository.findByCode(code);
    return room ? this.mapper.toResponse(room) : null;
  }

  async updateStatus(roomId: string, status: 'waiting' | 'in_progress' | 'finished'): Promise<void> {
    await this.repository.updateStatus(roomId, status);
  }

  findParticipants(roomId: string): Promise<RoomParticipantRecord[]> {
    return this.repository.findParticipants(roomId);
  }

  findParticipant(roomId: string, userId: string): Promise<RoomParticipantRecord | null> {
    return this.repository.findParticipant(roomId, userId);
  }

  async getParticipants(roomId: string): Promise<ParticipantDto[]> {
    const participants = await this.repository.findParticipantsWithUsers(roomId);
    return participants.map((p) => this.mapper.toParticipantDto(p));
  }

  async setParticipantLeft(roomId: string, userId: string): Promise<void> {
    await this.repository.setParticipantLeft(roomId, userId);
  }

  async setParticipantActive(roomId: string, userId: string): Promise<void> {
    await this.repository.setParticipantActive(roomId, userId);
  }

  async findActiveRoomByCreator(userId: string): Promise<RoomResponseDto | null> {
  const room = await this.repository.findByCreatorId(userId);
  if (!room) return null;
  if (room.status === 'finished') return null;
  return this.mapper.toResponse(room);
  }
}
