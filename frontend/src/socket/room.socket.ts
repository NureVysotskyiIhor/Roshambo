import { socket } from './socket.client';
import { EVENTS } from '@roshambo/shared';
import type { RoomResponseDto, ParticipantDto } from '@roshambo/shared';

export const roomSocket = {
  join: (code: string) => socket.emit(EVENTS.ROOM.JOIN, { code }),
  leave: () => socket.emit(EVENTS.ROOM.LEFT, {}),

  onJoined: (cb: (data: { room: RoomResponseDto; participant: ParticipantDto }) => void) => {
    socket.on(EVENTS.ROOM.JOINED, cb);
    return () => socket.off(EVENTS.ROOM.JOINED, cb);
  },

  onPlayerJoined: (cb: (data: { participant: ParticipantDto }) => void) => {
    socket.on(EVENTS.ROOM.PLAYER_JOINED, cb);
    return () => socket.off(EVENTS.ROOM.PLAYER_JOINED, cb);
  },

  onOpponentLeft: (cb: (data: { reason: string }) => void) => {
    socket.on(EVENTS.ROOM.OPPONENT_LEFT, cb);
    return () => socket.off(EVENTS.ROOM.OPPONENT_LEFT, cb);
  },

  onClosed: (cb: (data: { reason: string }) => void) => {
    socket.on(EVENTS.ROOM.CLOSED, cb);
    return () => socket.off(EVENTS.ROOM.CLOSED, cb);
  },

  onHostDisconnected: (cb: () => void) => {
    socket.on(EVENTS.ROOM.HOST_DISCONNECTED, cb);
    return () => socket.off(EVENTS.ROOM.HOST_DISCONNECTED, cb);
  },
};
