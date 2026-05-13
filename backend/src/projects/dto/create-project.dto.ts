import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  IsDateString,
  IsEnum,
  MinLength,
  Min,
  Max,
} from 'class-validator';
import { BudgetType } from '@prisma/client';

export class CreateProjectDto {
  @IsString()
  @MinLength(5)
  title: string;

  @IsString()
  @MinLength(20)
  description: string;

  @IsString()
  categoryId: string;

  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @IsInt()
  @Min(5000)     // minimum 5,000 KZT
  @Max(100_000_000)
  @IsOptional()
  budget?: number;

  @IsEnum(BudgetType)
  @IsOptional()
  budgetType?: BudgetType;

  @IsDateString()
  @IsOptional()
  deadline?: string;
}
