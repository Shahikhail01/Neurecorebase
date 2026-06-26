import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  ForbiddenException,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Logger,
  Redirect,
} from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { ConnectGoogleDto, ConnectBrevoDto } from './dto/integration.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../auth/interfaces/token.interface';
import { UserRole } from '@prisma/client';

@Controller({ path: 'integrations', version: '1' })
export class IntegrationsController {
  private readonly logger = new Logger(IntegrationsController.name);

  constructor(private readonly integrationsService: IntegrationsService) {}

  private resolveTenantId(user: JwtPayload, dtoTenantId?: string): string {
    if (user.role === UserRole.SUPER_ADMIN) {
      if (!dtoTenantId) throw new BadRequestException('tenantId required for SUPER_ADMIN');
      return dtoTenantId;
    }
    if (!user.tenantId) throw new ForbiddenException('Tenant context required');
    return user.tenantId;
  }

  @Get()
  async listIntegrations(
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    const tid = this.resolveTenantId(user, tenantId);
    return this.integrationsService.listIntegrations(tid);
  }

  @Get('google/status')
  async getGoogleStatus(
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    const tid = this.resolveTenantId(user, tenantId);
    return this.integrationsService.getGoogleConnectionStatus(tid);
  }

  @Get('brevo/status')
  async getBrevoStatus(
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    const tid = this.resolveTenantId(user, tenantId);
    return this.integrationsService.getBrevoConnectionStatus(tid);
  }

  @Post('google/authorize')
  @HttpCode(HttpStatus.OK)
  async authorizeGoogle(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ConnectGoogleDto,
    @Query('tenantId') tenantId?: string,
  ) {
    const tid = this.resolveTenantId(user, tenantId);
    return this.integrationsService.initiateGoogleOAuth(tid, dto.redirectUri);
  }

  @Public()
  @Get('google/callback')
  @Redirect(undefined, 302)
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error?: string,
  ) {
    if (error) {
      const encoded = Buffer.from(`Google OAuth error: ${error}`).toString('base64');
      return { url: `/settings/integrations?error=${encoded}` };
    }
    if (!code || !state) {
      const encoded = Buffer.from('Missing code or state parameter').toString('base64');
      return { url: `/settings/integrations?error=${encoded}` };
    }
    try {
      const result = await this.integrationsService.handleGoogleCallback(code, state);
      const params = new URLSearchParams({
        connected: String(result.connected),
        ...(result.email ? { email: result.email } : {}),
      });
      return { url: `/settings/integrations?${params.toString()}` };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OAuth failed';
      const encoded = Buffer.from(message).toString('base64');
      return { url: `/settings/integrations?error=${encoded}` };
    }
  }

  @Post('google/disconnect')
  @HttpCode(HttpStatus.OK)
  async disconnectGoogle(
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    const tid = this.resolveTenantId(user, tenantId);
    await this.integrationsService.disconnectGoogle(tid);
    return { success: true };
  }

  @Post('brevo/connect')
  @HttpCode(HttpStatus.OK)
  async connectBrevo(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ConnectBrevoDto,
    @Query('tenantId') tenantId?: string,
  ) {
    const tid = this.resolveTenantId(user, tenantId);
    return this.integrationsService.connectBrevo(tid, dto.apiKey);
  }

  @Post('brevo/disconnect')
  @HttpCode(HttpStatus.OK)
  async disconnectBrevo(
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    const tid = this.resolveTenantId(user, tenantId);
    await this.integrationsService.disconnectBrevo(tid);
    return { success: true };
  }
}
