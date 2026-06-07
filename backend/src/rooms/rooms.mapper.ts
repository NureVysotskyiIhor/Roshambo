import { Injectable } from '@nestjs/common';
import type { ParticipantDto } from '@roshambo/shared';
import type { RoomRecord } from '../db/types.js';
import { RoomResponseDto } from './dto/room-response.dto.js';
import type { ParticipantWithUser } from './rooms.repository.js';

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

  toParticipantDto(participant: ParticipantWithUser): ParticipantDto {
    return {
      userId: participant.userId,
      username: participant.username,
      avatarUrl: participant.avatarUrl,
      score: participant.score,
      role: participant.role,
      joinedAt: participant.joinedAt.toISOString(),
    };
  }
}
