import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class SaveResultDto {
  @IsString()
  @Min(1)
  @MaxLength(30)
  nickname: string;

  @IsInt()
  @Min(0)
  @Max(100000)
  score: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  correctAnswers?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  totalQuestions?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  mode?: string;
}