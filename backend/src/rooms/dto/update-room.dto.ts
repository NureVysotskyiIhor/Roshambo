import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateRoomDto {
  @IsString()
  @MaxLength(100)
  @IsNotEmpty()
  name!: string;
}
