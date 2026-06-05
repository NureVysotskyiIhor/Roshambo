import { Injectable } from '@nestjs/common';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { UserRecord } from './auth.repository.js';

@Injectable()
export class AuthMapper {
  toResponse(user: UserRecord): AuthResponseDto {
    return {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      role: user.role,
      email: user.email ?? null,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    };
  }
}
