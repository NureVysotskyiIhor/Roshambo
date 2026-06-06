import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { nanoid } from 'nanoid';
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
    const room = await this.repository.findActiveByCreatorId(userId);
    if (!room) return null;
    return this.mapper.toResponse(room);
  }

  async createRoom(userId: string, dto: CreateRoomDto): Promise<RoomResponseDto> {
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

    const existing = await this.repository.findParticipant(room.id, userId);
    if (existing) throw new BadRequestException('Already in this room');

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
}
