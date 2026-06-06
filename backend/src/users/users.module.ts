import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersMapper } from './users.mapper.js';
import { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, UsersMapper],
  exports: [UsersService],
})
export class UsersModule {}
