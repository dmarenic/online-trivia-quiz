import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from '../../config/validation.constants';

export class UpdateAvatarDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  avatar: string;
}

export class UpdateUsernameDto {
  // Rubni razmaci se uklanjaju prije validacije, inače bi " ab " prošao
  // provjeru duljine, a u bazu bi otišao nadimak od dva znaka.
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(USERNAME_MIN_LENGTH)
  @MaxLength(USERNAME_MAX_LENGTH)
  username: string;
}

export class AddFriendDto {
  @IsString()
  @MinLength(USERNAME_MIN_LENGTH)
  @MaxLength(USERNAME_MAX_LENGTH)
  username: string;
}
