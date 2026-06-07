import { Module } from '@nestjs/common';
import { GameModule } from '../game/game.module.js';
import { RoomsModule } from '../rooms/rooms.module.js';
import { UsersModule } from '../users/users.module.js';
import { AppGateway } from './app.gateway.js';

@Module({
  imports: [RoomsModule, GameModule, UsersModule],
  providers: [AppGateway],
})
export class GatewayModule {}
