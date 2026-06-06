import { UseFilters, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { EVENTS } from '@roshambo/shared';
import { Server, Socket } from 'socket.io';
import { GameService } from '../game/game.service.js';
import { WsExceptionFilter } from '../shared/filters/ws-exception.filter.js';
import { WsAuthGuard } from '../shared/guards/ws-auth.guard.js';
import { WsCurrentUser } from '../shared/decorators/ws-current-user.decorator.js';
import { RoomsService } from '../rooms/rooms.service.js';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
@UseFilters(WsExceptionFilter)
@UseGuards(WsAuthGuard)
export class AppGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly restartRequests = new Map<string, Set<string>>();

  constructor(
    private readonly roomsService: RoomsService,
    private readonly gameService: GameService,
  ) {}

  private async handlePlayerLeave(
    client: Socket,
    user: { id: string; username: string },
  ): Promise<void> {
    const roomCode = client.data.roomCode as string | undefined;
    if (!roomCode) return;

    const room = await this.roomsService.findByCode(roomCode);
    if (!room) return;

    this.restartRequests.delete(roomCode);

    if (user.id === room.creatorId) {
      await this.roomsService.updateStatus(room.id, 'finished');
      await this.gameService.resetScores(roomCode);
      this.gameService.resetRound(roomCode);
      this.server.to(roomCode).emit(EVENTS.ROOM.CLOSED, { reason: 'host_disconnected' });
    } else {
      await this.roomsService.updateStatus(room.id, 'waiting');
      await this.gameService.resetScores(roomCode);
      this.gameService.resetRound(roomCode);
      this.server.to(roomCode).emit(EVENTS.ROOM.OPPONENT_LEFT, { reason: 'opponent_disconnected' });
    }

    client.leave(roomCode);
    client.data.roomCode = undefined;
  }

  @SubscribeMessage(EVENTS.ROOM.JOIN)
  async handleRoomJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { code: string },
    @WsCurrentUser() user: { id: string; username: string },
  ): Promise<void> {
    const room = await this.roomsService.findByCode(data.code);
    if (!room) {
      client.emit(EVENTS.ERROR, { message: 'Room not found' });
      return;
    }

    if (room.status === 'waiting' && room.creatorId !== user.id) {
      try {
        await this.roomsService.joinRoom(user.id, data.code);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Join failed';
        client.emit(EVENTS.ERROR, { message });
        return;
      }

      client.join(data.code);
      client.data.user = user;
      client.data.roomCode = data.code;

      client.emit(EVENTS.ROOM.JOINED, {
        room,
        participant: { userId: user.id, username: user.username },
      });
      client.to(data.code).emit(EVENTS.ROOM.PLAYER_JOINED, {
        participant: { userId: user.id, username: user.username },
      });

      this.gameService.initRound(data.code, room.id, room.creatorId, user.id);
      this.server.to(data.code).emit(EVENTS.GAME.STARTED, {});
      return;
    }

    if (room.creatorId === user.id && room.status !== 'finished') {
      client.join(data.code);
      client.data.user = user;
      client.data.roomCode = data.code;

      client.emit(EVENTS.ROOM.JOINED, {
        room,
        participant: { userId: user.id, username: user.username },
      });
      return;
    }

    client.emit(EVENTS.ERROR, { message: 'Room is not available' });
  }

  @SubscribeMessage(EVENTS.ROOM.LEFT)
  async handleRoomLeft(
    @ConnectedSocket() client: Socket,
    @WsCurrentUser() user: { id: string; username: string },
  ): Promise<void> {
    await this.handlePlayerLeave(client, user);
  }

  @SubscribeMessage(EVENTS.GAME.CHOICE)
  async handleGameChoice(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { choice: 'rock' | 'paper' | 'scissors' },
    @WsCurrentUser() user: { id: string },
  ): Promise<void> {
    const roomCode = client.data.roomCode as string | undefined;
    if (!roomCode) {
      client.emit(EVENTS.ERROR, { message: 'Not in a room' });
      return;
    }

    const result = await this.gameService.makeChoice(roomCode, user.id, data.choice);

    if (result === null) {
      client.to(roomCode).emit(EVENTS.GAME.OPPONENT_CHOSE, {});
    } else {
      this.server.to(roomCode).emit(EVENTS.GAME.ROUND_RESULT, result);
    }
  }

  @SubscribeMessage(EVENTS.GAME.RESTART)
  async handleGameRestart(
    @ConnectedSocket() client: Socket,
    @WsCurrentUser() user: { id: string },
  ): Promise<void> {
    const roomCode = client.data.roomCode as string | undefined;
    if (!roomCode) return;

    if (!this.restartRequests.has(roomCode)) {
      this.restartRequests.set(roomCode, new Set());
    }
    this.restartRequests.get(roomCode)!.add(user.id);

    if (this.restartRequests.get(roomCode)!.size < 2) {
      client.to(roomCode).emit(EVENTS.GAME.RESTART_REQUESTED, { requestedBy: user.id });
      return;
    }

    this.restartRequests.delete(roomCode);

    const room = await this.roomsService.findByCode(roomCode);
    if (!room) return;

    const participants = await this.roomsService.findParticipants(room.id);
    const playerTwo = participants.find(
      (p) => p.userId !== room.creatorId && p.leftAt === null,
    );
    if (!playerTwo) {
      client.emit(EVENTS.ERROR, { message: 'Opponent not found' });
      return;
    }

    this.gameService.initRound(roomCode, room.id, room.creatorId, playerTwo.userId);
    this.server.to(roomCode).emit(EVENTS.GAME.STARTED, {});
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const user = client.data.user as { id: string; username: string } | undefined;
    if (!user) return;
    await this.handlePlayerLeave(client, user);
  }
}
