import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByUserId(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { user_id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }
    return user;
  }

  async getOrCreateUser(userId: string): Promise<User> {
    let user = await this.userRepository.findOne({ where: { user_id: userId } });

    if (!user) {
      user = this.userRepository.create({
        user_id: userId,
        balance: 0,
        is_active: true,
      });
      await this.userRepository.save(user);
    }

    return user;
  }

  async updateUserBalance(userId: string, newBalance: number): Promise<User> {
    const user = await this.findByUserId(userId);
    user.balance = newBalance;
    return await this.userRepository.save(user);
  }

  async getUserBalance(userId: string): Promise<{ balance: number }> {
    const user = await this.findByUserId(userId);
    return { balance: user.balance };
  }

  async createUser(userId: string, initialBalance: number = 0): Promise<User> {
    const existingUser = await this.userRepository.findOne({ where: { user_id: userId } });

    if (existingUser) {
      throw new BadRequestException(`Usuario con ID ${userId} ya existe`);
    }

    const user = this.userRepository.create({
      user_id: userId,
      balance: initialBalance,
      is_active: true,
    });

    return await this.userRepository.save(user);
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.find();
  }
}

