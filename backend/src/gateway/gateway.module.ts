import { Module } from '@nestjs/common';
import { GameModule } from '../game/game.module.js';
import { RoomsModule } from '../rooms/rooms.module.js';
import { AppGateway } from './app.gateway.js';

@Module({
  imports: [RoomsModule, GameModule],
  providers: [AppGateway],
})
export class GatewayModule {}
