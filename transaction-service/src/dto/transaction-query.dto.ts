import { IsString, IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransactionQueryDto {
  @ApiProperty({ example: 'user_789', description: 'ID del usuario' })
  @IsString()
  user_id: string;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00Z', description: 'Fecha inicio (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ example: '2025-01-31T23:59:59Z', description: 'Fecha fin (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ example: 1, description: 'Página de resultados (>=1)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Límite de resultados por página (>=1)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}

