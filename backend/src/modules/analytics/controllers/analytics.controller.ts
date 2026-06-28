import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiCommon } from '../../../common/decorators/api-common.decorator';
import { AnalyticsService } from '../services/analytics.service';
import { ScoreRequestDto } from '../dto/score-request.dto';
import { ForecastRequestDto } from '../dto/forecast-request.dto';
import { AnomalyRequestDto } from '../dto/anomaly-request.dto';
import { EmbedRequestDto } from '../dto/embed-request.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/interfaces/token.interface';

@ApiCommon('analytics')
@Controller({ path: 'analytics', version: '1' })
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('models')
  getModels() {
    return this.analyticsService.getModels();
  }

  @Get('report')
  getReport() {
    return this.analyticsService.getReport();
  }

  @Get('features')
  getFeatures(@Query('limit') limit?: string) {
    return this.analyticsService.getFeatureHistory(limit ? parseInt(limit, 10) : 50);
  }

  @Post('score')
  @HttpCode(HttpStatus.OK)
  score(@Body() dto: ScoreRequestDto) {
    return this.analyticsService.score(dto.features);
  }

  @Post('forecast')
  @HttpCode(HttpStatus.OK)
  forecast(@Body() dto: ForecastRequestDto) {
    return this.analyticsService.forecast(dto.periods ?? 30);
  }

  @Post('anomaly')
  @HttpCode(HttpStatus.OK)
  anomaly(@Body() dto: AnomalyRequestDto) {
    return this.analyticsService.detectAnomalies(dto.vectors);
  }

  @Post('embed')
  @HttpCode(HttpStatus.OK)
  embed(@Body() dto: EmbedRequestDto) {
    return this.analyticsService.embed(dto.texts);
  }
}
