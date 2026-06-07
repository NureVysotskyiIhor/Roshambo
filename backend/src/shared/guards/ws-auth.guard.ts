import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { parse } from 'cookie';
import { type AppSocket } from '../types/socket.types.js';

interface JwtPayload {
  sub: string;
  username: string;
}

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<AppSocket>();
    const cookieHeader = client.handshake.headers.cookie;

    if (!cookieHeader) {
      throw new WsException('Unauthorized');
    }

    const cookies = parse(cookieHeader);
    const token = cookies['accessToken'];

    if (!token) {
      throw new WsException('Unauthorized');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
      client.data.user = { id: payload.sub, username: payload.username };
      return true;
    } catch {
      throw new WsException('Unauthorized');
    }
  }
}
