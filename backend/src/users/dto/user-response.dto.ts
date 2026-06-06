export class UserResponseDto {
  id!: string;
  username!: string;
  avatarUrl!: string;
  role!: string;
  email!: string | null;
  isEmailVerified!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
