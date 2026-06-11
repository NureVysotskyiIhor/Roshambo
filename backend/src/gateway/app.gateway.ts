import { UseFilters } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { EVENTS } from '@roshambo/shared';
import { parse } from 'cookie';
import { Server } from 'socket.io';
import { GameService } from '../game/game.service.js';
import { WsExceptionFilter } from '../shared/filters/ws-exception.filter.js';
import { WsCurrentUser } from '../shared/decorators/ws-current-user.decorator.js';
import { RoomsService } from '../rooms/rooms.service.js';
import { UsersService } from '../users/users.service.js';
import { type AppSocket } from '../shared/types/socket.types.js';

interface JwtPayload {
  sub: string;
  username: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
@UseFilters(WsExceptionFilter)
export class AppGateway implements OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server!: Server;

  private readonly restartRequests = new Map<string, Set<string>>();
  private readonly disconnectTimers = new Map<string, NodeJS.Timeout>();
  private static readonly RECONNECT_GRACE_MS = 5000;

  constructor(
    private readonly roomsService: RoomsService,
    private readonly gameService: GameService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server): void {
    server.use((socket: AppSocket, next) => {
      try {
        const cookieHeader = socket.handshake.headers.cookie;
        if (!cookieHeader) throw new Error('No cookie');

        const cookies = parse(cookieHeader);
        const token = cookies['accessToken'];
        if (!token) throw new Error('No token');

        const payload = this.jwtService.verify<JwtPayload>(token, {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        });
        socket.data.user = { id: payload.sub, username: payload.username };
        next();
      } catch {
        next(new Error('Unauthorized'));
      }
    });
  }

