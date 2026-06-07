import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../shared/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard.js';
import { CreateRoomDto } from './dto/create-room.dto.js';
import { UpdateRoomDto } from './dto/update-room.dto.js';
import { RoomsService } from './rooms.service.js';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly service: RoomsService) {}

  @Get('my')
  async getMyRoom(@CurrentUser() user: { id: string; username: string }) {
    return { room: await this.service.getMyRoom(user.id) };
  }

  @Post()
  createRoom(
    @CurrentUser() user: { id: string; username: string },
    @Body() dto: CreateRoomDto,
  ) {
    return this.service.createRoom(user.id, dto);
  }

  @Get(':roomId/participants')
  getParticipants(@Param('roomId') roomId: string) {
    return this.service.getParticipants(roomId);
  }

  @Post(':code/join')
  joinRoom(
    @CurrentUser() user: { id: string; username: string },
    @Param('code') code: string,
  ) {
    return this.service.joinRoom(user.id, code);
  }

  @Patch(':code')
  updateRoom(
    @CurrentUser() user: { id: string; username: string },
    @Param('code') code: string,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.service.updateRoom(user.id, code, dto);
  }
}
