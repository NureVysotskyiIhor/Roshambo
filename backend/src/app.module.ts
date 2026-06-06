import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { validateEnv } from './config/env.validation.js';
import { SharedModule } from './shared/shared.module.js';
import { GameModule } from './game/game.module.js';
import { RoomsModule } from './rooms/rooms.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    SharedModule,
    AuthModule,
    UsersModule,
    RoomsModule,
    GameModule,
  ],
})
export class AppModule {}