  private cancelDisconnectTimer(roomCode: string, userId: string): void {
    const key = `${roomCode}:${userId}`;
    const timer = this.disconnectTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(key);
    }
  }

  private cancelRoomDisconnectTimers(roomCode: string): void {
    const prefix = `${roomCode}:`;
    for (const key of this.disconnectTimers.keys()) {
      if (key.startsWith(prefix)) {
        clearTimeout(this.disconnectTimers.get(key));
        this.disconnectTimers.delete(key);
      }
    }
  }

  private async handlePlayerLeave(
    client: AppSocket,
    user: { id: string; username: string },
    voluntary: boolean,
  ): Promise<void> {
    const roomCode = client.data.roomCode;
    if (!roomCode) return;

    const room = await this.roomsService.findByCode(roomCode);
    if (!room) return;

    void client.leave(roomCode);
    client.data.roomCode = undefined;

    this.cancelDisconnectTimer(roomCode, user.id);

    if (!voluntary) {
      // Defer cleanup — give the client a grace period to reconnect
      // (e.g. a page reload) before tearing down the room/round.
      if (user.id === room.creatorId) {
        this.server.to(roomCode).emit(EVENTS.ROOM.HOST_DISCONNECTED, {});
      }

      const key = `${roomCode}:${user.id}`;
      const timer = setTimeout(() => {
        this.disconnectTimers.delete(key);
        void this.finalizePlayerLeave(roomCode, user, voluntary);
      }, AppGateway.RECONNECT_GRACE_MS);
      this.disconnectTimers.set(key, timer);
      return;
    }

    await this.finalizePlayerLeave(roomCode, user, voluntary);
  }

  private async finalizePlayerLeave(
    roomCode: string,
    user: { id: string; username: string },
    voluntary: boolean,
  ): Promise<void> {
    const room = await this.roomsService.findByCode(roomCode);
    if (!room) return;

    this.restartRequests.delete(roomCode);

    if (user.id === room.creatorId) {
      await this.roomsService.setParticipantLeft(room.id, user.id);

      const participants = await this.roomsService.findParticipants(room.id);
      const activeOpponent = participants.find(
        (p) => p.userId !== room.creatorId && p.leftAt === null,
      );
      if (activeOpponent) {
        await this.roomsService.setParticipantLeft(
          room.id,
          activeOpponent.userId,
        );
      }

      await this.roomsService.updateStatus(room.id, 'finished');
      this.gameService.resetRound(roomCode);
      this.gameService.resetSessionScores(roomCode);
      this.server.to(roomCode).emit(EVENTS.ROOM.CLOSED, {
        reason: voluntary ? 'host_left' : 'host_disconnected',
      });
    } else {
      await this.roomsService.setParticipantLeft(room.id, user.id);
      await this.roomsService.updateStatus(room.id, 'waiting');
      this.gameService.resetRound(roomCode);
      this.gameService.resetSessionScores(roomCode);
      this.server.to(roomCode).emit(EVENTS.ROOM.OPPONENT_LEFT, {
        reason: voluntary ? 'opponent_left' : 'opponent_disconnected',
      });
    }
  }

  private async closeRoom(roomCode: string): Promise<void> {
    const room = await this.roomsService.findByCode(roomCode);
    if (!room) return;

    this.cancelRoomDisconnectTimers(roomCode);

    const participants = await this.roomsService.findParticipants(room.id);
    for (const p of participants) {
      if (p.leftAt === null) {
        await this.roomsService.setParticipantLeft(room.id, p.userId);
      }
    }

    await this.roomsService.updateStatus(room.id, 'finished');
    this.gameService.resetRound(roomCode);
    this.gameService.resetSessionScores(roomCode);
    this.server.to(roomCode).emit(EVENTS.ROOM.CLOSED, { reason: 'host_left' });
    this.restartRequests.delete(roomCode);
  }

  @SubscribeMessage(EVENTS.ROOM.JOIN)
  async handleRoomJoin(
    @ConnectedSocket() client: AppSocket,
    @MessageBody() data: { code: string },
    @WsCurrentUser() user: { id: string; username: string },
  ): Promise<void> {
    const room = await this.roomsService.findByCode(data.code);
    if (!room) {
      client.emit(EVENTS.ERROR, { message: 'Room not found' });
      return;
    }

    if (client.data.roomCode === data.code) {
      void client.join(data.code);
      client.emit(EVENTS.ROOM.JOINED, {
        room,
        participant: { userId: user.id, username: user.username },
      });
      return;
    }

    if (room.status === 'waiting' && room.creatorId !== user.id) {
      const myActiveRoom = await this.roomsService.findActiveRoomByCreator(
        user.id,
      );
      if (myActiveRoom) {
        if (myActiveRoom.status === 'in_progress') {
          client.emit(EVENTS.ERROR, {
            message: 'You already have an active game',
          });
          return;
        }
        await this.closeRoom(myActiveRoom.code);
        void client.leave(myActiveRoom.code);
        client.data.roomCode = undefined;
      }

      try {
        await this.roomsService.joinRoom(user.id, data.code);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Join failed';
        client.emit(EVENTS.ERROR, { message });
        return;
      }

      await this.roomsService.setParticipantActive(room.id, user.id);

      void client.join(data.code);
      client.data.roomCode = data.code;

      client.emit(EVENTS.ROOM.JOINED, {
        room,
        participant: { userId: user.id, username: user.username },
      });
      const userProfile = await this.usersService.getMe(user.id);
      client.to(data.code).emit(EVENTS.ROOM.PLAYER_JOINED, {
        participant: {
          userId: user.id,
          username: user.username,
          avatarUrl: userProfile.avatarUrl,
        },
      });

      this.gameService.initRound(data.code, room.id, room.creatorId, user.id);
      this.server.to(data.code).emit(EVENTS.GAME.STARTED, {});
      return;
    }

    if (room.creatorId === user.id && room.status !== 'finished') {
      this.cancelDisconnectTimer(data.code, user.id);

      await this.roomsService.setParticipantActive(room.id, user.id);

      if (room.status === 'in_progress') {
        const participants = await this.roomsService.findParticipants(room.id);
        const activeOpponent = participants.find(
          (p) => p.userId !== room.creatorId && p.leftAt === null,
        );
        if (!activeOpponent) {
          await this.roomsService.updateStatus(room.id, 'waiting');
        }
      }

      void client.join(data.code);
      client.data.roomCode = data.code;

      client.emit(EVENTS.ROOM.JOINED, {
        room,
        participant: { userId: user.id, username: user.username },
      });

      const userProfile = await this.usersService.getMe(user.id);
      client.to(data.code).emit(EVENTS.ROOM.PLAYER_JOINED, {
        participant: {
          userId: user.id,
          username: user.username,
          avatarUrl: userProfile.avatarUrl,
        },
      });
      return;
    }

    if (room.status === 'in_progress' && room.creatorId !== user.id) {
      const participant = await this.roomsService.findParticipant(
        room.id,
        user.id,
      );
      if (!participant) {
        client.emit(EVENTS.ERROR, { message: 'Room is not available' });
        return;
      }

      this.cancelDisconnectTimer(data.code, user.id);

      await this.roomsService.setParticipantActive(room.id, user.id);

      void client.join(data.code);
      client.data.roomCode = data.code;

      client.emit(EVENTS.ROOM.JOINED, {
        room,
        participant: { userId: user.id, username: user.username },
      });
      const userProfile = await this.usersService.getMe(user.id);
      client.to(data.code).emit(EVENTS.ROOM.PLAYER_JOINED, {
        participant: {
          userId: user.id,
          username: user.username,
          avatarUrl: userProfile.avatarUrl,
        },
      });

      // Round survived the grace period (e.g. quick reload) — don't reset
      // it, only a real fresh start needs a new round + GAME.STARTED.
      if (!this.gameService.getRoundState(data.code)) {
        this.gameService.initRound(data.code, room.id, room.creatorId, user.id);
        this.server.to(data.code).emit(EVENTS.GAME.STARTED, {});
      }
      return;
    }

    client.emit(EVENTS.ERROR, { message: 'Room is not available' });
  }

  @SubscribeMessage(EVENTS.ROOM.LEFT)
  async handleRoomLeft(
    @ConnectedSocket() client: AppSocket,
    @MessageBody() _data: unknown,
    @WsCurrentUser() user: { id: string; username: string },
  ): Promise<{ ok: true }> {
    await this.handlePlayerLeave(client, user, true);
    return { ok: true };
  }

  @SubscribeMessage(EVENTS.GAME.CHOICE)
  async handleGameChoice(
    @ConnectedSocket() client: AppSocket,
    @MessageBody() data: { choice: 'rock' | 'paper' | 'scissors' },
    @WsCurrentUser() user: { id: string },
  ): Promise<void> {
    const roomCode = client.data.roomCode;
    if (!roomCode) {
      client.emit(EVENTS.ERROR, { message: 'Not in a room' });
      return;
    }

    const result = await this.gameService.makeChoice(
      roomCode,
      user.id,
      data.choice,
    );

    if (result === null) {
      client.to(roomCode).emit(EVENTS.GAME.OPPONENT_CHOSE, {});
    } else {
      this.server.to(roomCode).emit(EVENTS.GAME.ROUND_RESULT, result);
    }
  }

  @SubscribeMessage(EVENTS.GAME.RESTART)
  async handleGameRestart(
    @ConnectedSocket() client: AppSocket,
    @WsCurrentUser() user: { id: string },
  ): Promise<void> {
    const roomCode = client.data.roomCode;
    if (!roomCode) return;

    if (!this.restartRequests.has(roomCode)) {
      this.restartRequests.set(roomCode, new Set());
    }
    this.restartRequests.get(roomCode)!.add(user.id);

    if (this.restartRequests.get(roomCode)!.size < 2) {
      client
        .to(roomCode)
        .emit(EVENTS.GAME.RESTART_REQUESTED, { requestedBy: user.id });
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

    this.gameService.initRound(
      roomCode,
      room.id,
      room.creatorId,
      playerTwo.userId,
    );
    this.server.to(roomCode).emit(EVENTS.GAME.STARTED, {});
  }

  async handleDisconnect(client: AppSocket): Promise<void> {
    const user = client.data.user;
    if (!user) return;
    await this.handlePlayerLeave(client, user, false);
  }
}
