import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Transaction } from './transaction.entity';

@Entity('fraud_alerts')
export class FraudAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  transaction_id: string;

  @Column()
  user_id: string;

  @Column({ type: 'enum', enum: ['high_amount', 'rapid_succession', 'unusual_pattern'] })
  alert_type: 'high_amount' | 'rapid_succession' | 'unusual_pattern';

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @Column('text')
  description: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;
}

