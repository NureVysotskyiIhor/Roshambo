import { Socket } from 'socket.io';

export interface SocketData {
  user: { id: string; username: string };
  roomCode?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppSocket = Socket<any, any, any, SocketData>;
