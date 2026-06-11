import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { DomainException } from '../exceptions/domain.exception.js';

@Catch(WsException, DomainException)
export class WsExceptionFilter implements ExceptionFilter {
  catch(exception: WsException | DomainException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    const message =
      exception instanceof WsException
        ? exception.getError()
        : exception.message;

    client.emit('error', { message });
  }
}
