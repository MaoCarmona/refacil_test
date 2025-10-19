import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { FraudAlert } from '../entities/fraud-alert.entity';

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  // Umbrales de configuración desde variables de entorno
  private readonly HIGH_AMOUNT_THRESHOLD: number;
  private readonly RAPID_SUCCESSION_TIME_WINDOW: number;
  private readonly RAPID_SUCCESSION_COUNT: number;

  constructor(
    @InjectRepository(FraudAlert)
    private readonly fraudAlertRepository: Repository<FraudAlert>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly configService: ConfigService,
  ) {
    // Inicializar umbrales desde variables de entorno con valores por defecto
    this.HIGH_AMOUNT_THRESHOLD = this.configService.get<number>('HIGH_AMOUNT_THRESHOLD', 10000);
    this.RAPID_SUCCESSION_TIME_WINDOW = this.configService.get<number>('RAPID_SUCCESSION_TIME_WINDOW', 300000); // 5 minutos en ms
    this.RAPID_SUCCESSION_COUNT = this.configService.get<number>('RAPID_SUCCESSION_COUNT', 3);

    this.logger.log(`Configuración de fraude cargada - Umbral: $${this.HIGH_AMOUNT_THRESHOLD}, Ventana: ${this.RAPID_SUCCESSION_TIME_WINDOW}ms, Conteo: ${this.RAPID_SUCCESSION_COUNT}`);
  }

  async checkForFraud(transaction: Transaction): Promise<void> {
    const alerts: string[] = [];

    // Verificar monto alto
    if (transaction.amount >= this.HIGH_AMOUNT_THRESHOLD) {
      alerts.push('high_amount');
      this.logger.warn(`Transacción de alto monto detectada: ${transaction.transaction_id} - $${transaction.amount}`);
    }

    // Verificar transacciones rápidas sucesivas
    const recentTransactions = await this.getRecentTransactionsForUser(
      transaction.user_id,
      transaction.timestamp,
      this.RAPID_SUCCESSION_TIME_WINDOW
    );

    if (recentTransactions.length >= this.RAPID_SUCCESSION_COUNT) {
      alerts.push('rapid_succession');
      this.logger.warn(`Transacciones rápidas detectadas para usuario ${transaction.user_id}: ${recentTransactions.length} en ventana de tiempo`);
    }

    // Crear alertas si se detectaron patrones sospechosos
    for (const alertType of alerts) {
      await this.createFraudAlert(
        transaction,
        alertType as 'high_amount' | 'rapid_succession' | 'unusual_pattern'
      );
    }
  }

  private async getRecentTransactionsForUser(
    userId: string,
    currentTransactionTime: Date,
    timeWindowMs: number
  ): Promise<Transaction[]> {
    const startTime = new Date(currentTransactionTime.getTime() - timeWindowMs);

    return await this.transactionRepository.find({
      where: {
        user_id: userId,
        timestamp: MoreThan(startTime),
        status: 'completed',
      },
      order: { timestamp: 'DESC' },
    });
  }

  private async createFraudAlert(
    transaction: Transaction,
    alertType: 'high_amount' | 'rapid_succession' | 'unusual_pattern'
  ): Promise<FraudAlert> {
    const alertDescriptions = {
      high_amount: `Transacción de monto elevado: $${transaction.amount}`,
      rapid_succession: `Múltiples transacciones en corto período de tiempo`,
      unusual_pattern: `Patrón de transacciones inusual detectado`,
    };

    const fraudAlert = this.fraudAlertRepository.create({
      transaction_id: transaction.transaction_id,
      user_id: transaction.user_id,
      alert_type: alertType,
      amount: transaction.amount,
      description: alertDescriptions[alertType],
      status: 'pending',
    });

    const savedAlert = await this.fraudAlertRepository.save(fraudAlert);

    this.logger.warn(`Alerta de fraude creada: ${savedAlert.id} - ${alertType} para transacción ${transaction.transaction_id}`);

    return savedAlert;
  }

  async getFraudAlerts(userId?: string): Promise<FraudAlert[]> {
    const whereCondition = userId ? { user_id: userId } : {};

    return await this.fraudAlertRepository.find({
      where: whereCondition,
      order: { created_at: 'DESC' },
      relations: ['transaction'],
    });
  }

  async resolveFraudAlert(alertId: string, resolution: 'legitimate' | 'fraudulent'): Promise<FraudAlert> {
    const alert = await this.fraudAlertRepository.findOne({ where: { id: alertId } });

    if (!alert) {
      throw new Error(`Alerta de fraude con ID ${alertId} no encontrada`);
    }

    alert.status = resolution === 'legitimate' ? 'resolved_legitimate' : 'resolved_fraudulent';

    return await this.fraudAlertRepository.save(alert);
  }
}

