import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  HttpException,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateTransactionDto } from '../../dto/create-transaction.dto';
import { TransactionQueryDto } from '../../dto/transaction-query.dto';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una transacción' })
  @ApiResponse({ status: 201, description: 'Transacción creada' })
  @ApiResponse({ status: 400, description: 'Validación fallida' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  async createTransaction(@Body() createTransactionDto: CreateTransactionDto) {
    try {
      const transaction = await this.transactionService.createTransaction(createTransactionDto);
      return {
        success: true,
        message: 'Transacción procesada exitosamente',
        data: transaction,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error procesando la transacción',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('history')
  @ApiOperation({ summary: 'Obtener historial de transacciones' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  async getTransactionHistory(@Query() queryDto: TransactionQueryDto) {
    try {
      return await this.transactionService.getTransactionHistory(queryDto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error obteniendo historial de transacciones',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':transactionId')
  @ApiOperation({ summary: 'Obtener transacción por ID' })
  async getTransactionById(@Param('transactionId') transactionId: string) {
    try {
      const transaction = await this.transactionService.getTransactionById(transactionId);
      return {
        success: true,
        data: transaction,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error obteniendo la transacción',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

