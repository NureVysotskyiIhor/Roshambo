import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import {
  ConflictError,
  NotFoundError,
} from '../shared/exceptions/domain.exception.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { UsersMapper } from './users.mapper.js';
import { UsersRepository } from './users.repository.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly repository: UsersRepository,
    private readonly mapper: UsersMapper,
  ) {}

  async getMe(userId: string): Promise<UserResponseDto> {
    const user = await this.repository.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    return this.mapper.toResponse(user);
  }

  async updateMe(userId: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const updateData: Parameters<UsersRepository['update']>[1] = {};

    if (dto.username !== undefined) {
      const existing = await this.repository.findByUsername(dto.username);
      if (existing && existing.id !== userId) {
        throw new ConflictError('Username already taken');
      }
      updateData.username = dto.username;
    }
    if (dto.password !== undefined)
      updateData.password = await bcrypt.hash(dto.password, 10);
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.avatarUrl !== undefined) updateData.avatarUrl = dto.avatarUrl;

    if (Object.keys(updateData).length === 0) {
      const user = await this.repository.findById(userId);
      if (!user) throw new NotFoundError('User not found');
      return this.mapper.toResponse(user);
    }

    const updatedUser = await this.repository.update(userId, updateData);
    return this.mapper.toResponse(updatedUser);
  }
}
