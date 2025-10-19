import { Test, TestingModule } from '@nestjs/testing';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from '../../dto/create-transaction.dto';
import { TransactionQueryDto } from '../../dto/transaction-query.dto';
import { BadRequestException } from '@nestjs/common';

describe('TransactionController', () => {
  let controller: TransactionController;
  let service: TransactionService;

  const mockTransactionService = {
    createTransaction: jest.fn(),
    getTransactionHistory: jest.fn(),
    getTransactionById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: TransactionService,
          useValue: mockTransactionService,
        },
      ],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
    service = module.get<TransactionService>(TransactionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createTransaction', () => {
    const createTransactionDto: CreateTransactionDto = {
      transaction_id: 'txn-123',
      user_id: 'user-456',
      amount: 100,
      type: 'deposit',
      timestamp: new Date().toISOString(),
    };

    const mockTransaction = {
      id: '1',
      ...createTransactionDto,
      timestamp: new Date(createTransactionDto.timestamp),
      balance_after: 150,
      status: 'completed',
      created_at: new Date(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('debería crear una transacción exitosamente', async () => {
      mockTransactionService.createTransaction.mockResolvedValue(mockTransaction);

      const result = await controller.createTransaction(createTransactionDto);

      expect(mockTransactionService.createTransaction).toHaveBeenCalledWith(createTransactionDto);
      expect(result).toEqual({
        success: true,
        message: 'Transacción procesada exitosamente',
        data: mockTransaction,
      });
    });

    it('debería manejar errores de validación', async () => {
      const invalidDto = { ...createTransactionDto, amount: -100 };
      mockTransactionService.createTransaction.mockRejectedValue(
        new BadRequestException('Monto inválido')
      );

      await expect(controller.createTransaction(invalidDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTransactionHistory', () => {
    const queryDto: TransactionQueryDto = {
      user_id: 'user-456',
      page: 1,
      limit: 10,
    };

    const mockHistoryResponse = {
      transactions: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('debería obtener historial de transacciones', async () => {
      mockTransactionService.getTransactionHistory.mockResolvedValue(mockHistoryResponse);

      const result = await controller.getTransactionHistory(queryDto);

      expect(mockTransactionService.getTransactionHistory).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(mockHistoryResponse);
    });

    it('debería usar valores por defecto para paginación', async () => {
      const queryWithoutPagination = { user_id: 'user-456' };

      mockTransactionService.getTransactionHistory.mockResolvedValue(mockHistoryResponse);

      await controller.getTransactionHistory(queryWithoutPagination as TransactionQueryDto);

      expect(mockTransactionService.getTransactionHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 10,
        })
      );
    });
  });

  describe('getTransactionById', () => {
    const transactionId = 'txn-123';
    const mockTransaction = {
      id: '1',
      transaction_id: transactionId,
      user_id: 'user-456',
      amount: 100,
      type: 'deposit',
      timestamp: new Date(),
      balance_after: 150,
      status: 'completed',
      created_at: new Date(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('debería obtener transacción por ID', async () => {
      mockTransactionService.getTransactionById.mockResolvedValue(mockTransaction);

      const result = await controller.getTransactionById(transactionId);

      expect(mockTransactionService.getTransactionById).toHaveBeenCalledWith(transactionId);
      expect(result).toEqual({
        success: true,
        data: mockTransaction,
      });
    });
  });
});

