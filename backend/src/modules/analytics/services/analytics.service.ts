import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { TenantContextService } from '../../../common/context/tenant-context.service';
import type { IFeatureStore } from '../interfaces/IFeatureStore';
import { HttpModelRunner } from './modelRunner.http';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly featureStore: IFeatureStore,
    private readonly modelRunner: HttpModelRunner,
    private readonly tenantContext: TenantContextService,
  ) {}

  async getModels() {
    const tenantId = this.tenantContext.tenantId;
    return this.prisma.analyticsModel.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async score(features: Record<string, unknown>): Promise<Record<string, unknown>> {
    const tenantId = this.tenantContext.tenantId;
    await this.featureStore.save(features);
    const models = await this.getModels();
    const model = models[0];
    if (!model)
      this.logger.warn(`No model for tenant ${tenantId}; using runner default`);
    return this.modelRunner.runModel(model?.id ?? 'default', features);
  }

  async forecast(periods: number): Promise<Record<string, unknown>> {
    const tenantId = this.tenantContext.tenantId;
    const result = await this.modelRunner.forecast(periods);
    return { tenantId, periods, ...result };
  }

  async detectAnomalies(vectors: number[][]): Promise<Record<string, unknown>> {
    const tenantId = this.tenantContext.tenantId;
    const result = await this.modelRunner.detectAnomalies(vectors);
    return { tenantId, ...result };
  }

  async embed(texts: string[]): Promise<Record<string, unknown>> {
    const tenantId = this.tenantContext.tenantId;
    const result = await this.modelRunner.embed(texts);
    return { tenantId, count: texts.length, ...result };
  }

  async getFeatureHistory(limit = 50) {
    return this.featureStore.list(limit);
  }

  async getLatestFeatures() {
    return this.featureStore.getLatest();
  }

  async getReport() {
    const tenantId = this.tenantContext.tenantId;
    const [models, latest] = await Promise.all([
      this.getModels(),
      this.featureStore.getLatest(),
    ]);
    return {
      tenantId,
      models: models.map((m) => ({
        id: m.id,
        name: m.name,
        version: m.version,
      })),
      latestFeatures: latest,
      generatedAt: new Date().toISOString(),
    };
  }
}
