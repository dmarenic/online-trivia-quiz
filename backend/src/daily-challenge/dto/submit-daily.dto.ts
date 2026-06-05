import {
  IsArray,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class DailyAnswerDto {
  @IsString()
  @MinLength(1)
  questionId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  answer: string;
}

export class SubmitDailyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  nickname: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DailyAnswerDto)
  answers: DailyAnswerDto[];
}