import { Injectable, Logger } from '@nestjs/common';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogContext {
  userId?: string;
  transactionId?: string;
  operation?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class LoggingService {
  private readonly logger = new Logger('TransactionService');

  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';

    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;

    switch (level) {
      case LogLevel.ERROR:
        this.logger.error(formattedMessage);
        break;
      case LogLevel.WARN:
        this.logger.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        this.logger.log(formattedMessage);
        break;
      case LogLevel.DEBUG:
        this.logger.debug(formattedMessage);
        break;
    }
  }

  logTransactionStart(transactionId: string, userId: string, amount: number, type: string): void {
    this.info('Inicio de procesamiento de transacción', {
      transactionId,
      userId,
      operation: 'transaction_start',
      metadata: { amount, type },
    });
  }

  logTransactionSuccess(transactionId: string, userId: string): void {
    this.info('Transacción procesada exitosamente', {
      transactionId,
      userId,
      operation: 'transaction_success',
    });
  }

  logTransactionError(transactionId: string, userId: string, error: string): void {
    this.error('Error procesando transacción', {
      transactionId,
      userId,
      operation: 'transaction_error',
      metadata: { error },
    });
  }

  logFraudAlert(transactionId: string, userId: string, alertType: string): void {
    this.warn('Alerta de fraude detectada', {
      transactionId,
      userId,
      operation: 'fraud_alert',
      metadata: { alertType },
    });
  }

  logBalanceUpdate(userId: string, oldBalance: number, newBalance: number): void {
    this.debug('Balance de usuario actualizado', {
      userId,
      operation: 'balance_update',
      metadata: { oldBalance, newBalance },
    });
  }
}

