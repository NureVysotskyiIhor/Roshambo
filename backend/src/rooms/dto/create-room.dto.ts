import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @MaxLength(50)
  @IsOptional()
  name?: string;
}
