import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateAvatarDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  avatar: string;
}

export class InviteRoomDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  toUserId: string;

  @IsString()
  @MinLength(3)
  @MaxLength(20)
  roomCode: string;
}

export class AddFriendDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username: string;
}