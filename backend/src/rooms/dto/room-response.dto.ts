export class RoomResponseDto {
  id!: string;
  code!: string;
  name!: string | null;
  status!: 'waiting' | 'in_progress' | 'finished';
  isPrivate!: boolean;
  creatorId!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
