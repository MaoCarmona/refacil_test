import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FraudAlert } from '../entities/fraud-alert.entity';
import { Transaction } from '../entities/transaction.entity';
import { FraudDetectionService } from './fraud-detection.service';
import { FraudDetectionController } from './fraud-detection.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FraudAlert, Transaction])],
  providers: [FraudDetectionService],
  controllers: [FraudDetectionController],
  exports: [FraudDetectionService],
})
export class FraudDetectionModule {}
