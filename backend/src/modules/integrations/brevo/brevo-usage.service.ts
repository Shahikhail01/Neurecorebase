import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { TenantContextService } from '../../../common/context/tenant-context.service';

const DAILY_LIMIT = 300;
const WARNING_THRESHOLD = 240;

@Injectable()
export class BrevoUsageService {
  private readonly logger = new Logger(BrevoUsageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private todayUtc(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  async recordSend(): Promise<void> {
    const tenantId = this.tenantContext.tenantId;
    const date = this.todayUtc();
    await this.prisma.brevoUsageCounter.upsert({
      where: { tenantId_date: { tenantId, date } },
      create: { tenantId, date, sentCount: 1 },
      update: { sentCount: { increment: 1 } },
    });
  }

  async getTodayCount(): Promise<number> {
    const tenantId = this.tenantContext.tenantId;
    const date = this.todayUtc();
    const row = await this.prisma.brevoUsageCounter.findUnique({
      where: { tenantId_date: { tenantId, date } },
    });
    return row?.sentCount ?? 0;
  }

  async checkLimit(): Promise<void> {
    const count = await this.getTodayCount();
    if (count >= DAILY_LIMIT) {
      throw new BadRequestException(
        `Brevo daily limit reached (${count}/${DAILY_LIMIT}). Upgrade plan or wait until tomorrow (UTC).`,
      );
    }
  }

  async getStatus() {
    const count = await this.getTodayCount();
    return {
      sentToday: count,
      dailyLimit: DAILY_LIMIT,
      warningThreshold: WARNING_THRESHOLD,
      isAtWarning: count >= WARNING_THRESHOLD && count < DAILY_LIMIT,
      isAtLimit: count >= DAILY_LIMIT,
      remaining: Math.max(0, DAILY_LIMIT - count),
    };
  }
}
