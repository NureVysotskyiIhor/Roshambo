import { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

export class CorsIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly configService: ConfigService,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): unknown {
    const cors = {
      origin: this.configService.get<string>('FRONTEND_URL')?.split(','),
      credentials: true,
    };

    return super.createIOServer(port, { ...options, cors });
  }
}
