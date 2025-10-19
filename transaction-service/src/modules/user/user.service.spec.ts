import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { User } from '../../entities/user.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<User>;

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUserId', () => {
    const userId = 'user-456';
    const mockUser = {
      id: '1',
      user_id: userId,
      balance: 100,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('debería encontrar usuario por user_id', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByUserId(userId);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { user_id: userId } });
      expect(result).toEqual(mockUser);
    });

    it('debería lanzar NotFoundException para usuario inexistente', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findByUserId(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getOrCreateUser', () => {
    const userId = 'user-456';
    const mockUser = {
      id: '1',
      user_id: userId,
      balance: 0,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('debería devolver usuario existente', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getOrCreateUser(userId);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { user_id: userId } });
      expect(result).toEqual(mockUser);
    });

    it('debería crear nuevo usuario si no existe', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await service.getOrCreateUser(userId);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { user_id: userId } });
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        user_id: userId,
        balance: 0,
        is_active: true,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUserBalance', () => {
    const userId = 'user-456';
    const newBalance = 200;
    const mockUser = {
      id: '1',
      user_id: userId,
      balance: 100,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('debería actualizar balance de usuario', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({ ...mockUser, balance: newBalance });

      const result = await service.updateUserBalance(userId, newBalance);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { user_id: userId } });
      expect(mockUserRepository.save).toHaveBeenCalledWith({ ...mockUser, balance: newBalance });
      expect(result.balance).toBe(newBalance);
    });

    it('debería lanzar NotFoundException para usuario inexistente', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.updateUserBalance(userId, newBalance)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserBalance', () => {
    const userId = 'user-456';
    const mockUser = {
      id: '1',
      user_id: userId,
      balance: 100,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('debería obtener balance de usuario', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getUserBalance(userId);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { user_id: userId } });
      expect(result).toEqual({ balance: 100 });
    });

    it('debería lanzar NotFoundException para usuario inexistente', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.getUserBalance(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createUser', () => {
    const userId = 'user-456';
    const initialBalance = 50;
    const mockUser = {
      id: '1',
      user_id: userId,
      balance: initialBalance,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('debería crear nuevo usuario', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await service.createUser(userId, initialBalance);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { user_id: userId } });
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        user_id: userId,
        balance: initialBalance,
        is_active: true,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });

    it('debería lanzar BadRequestException para usuario existente', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.createUser(userId, initialBalance)).rejects.toThrow(BadRequestException);
    });
  });
});

