import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller.js';
import { RoomsMapper } from './rooms.mapper.js';
import { RoomsRepository } from './rooms.repository.js';
import { RoomsService } from './rooms.service.js';

@Module({
  controllers: [RoomsController],
  providers: [RoomsService, RoomsRepository, RoomsMapper],
  exports: [RoomsService],
})
export class RoomsModule {}
