import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  ForbiddenException,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Logger,
  Redirect,
} from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { ConnectGoogleDto, ConnectBrevoDto } from './dto/integration.dto';
import { GoogleGmailService } from './google/google-gmail.service';
import type { SendEmailInput } from './google/google-gmail.service';
import { GoogleCalendarService } from './google/google-calendar.service';
import type { CreateEventInput } from './google/google-calendar.service';
import { GoogleDriveService } from './google/google-drive.service';
import { BrevoUsageService } from './brevo/brevo-usage.service';

type CreateEventBody = CreateEventInput;
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../auth/interfaces/token.interface';
import { UserRole } from '@prisma/client';

@Controller({ path: 'integrations', version: '1' })
export class IntegrationsController {
  private readonly logger = new Logger(IntegrationsController.name);

  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly gmailService: GoogleGmailService,
    private readonly calendarService: GoogleCalendarService,
    private readonly driveService: GoogleDriveService,
    private readonly brevoUsage: BrevoUsageService,
  ) {}

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

  @Get('usage/brevo')
  async getBrevoUsage(
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    const tid = this.resolveTenantId(user, tenantId);
    return this.brevoUsage.getStatus(tid);
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

  // ─── Gmail endpoints ────────────────────────────────────────────────

  @Get('gmail/inbox')
  async getInbox(
    @CurrentUser() user: JwtPayload,
    @Query('maxResults') maxResults?: string,
    @Query('pageToken') pageToken?: string,
    @Query('q') q?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const tid = this.resolveTenantId(user, tenantId);
    return this.gmailService.listInbox(tid, {
      maxResults: maxResults ? Number(maxResults) : undefined,
      pageToken,
      q,
    });
  }

  @Get('gmail/messages/:id')
  async getMessage(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const tid = this.resolveTenantId(user, tenantId);
    return this.gmailService.getMessage(tid, id);
  }

  @Get('gmail/messages/:id/body')
  async getMessageBody(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const tid = this.resolveTenantId(user, tenantId);
    return this.gmailService.getMessageBody(tid, id);
  }

  @Post('gmail/send')
  @HttpCode(HttpStatus.OK)
  async sendEmail(
    @CurrentUser() user: JwtPayload,
    @Body() body: SendEmailInput,
    @Query('tenantId') tenantId?: string,
  ) {
    const tid = this.resolveTenantId(user, tenantId);
    return this.gmailService.sendEmail(tid, body);
  }

  @Get('gmail/labels')
  async getLabels(
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    const tid = this.resolveTenantId(user, tenantId);
    return this.gmailService.listLabels(tid);
  }

  // ─── Calendar endpoints ─────────────────────────────────────────────

  @Get('calendar/events')
  async getEvents(
    @CurrentUser() user: JwtPayload,
    @Query('calendarId') calendarId?: string,
    @Query('maxResults') maxResults?: string,
    @Query('timeMin') timeMin?: string,
    @Query('timeMax') timeMax?: string,
    @Query('q') q?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const tid = this.resolveTenantId(user, tenantId);
    return this.calendarService.listEvents(tid, {
      calendarId,
      maxResults: maxResults ? Number(maxResults) : undefined,
      timeMin,
      timeMax,
      q,
    });
  }

  @Post('calendar/events')
  @HttpCode(HttpStatus.OK)
  async createEvent(
    @CurrentUser() user: JwtPayload,
    @Body() body: CreateEventBody,
    @Query('calendarId') calendarId?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const tid = this.resolveTenantId(user, tenantId);
    return this.calendarService.createEvent(tid, body, calendarId);
  }

  @Delete('calendar/events/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEvent(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('calendarId') calendarId?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const tid = this.resolveTenantId(user, tenantId);
    await this.calendarService.deleteEvent(tid, id, calendarId);
  }

  @Get('calendar/list')
  async getCalendarList(
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    const tid = this.resolveTenantId(user, tenantId);
    return this.calendarService.listCalendars(tid);
  }

  // ─── Drive endpoints ────────────────────────────────────────────────

  @Get('drive/folders/agents')
  async listAgentFolders(
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    const tid = this.resolveTenantId(user, tenantId);
    return this.driveService.listAgentFolders(tid);
  }

  @Get('google/drive-folders')
  async getGoogleDriveFolders(
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    const tid = this.resolveTenantId(user, tenantId);
    return this.driveService.listRootTree(tid);
  }

  @Post('drive/folders/agents/:agentId/setup')
  @HttpCode(HttpStatus.OK)
  async setupAgentFolders(
    @CurrentUser() user: JwtPayload,
    @Param('agentId') agentId: string,
    @Body('agentName') agentName: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const tid = this.resolveTenantId(user, tenantId);
    return this.driveService.setupAgentFolders(tid, agentId, agentName);
  }

  @Get('drive/folders/:folderId/files')
  async listDriveFiles(
    @CurrentUser() user: JwtPayload,
    @Param('folderId') folderId: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const tid = this.resolveTenantId(user, tenantId);
    return this.driveService.listFiles(tid, folderId);
  }

  @Post('drive/folders')
  @HttpCode(HttpStatus.OK)
  async createDriveFolder(
    @CurrentUser() user: JwtPayload,
    @Body() body: { name: string; parentId?: string },
    @Query('tenantId') tenantId?: string,
  ) {
    const tid = this.resolveTenantId(user, tenantId);
    return this.driveService.createFolder(tid, body);
  }

  @Post('drive/files')
  @HttpCode(HttpStatus.OK)
  async createDriveFile(
    @CurrentUser() user: JwtPayload,
    @Body() body: { name: string; content: string; mimeType?: string; parentId?: string },
    @Query('tenantId') tenantId?: string,
  ) {
    const tid = this.resolveTenantId(user, tenantId);
    return this.driveService.createFile(tid, body);
  }
}