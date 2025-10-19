import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction } from '../../entities/transaction.entity';
import { User } from '../../entities/user.entity';
import { CreateTransactionDto } from '../../dto/create-transaction.dto';
import { TransactionQueryDto } from '../../dto/transaction-query.dto';
import { UserService } from '../user/user.service';
import { FraudDetectionService } from '../../fraud-detection/fraud-detection.service';
import { LoggingService } from '../../common/services/logging.service';
import { randomUUID } from 'crypto';

@Injectable()
export class TransactionService {

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userService: UserService,
    private readonly fraudDetectionService: FraudDetectionService,
    private readonly loggingService: LoggingService,
  ) {}

  async createTransaction(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const generatedTransactionId = createTransactionDto.transaction_id ?? `txn_${randomUUID()}`;
    const nowIso = new Date().toISOString();

    this.loggingService.logTransactionStart(
      generatedTransactionId,
      createTransactionDto.user_id,
      createTransactionDto.amount,
      createTransactionDto.type
    );

    try {

      const dtoWithDefaults = {
        ...createTransactionDto,
        transaction_id: generatedTransactionId,
        timestamp: createTransactionDto.timestamp ?? nowIso,
      } as CreateTransactionDto & { transaction_id: string; timestamp: string };

      this.validateTransactionData(dtoWithDefaults);

      const user = await this.userService.getOrCreateUser(createTransactionDto.user_id);

      const amountNumber = Number(createTransactionDto.amount);
      const currentBalance = Number(user.balance ?? 0);

      if (createTransactionDto.type === 'withdraw') {
        if (currentBalance < amountNumber) {
          throw new BadRequestException('Fondos insuficientes para realizar el retiro');
        }
      }

      const newBalance = createTransactionDto.type === 'deposit'
        ? currentBalance + amountNumber
        : currentBalance - amountNumber;

      const transaction = this.transactionRepository.create({
        ...dtoWithDefaults,
        timestamp: new Date(dtoWithDefaults.timestamp),
        balance_after: newBalance,
        status: 'completed',
      });

      const savedTransaction = await this.transactionRepository.manager.transaction(
        async (manager) => {
          const savedTransaction = await manager.save(Transaction, transaction);

          await manager.update(User, { user_id: createTransactionDto.user_id }, {
            balance: newBalance,
          });

          this.loggingService.logBalanceUpdate(createTransactionDto.user_id, Number(user.balance), newBalance);

          return savedTransaction;
        }
      );

      try {
        await this.fraudDetectionService.checkForFraud(savedTransaction);
      } catch (fraudError) {
        this.loggingService.logFraudAlert(
          savedTransaction.transaction_id,
          savedTransaction.user_id,
          'Sistema de fraude activado'
        );
      }

      this.loggingService.logTransactionSuccess(generatedTransactionId, createTransactionDto.user_id);

      return savedTransaction;

    } catch (error) {
      this.loggingService.logTransactionError(generatedTransactionId, createTransactionDto.user_id, error.message || 'Error desconocido');

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Error interno procesando la transacción');
    }
  }

  async getTransactionHistory(queryDto: TransactionQueryDto): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { user_id, start_date, end_date, page = 1, limit = 10 } = queryDto;

      const whereConditions: any = { user_id };

      if (start_date && end_date) {
        whereConditions.timestamp = Between(
          new Date(start_date),
          new Date(end_date)
        );
      }
      
      const offset = (page - 1) * limit;

      const [transactions, total] = await this.transactionRepository.findAndCount({
        where: whereConditions,
        order: { timestamp: 'DESC' },
        take: limit,
        skip: offset,
        relations: ['user'],
      });

      const totalPages = Math.ceil(total / limit);

      return {
        transactions,
        total,
        page,
        limit,
        totalPages,
      };

    } catch (error) {
      this.loggingService.error('Error obteniendo historial de transacciones', {
        operation: 'getTransactionHistory',
        metadata: { error: error.message, userId: queryDto.user_id }
      });
      throw new InternalServerErrorException('Error obteniendo historial de transacciones');
    }
  }

  async getTransactionById(transactionId: string): Promise<Transaction> {
    try {
      const transaction = await this.transactionRepository.findOne({
        where: { transaction_id: transactionId },
        relations: ['user'],
      });

      if (!transaction) {
        throw new NotFoundException(`Transacción con ID ${transactionId} no encontrada`);
      }

      return transaction;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.loggingService.error('Error obteniendo transacción por ID', {
        operation: 'getTransactionById',
        metadata: { error: error.message, transactionId }
      });
      throw new InternalServerErrorException('Error obteniendo la transacción');
    }
  }

  private validateTransactionData(dto: CreateTransactionDto): void {
    const timestampToUse = dto.timestamp ?? new Date().toISOString();
    const transactionTime = new Date(timestampToUse);
    const now = new Date();

    if (transactionTime > now) {
      throw new BadRequestException('La fecha de la transacción no puede ser futura');
    }

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (transactionTime < thirtyDaysAgo) {
      throw new BadRequestException('La transacción es demasiado antigua (máximo 30 días)');
    }
    
    const MAX_AMOUNT = 100000;
    if (dto.amount > MAX_AMOUNT) {
      throw new BadRequestException(`El monto máximo por transacción es $${MAX_AMOUNT}`);
    }
  }
}
