import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsApi } from '../api/rooms.api';
import { roomStore } from '../store/room.store';

export const roomKeys = {
  my: () => ['rooms', 'my'] as const,
  detail: (code: string) => ['rooms', code] as const,
};

export const useMyRoom = () =>
  useQuery({
    queryKey: roomKeys.my(),
    queryFn: roomsApi.getMyRoom,
  });

export const useRoomByCode = (code: string) =>
  useQuery({
    queryKey: roomKeys.detail(code),
    queryFn: () => roomsApi.getRoomByCode(code),
    enabled: !!code,
  });

export const useCreateRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: roomsApi.createRoom,
    onSuccess: (room) => {
      roomStore.getState().setRoom(room);
      qc.setQueryData(roomKeys.my(), room);
    },
  });
};

export const useJoinRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: roomsApi.joinRoom,
    onSuccess: (room) => {
      roomStore.getState().setRoom(room);
      qc.setQueryData(roomKeys.my(), room);
    },
  });
};
