import { Module } from '@nestjs/common';
import { GameRepository } from './game.repository.js';
import { GameService } from './game.service.js';
import { GameStore } from './game.store.js';

@Module({
  providers: [GameService, GameStore, GameRepository],
  exports: [GameService],
})
export class GameModule {}
