import { Injectable } from '@nestjs/common';
import type { RoomRecord } from '../db/types.js';
import { RoomResponseDto } from './dto/room-response.dto.js';

@Injectable()
export class RoomsMapper {
  toResponse(room: RoomRecord): RoomResponseDto {
    return {
      id: room.id,
      code: room.code,
      name: room.name ?? null,
      status: room.status,
      isPrivate: room.isPrivate,
      creatorId: room.creatorId,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }
}
