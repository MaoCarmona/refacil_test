import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionService } from './transaction.service';
import { Transaction } from '../../entities/transaction.entity';
import { User } from '../../entities/user.entity';
import { UserService } from '../user/user.service';
import { FraudDetectionService } from '../../fraud-detection/fraud-detection.service';
import { LoggingService } from '../../common/services/logging.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('TransactionService', () => {
  let service: TransactionService;
  let transactionRepository: Repository<Transaction>;
  let userRepository: Repository<User>;
  let userService: UserService;
  let fraudDetectionService: FraudDetectionService;
  let loggingService: LoggingService;

  const mockTransactionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    manager: {
      transaction: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  };

  const mockUserService = {
    getOrCreateUser: jest.fn(),
  };

  const mockFraudDetectionService = {
    checkForFraud: jest.fn(),
  };

  const mockLoggingService = {
    logTransactionStart: jest.fn(),
    logTransactionSuccess: jest.fn(),
    logTransactionError: jest.fn(),
    logFraudAlert: jest.fn(),
    logBalanceUpdate: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: FraudDetectionService,
          useValue: mockFraudDetectionService,
        },
        {
          provide: LoggingService,
          useValue: mockLoggingService,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    transactionRepository = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    userService = module.get<UserService>(UserService);
    fraudDetectionService = module.get<FraudDetectionService>(FraudDetectionService);
    loggingService = module.get<LoggingService>(LoggingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTransaction', () => {
    const createTransactionDto = {
      transaction_id: 'txn-123',
      user_id: 'user-456',
      amount: 100,
      type: 'deposit' as const,
      timestamp: new Date().toISOString(),
    };

    const mockUser = {
      id: '1',
      user_id: 'user-456',
      balance: 50,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
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

    it('debería crear una transacción de depósito exitosamente', async () => {
      mockUserService.getOrCreateUser.mockResolvedValue(mockUser);
      mockTransactionRepository.create.mockReturnValue(mockTransaction);
      mockTransactionRepository.manager.transaction.mockImplementation(async (callback) => {
        return await callback(mockTransactionRepository.manager);
      });
      mockTransactionRepository.manager.save.mockResolvedValue(mockTransaction);
      mockTransactionRepository.manager.update.mockResolvedValue(undefined);

      const result = await service.createTransaction(createTransactionDto);

      expect(mockUserService.getOrCreateUser).toHaveBeenCalledWith('user-456');
      expect(mockTransactionRepository.create).toHaveBeenCalled();
      expect(mockTransactionRepository.manager.transaction).toHaveBeenCalled();
      expect(mockFraudDetectionService.checkForFraud).toHaveBeenCalledWith(mockTransaction);
      expect(loggingService.logTransactionStart).toHaveBeenCalled();
      expect(loggingService.logTransactionSuccess).toHaveBeenCalled();
      expect(result).toEqual(mockTransaction);
    });

    it('debería rechazar retiro con fondos insuficientes', async () => {
      const withdrawDto = { ...createTransactionDto, type: 'withdraw' as const, amount: 200 };
      mockUserService.getOrCreateUser.mockResolvedValue({ ...mockUser, balance: 50 });

      await expect(service.createTransaction(withdrawDto)).rejects.toThrow(BadRequestException);

      expect(loggingService.logTransactionStart).toHaveBeenCalled();
      expect(loggingService.logTransactionError).toHaveBeenCalled();
    });

    it('debería rechazar transacción con monto inválido', async () => {
      const invalidDto = { ...createTransactionDto, amount: -100 };

      await expect(service.createTransaction(invalidDto)).rejects.toThrow(BadRequestException);

      expect(loggingService.logTransactionError).toHaveBeenCalled();
    });

    it('debería rechazar transacción con timestamp futuro', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const futureDto = { ...createTransactionDto, timestamp: futureDate.toISOString() };

      await expect(service.createTransaction(futureDto)).rejects.toThrow(BadRequestException);

      expect(loggingService.logTransactionError).toHaveBeenCalled();
    });

    it('debería manejar errores de fraude silenciosamente', async () => {
      mockUserService.getOrCreateUser.mockResolvedValue(mockUser);
      mockTransactionRepository.create.mockReturnValue(mockTransaction);
      mockTransactionRepository.manager.transaction.mockImplementation(async (callback) => {
        return await callback(mockTransactionRepository.manager);
      });
      mockTransactionRepository.manager.save.mockResolvedValue(mockTransaction);
      mockTransactionRepository.manager.update.mockResolvedValue(undefined);
      mockFraudDetectionService.checkForFraud.mockRejectedValue(new Error('Error de fraude'));

      const result = await service.createTransaction(createTransactionDto);

      expect(mockFraudDetectionService.checkForFraud).toHaveBeenCalled();
      expect(loggingService.logFraudAlert).toHaveBeenCalled();
      expect(result).toEqual(mockTransaction); // La transacción aún se procesa
    });
  });

  describe('getTransactionHistory', () => {
    it('debería obtener historial de transacciones con paginación', async () => {
      const queryDto = {
        user_id: 'user-456',
        page: 1,
        limit: 10,
      };

      const mockTransactions = [];
      const mockCount = 0;

      mockTransactionRepository.findAndCount.mockResolvedValue([mockTransactions, mockCount]);

      const result = await service.getTransactionHistory(queryDto);

      expect(mockTransactionRepository.findAndCount).toHaveBeenCalled();
      expect(result).toEqual({
        transactions: mockTransactions,
        total: mockCount,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
    });

    it('debería manejar errores al obtener historial', async () => {
      const queryDto = {
        user_id: 'user-456',
        page: 1,
        limit: 10,
      };

      mockTransactionRepository.findAndCount.mockRejectedValue(new Error('Database error'));

      await expect(service.getTransactionHistory(queryDto)).rejects.toThrow();

      expect(loggingService.error).toHaveBeenCalled();
    });
  });

  describe('getTransactionById', () => {
    it('debería obtener transacción por ID', async () => {
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

      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);

      const result = await service.getTransactionById(transactionId);

      expect(mockTransactionRepository.findOne).toHaveBeenCalledWith({
        where: { transaction_id: transactionId },
        relations: ['user'],
      });
      expect(result).toEqual(mockTransaction);
    });

    it('debería lanzar NotFoundException para transacción inexistente', async () => {
      const transactionId = 'txn-nonexistent';

      mockTransactionRepository.findOne.mockResolvedValue(null);

      await expect(service.getTransactionById(transactionId)).rejects.toThrow(NotFoundException);
    });
  });
});

