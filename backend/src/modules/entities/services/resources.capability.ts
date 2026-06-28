/**
 * ResourcesCapability — Phase 3 capability surface for the Resources panel.
 *
 * Returns: humanTeam, aiTeam, budget, documents, assets, knowledge,
 * integrations. Per EAOS-implementation-plan.md §1.5.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { EntityResolverService } from './entity-resolver.service';
import type { EaosEntityType } from '../dto/entity.dto';

export interface ResourcesPanel {
  id: string;
  type: string;
  humanTeam: Array<{ id: string; name: string; role: string | null }>;
  aiTeam: Array<{ id: string; name: string; status: string }>;
  budget: { allocated: number | null; spent: number | null; currency: string };
  integrations: Array<{ id: string; name: string; isActive: boolean }>;
}

@Injectable()
export class ResourcesCapability {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resolver: EntityResolverService,
  ) {}

  async get(
    type: EaosEntityType,
    id: string,
    tenantId: string,
  ): Promise<ResourcesPanel> {
    const entity = await this.resolver.resolve(type, id, tenantId);

    // Resolve "team" via ownership row.
    const ownership = await this.prisma.entityOwnership.findUnique({
      where: {
        tenantId_entityType_entityId: { tenantId, entityType: type, entityId: id },
      },
    });

    let humanTeam: ResourcesPanel['humanTeam'] = [];
    if (ownership?.ownerId) {
      const owner = await this.prisma.user.findUnique({
        where: { id: ownership.ownerId },
        select: { id: true, firstName: true, lastName: true, role: true },
      });
      if (owner) {
        humanTeam = [
          {
            id: owner.id,
            name: `${owner.firstName} ${owner.lastName}`.trim(),
            role: owner.role,
          },
        ];
      }
    }

    // AI Team: any AGENT entity related via REFERENCES / ASSIGNED_TO edges.
    const aiRels = await this.prisma.entityRelationship.findMany({
      where: {
        tenantId,
        type: { in: ['ASSIGNED_TO', 'REFERENCES'] },
        OR: [
          { fromType: type, fromId: id },
          { toType: type, toId: id },
        ],
        toType: 'AGENT',
      },
      take: 50,
    });
    const agentIds = Array.from(new Set(aiRels.map((r) => r.toId)));
    const agents =
      agentIds.length === 0
        ? []
        : await this.prisma.agent.findMany({
            where: { id: { in: agentIds }, tenantId },
            select: { id: true, name: true, status: true },
          });

    const integrations = await this.prisma.toolIntegration.findMany({
      where: { OR: [{ tenantId }, { tenantId: null }] },
      select: { id: true, name: true, isActive: true },
      take: 50,
    });

    return {
      id: entity.id,
      type: entity.type,
      humanTeam,
      aiTeam: agents.map((a) => ({
        id: a.id,
        name: a.name,
        status: a.status,
      })),
      budget: { allocated: null, spent: null, currency: 'USD' },
      integrations: integrations.map((i) => ({
        id: i.id,
        name: i.name,
        isActive: i.isActive,
      })),
    };
  }
}
