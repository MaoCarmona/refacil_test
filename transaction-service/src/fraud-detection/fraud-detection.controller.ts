import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { FraudDetectionService } from './fraud-detection.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('fraud-detection')
@Controller('fraud-detection')
export class FraudDetectionController {
  constructor(private readonly fraudDetectionService: FraudDetectionService) {}

  @Get('alerts')
  @ApiOperation({ summary: 'Listar alertas de fraude' })
  async getFraudAlerts(@Query('userId') userId?: string) {
    return await this.fraudDetectionService.getFraudAlerts(userId);
  }

  @Post('alerts/:alertId/resolve')
  @ApiOperation({ summary: 'Resolver alerta de fraude' })
  async resolveFraudAlert(
    @Param('alertId') alertId: string,
    @Body() body: { resolution: 'legitimate' | 'fraudulent' }
  ) {
    return await this.fraudDetectionService.resolveFraudAlert(alertId, body.resolution);
  }
}

