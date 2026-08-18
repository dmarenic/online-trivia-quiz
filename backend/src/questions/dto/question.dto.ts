import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class QuestionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  category: string;

  // Neobavezno radi kompatibilnosti: ako izostane, Prisma pri kreiranju
  // primjenjuje default "medium", a pri izmjeni ostavlja postojeću vrijednost.
  @IsOptional()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: string;

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  question: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  optionA: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  optionB: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  optionC: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  optionD: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  correctAnswer: string;
}

export class GenerateAiQuestionsDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  topic: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  category: string;

  @IsString()
  @IsIn(['easy', 'medium', 'hard', 'lagano', 'srednje', 'teško'])
  difficulty: string;

  @IsInt()
  @Min(1)
  @Max(20)
  count: number;
}
