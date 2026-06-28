import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { ConnectorRegistry } from '../connector.registry';
import { ICRMConnector } from '../interfaces/ICRMConnector';
import { TenantContextService } from '../../../common/context/tenant-context.service';

/**
 * ConnectorService — Phase 4.2
 *
 * SRP:  Orchestrates connector lifecycle; does NOT implement HTTP calls.
 * OCP:  New connector types plug in through ConnectorRegistry without touching this service.
 * DIP:  Depends on ConnectorRegistry (interface-level lookup), not concrete adapters.
 */
@Injectable()
export class ConnectorService {
  private readonly logger = new Logger(ConnectorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: ConnectorRegistry,
    private readonly tenantContext: TenantContextService,
  ) {}

  listAvailableProviders(): string[] {
    return this.registry.list();
  }

  async listConnectors() {
    const tenantId = this.tenantContext.tenantId;
    const where = tenantId ? { tenantId } : {};
    return this.prisma.crmConnector.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createConnector(
    name: string,
    provider: string,
    config: Record<string, unknown> = {},
  ) {
    const tenantId = this.tenantContext.tenantId;
    if (!this.registry.get(provider))
      throw new NotFoundException(`Provider not supported: ${provider}`);
    return this.prisma.crmConnector.create({
      data: {
        tenantId,
        name,
        provider,
        config: config as Prisma.InputJsonValue,
      },
    });
  }

  async deleteConnector(id: string) {
    const tenantId = this.tenantContext.tenantId;
    const existing = await this.prisma.crmConnector.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException(`Connector ${id} not found`);
    return this.prisma.crmConnector.delete({ where: { id } });
  }

  async connect(
    id: string,
    config: Record<string, unknown>,
  ): Promise<void> {
    const tenantId = this.tenantContext.tenantId;
    const record = await this.prisma.crmConnector.findFirst({
      where: { id, tenantId },
    });
    if (!record) throw new NotFoundException(`Connector ${id} not found`);
    await this.getAdapter(record.provider).connect(config);
    await this.prisma.crmConnector.update({
      where: { id },
      data: { config: config as Prisma.InputJsonValue, isActive: true },
    });
    this.logger.log(
      `Connector ${record.name} connected for tenant ${tenantId}`,
    );
  }

  async disconnect(id: string): Promise<void> {
    const tenantId = this.tenantContext.tenantId;
    const record = await this.prisma.crmConnector.findFirst({
      where: { id, tenantId },
    });
    if (!record) throw new NotFoundException(`Connector ${id} not found`);
    await this.getAdapter(record.provider).disconnect();
    await this.prisma.crmConnector.update({
      where: { id },
      data: { isActive: false },
    });
    this.logger.log(`Connector ${record.name} disconnected`);
  }

  async syncContacts(id: string): Promise<void> {
    const tenantId = this.tenantContext.tenantId;
    const record = await this.prisma.crmConnector.findFirst({
      where: { id, tenantId, isActive: true },
    });
    if (!record)
      throw new NotFoundException(`Active connector ${id} not found`);
    const adapter = this.getAdapter(record.provider);
    if (!adapter.syncContacts)
      throw new NotFoundException(
        `Provider ${record.provider} does not support contact sync`,
      );
    await adapter.syncContacts(tenantId);
  }

  async syncLeads(id: string): Promise<void> {
    const tenantId = this.tenantContext.tenantId;
    const record = await this.prisma.crmConnector.findFirst({
      where: { id, tenantId, isActive: true },
    });
    if (!record)
      throw new NotFoundException(`Active connector ${id} not found`);
    const adapter = this.getAdapter(record.provider);
    if (!adapter.syncLeads)
      throw new NotFoundException(
        `Provider ${record.provider} does not support lead sync`,
      );
    await adapter.syncLeads(tenantId);
  }

  private getAdapter(provider: string): ICRMConnector {
    const adapter = this.registry.get(provider);
    if (!adapter)
      throw new NotFoundException(`No adapter registered for: ${provider}`);
    return adapter;
  }
}
