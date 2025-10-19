import { IsString, IsNumber, IsEnum, IsDateString, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({ example: 'txn_123456', description: 'ID único de la transacción (autogenerado si no se envía)', required: false })
  @IsOptional()
  @IsString()
  transaction_id?: string;

  @ApiProperty({ example: 'user_789', description: 'ID del usuario' })
  @IsString()
  user_id: string;

  @ApiProperty({ example: 100.5, description: 'Monto de la transacción (positivo)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  amount: number;

  @ApiProperty({ enum: ['deposit', 'withdraw'], example: 'deposit', description: 'Tipo de transacción' })
  @IsEnum(['deposit', 'withdraw'], { message: 'El tipo debe ser deposit o withdraw' })
  type: 'deposit' | 'withdraw';

  @ApiProperty({ example: '2025-01-15T10:30:00Z', description: 'Fecha y hora en ISO 8601 (autogenerado si no se envía)', required: false })
  @IsOptional()
  @IsDateString()
  timestamp?: string;
}

