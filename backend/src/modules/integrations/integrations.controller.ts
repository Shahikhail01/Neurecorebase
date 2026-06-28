import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
  Redirect,
} from '@nestjs/common';
import { ApiCommon } from '../../common/decorators/api-common.decorator';
import { IntegrationsService } from './integrations.service';
import { ConnectGoogleDto, ConnectBrevoDto } from './dto/integration.dto';
import { GoogleGmailService } from './google/google-gmail.service';
import type { SendEmailInput } from './google/google-gmail.service';
import { GoogleCalendarService } from './google/google-calendar.service';
import type { CreateEventInput } from './google/google-calendar.service';
import { GoogleDriveService } from './google/google-drive.service';
import { BrevoUsageService } from './brevo/brevo-usage.service';
import { Public } from '../../common/decorators/roles.decorator';

type CreateEventBody = CreateEventInput;

@ApiCommon('integrations')
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

  @Get()
  async listIntegrations() {
    return this.integrationsService.listIntegrations();
  }

  @Get('google/status')
  async getGoogleStatus() {
    return this.integrationsService.getGoogleConnectionStatus();
  }

  @Get('brevo/status')
  async getBrevoStatus() {
    return this.integrationsService.getBrevoConnectionStatus();
  }

  @Get('usage/brevo')
  async getBrevoUsage() {
    return this.brevoUsage.getStatus();
  }

  @Post('google/authorize')
  @HttpCode(HttpStatus.OK)
  async authorizeGoogle(@Body() dto: ConnectGoogleDto) {
    return this.integrationsService.initiateGoogleOAuth(dto.redirectUri);
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
  async disconnectGoogle() {
    await this.integrationsService.disconnectGoogle();
    return { success: true };
  }

  @Post('brevo/connect')
  @HttpCode(HttpStatus.OK)
  async connectBrevo(@Body() dto: ConnectBrevoDto) {
    return this.integrationsService.connectBrevo(dto.apiKey);
  }

  @Post('brevo/disconnect')
  @HttpCode(HttpStatus.OK)
  async disconnectBrevo() {
    await this.integrationsService.disconnectBrevo();
    return { success: true };
  }

  // ─── Gmail endpoints ────────────────────────────────────────

  @Get('gmail/inbox')
  async getInbox(
    @Query('maxResults') maxResults?: string,
    @Query('pageToken') pageToken?: string,
    @Query('q') q?: string,
  ) {
    return this.gmailService.listInbox({
      maxResults: maxResults ? Number(maxResults) : undefined,
      pageToken,
      q,
    });
  }

  @Get('gmail/messages/:id')
  async getMessage(@Param('id') id: string) {
    return this.gmailService.getMessage(id);
  }

  @Get('gmail/messages/:id/body')
  async getMessageBody(@Param('id') id: string) {
    return this.gmailService.getMessageBody(id);
  }

  @Post('gmail/send')
  @HttpCode(HttpStatus.OK)
  async sendEmail(@Body() body: SendEmailInput) {
    return this.gmailService.sendEmail(body);
  }

  @Get('gmail/labels')
  async getLabels() {
    return this.gmailService.listLabels();
  }

  // ─── Calendar endpoints ─────────────────────────────────────

  @Get('calendar/events')
  async getEvents(
    @Query('calendarId') calendarId?: string,
    @Query('maxResults') maxResults?: string,
    @Query('timeMin') timeMin?: string,
    @Query('timeMax') timeMax?: string,
    @Query('q') q?: string,
  ) {
    return this.calendarService.listEvents({
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
    @Body() body: CreateEventBody,
    @Query('calendarId') calendarId?: string,
  ) {
    return this.calendarService.createEvent(body, calendarId);
  }

  @Delete('calendar/events/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEvent(
    @Param('id') id: string,
    @Query('calendarId') calendarId?: string,
  ) {
    await this.calendarService.deleteEvent(id, calendarId);
  }

  @Get('calendar/list')
  async getCalendarList() {
    return this.calendarService.listCalendars();
  }

  // ─── Drive endpoints ────────────────────────────────────────

  @Get('drive/folders/agents')
  async listAgentFolders() {
    return this.driveService.listAgentFolders();
  }

  @Get('google/drive-folders')
  async getGoogleDriveFolders() {
    return this.driveService.listRootTree();
  }

  @Post('drive/folders/agents/:agentId/setup')
  @HttpCode(HttpStatus.OK)
  async setupAgentFolders(
    @Param('agentId') agentId: string,
    @Body('agentName') agentName: string,
  ) {
    return this.driveService.setupAgentFolders(agentId, agentName);
  }

  @Get('drive/folders/:folderId/files')
  async listDriveFiles(@Param('folderId') folderId: string) {
    return this.driveService.listFiles(folderId);
  }

  @Post('drive/folders')
  @HttpCode(HttpStatus.OK)
  async createDriveFolder(@Body() body: { name: string; parentId?: string }) {
    return this.driveService.createFolder(body);
  }

  @Post('drive/files')
  @HttpCode(HttpStatus.OK)
  async createDriveFile(
    @Body() body: { name: string; content: string; mimeType?: string; parentId?: string },
  ) {
    return this.driveService.createFile(body);
  }
}
