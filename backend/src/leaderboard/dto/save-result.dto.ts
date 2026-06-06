import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SubmittedAnswerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  questionId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  answer: string;
}

export class SaveResultDto {
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  nickname: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  mode?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SubmittedAnswerDto)
  answers: SubmittedAnswerDto[];
}
