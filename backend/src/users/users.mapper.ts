import { Injectable } from '@nestjs/common';
import type { UserRecord } from '../db/types.js';
import { UserResponseDto } from './dto/user-response.dto.js';

@Injectable()
export class UsersMapper {
  toResponse(user: UserRecord): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      role: user.role,
      email: user.email ?? null,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
