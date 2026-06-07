import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { type AppSocket } from '../types/socket.types.js';

export const WsCurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const client = ctx.switchToWs().getClient<AppSocket>();
    return client.data.user;
  },
);
