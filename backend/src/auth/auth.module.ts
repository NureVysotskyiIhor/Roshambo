import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthMapper } from './auth.mapper.js';
import { AuthRepository } from './auth.repository.js';
import { AuthService } from './auth.service.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, AuthMapper],
})
export class AuthModule {}
