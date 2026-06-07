import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { WsAuthGuard } from './guards/ws-auth.guard.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Global()
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET')!,
        // ConfigModule validates JWT_ACCESS_EXPIRES_IN is set; cast needed because config.get returns string, not StringValue
        signOptions: {
          expiresIn: config.get(
            'JWT_ACCESS_EXPIRES_IN',
          ) as import('ms').StringValue,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [JwtStrategy, JwtAuthGuard, WsAuthGuard],
  exports: [JwtModule, JwtAuthGuard, WsAuthGuard],
})
export class SharedModule {}
