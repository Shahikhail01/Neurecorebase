import { Injectable } from '@nestjs/common';
import { IFeatureStore } from '../interfaces/IFeatureStore';
import { TenantContextService } from '../../../common/context/tenant-context.service';

@Injectable()
export class MemoryFeatureStore implements IFeatureStore {
  constructor(private readonly tenantContext: TenantContextService) {}

  private readonly store: Map<
    string,
    Array<{ features: Record<string, unknown>; timestamp: string }>
  > = new Map();

  async save(features: Record<string, unknown>, timestamp?: string): Promise<void> {
    const tenantId = this.tenantContext.tenantId;
    const ts = timestamp ?? new Date().toISOString();
    const arr = this.store.get(tenantId) ?? [];
    arr.unshift({ features, timestamp: ts });
    this.store.set(tenantId, arr);
  }

  async getLatest(): Promise<{ features: Record<string, unknown>; timestamp: string } | null> {
    const tenantId = this.tenantContext.tenantId;
    const arr = this.store.get(tenantId) ?? [];
    return arr.length > 0 ? arr[0] : null;
  }

  async list(limit = 50): Promise<Array<{ features: Record<string, unknown>; timestamp: string }>> {
    const tenantId = this.tenantContext.tenantId;
    const arr = this.store.get(tenantId) ?? [];
    return arr.slice(0, limit);
  }
}
