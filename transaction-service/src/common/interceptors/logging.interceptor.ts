import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';

    const startTime = Date.now();

    this.logger.log(
      `--> ${method} ${url} - ${ip} - "${userAgent}" - Inicio`,
    );

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;

        this.logger.log(
          `<-- ${method} ${url} - ${response.statusCode} - ${duration}ms`,
        );

        if (response.statusCode >= 400) {
          this.logger.error(
            `Error Response: ${method} ${url} - ${response.statusCode} - ${JSON.stringify(data)}`,
          );
        }

        if (url.includes('/transactions') && method === 'POST') {
          this.logger.log(`Nueva transacción procesada desde IP: ${ip}`);
        }
      }),
    );
  }
}

