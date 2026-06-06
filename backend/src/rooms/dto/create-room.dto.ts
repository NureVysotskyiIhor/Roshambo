import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;
}
