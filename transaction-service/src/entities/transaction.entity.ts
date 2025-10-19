import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity('transactions')
@Index(['user_id', 'timestamp'])
@Index(['transaction_id'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  transaction_id: string;

  @Column()
  user_id: string;

  @Column('decimal', { precision: 15, scale: 2, transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) } })
  amount: number;

  @Column({ type: 'enum', enum: ['deposit', 'withdraw'] })
  type: 'deposit' | 'withdraw';

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column('decimal', { precision: 15, scale: 2, transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) } })
  balance_after: number;

  @Column({ default: 'completed' })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ManyToOne(() => User, user => user.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'user_id' })
  user: User;
}

