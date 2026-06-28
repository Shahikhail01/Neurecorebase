import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiCommon } from '../../../common/decorators/api-common.decorator';
import { ConnectorService } from '../services/connector.service';
import {
  RegisterConnectorDto,
  ConnectConnectorDto,
  SyncConnectorDto,
} from '../dto/connector.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/interfaces/token.interface';
import { OAuthService } from '../services/oauth.service';
import { TenantContextService } from '../../../common/context/tenant-context.service';

/**
 * ConnectorsController — Phase 4.2
 * SRP: HTTP routing only — all business logic in ConnectorService.
 */
@Controller({ path: 'connectors', version: '1' })
@ApiCommon('connectors')
export class ConnectorsController {
  constructor(
    private readonly connectorService: ConnectorService,
    private readonly oauthService: OAuthService,
    private readonly tenantContext: TenantContextService,
  ) {}

  /** GET /v1/connectors/providers */
  @Get('providers')
  listProviders() {
    return { providers: this.connectorService.listAvailableProviders() };
  }

  /**
   * GET /v1/connectors/oauth/hubspot/authorize
   * Returns an authorization URL for HubSpot OAuth.
   */
  @Get('oauth/hubspot/authorize')
  oauthHubSpotAuthorize(
    @CurrentUser() user: JwtPayload,
    @Query('redirectUri') redirectUri?: string,
    @Query('scopes') scopes?: string,
  ) {
    const redirect =
      redirectUri ??
      process.env.HUBSPOT_REDIRECT_URI ??
      'http://localhost:3001/connectors/hubspot/callback';
    const scopeList = scopes
      ? scopes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : ['crm.objects.contacts.read', 'crm.objects.deals.read'];
    return this.oauthService.authorizeHubSpot({
      redirectUri: redirect,
      scopes: scopeList,
    });
  }

  /**
   * GET /v1/connectors/oauth/hubspot/callback
   * Exchanges code for tokens and persists them encrypted.
   */
  @Get('oauth/hubspot/callback')
  async oauthHubSpotCallback(
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('redirectUri') redirectUri?: string,
  ) {
    if (!code || !state) throw new BadRequestException('Missing code/state');
    const redirect =
      redirectUri ??
      process.env.HUBSPOT_REDIRECT_URI ??
      'http://localhost:3001/connectors/hubspot/callback';
    return this.oauthService.callbackHubSpot({
      code,
      state,
      redirectUri: redirect,
    });
  }

  /** GET /v1/connectors */
  @Get()
  listConnectors(@CurrentUser() user: JwtPayload) {
    return this.connectorService.listConnectors();
  }

  /** POST /v1/connectors */
  @Post()
  registerConnector(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RegisterConnectorDto,
  ) {
    return this.connectorService.createConnector(
      dto.name,
      dto.provider,
      dto.config ?? {},
    );
  }

  /** DELETE /v1/connectors/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteConnector(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.connectorService.deleteConnector(id);
  }

  /** POST /v1/connectors/:id/connect */
  @Post(':id/connect')
  @HttpCode(HttpStatus.OK)
  async connect(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConnectConnectorDto,
  ) {
    await this.connectorService.connect(id, dto.config);
    return { ok: true };
  }

  /** POST /v1/connectors/:id/disconnect */
  @Post(':id/disconnect')
  @HttpCode(HttpStatus.OK)
  async disconnect(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.connectorService.disconnect(id);
    return { ok: true };
  }

  /** POST /v1/connectors/:id/sync */
  @Post(':id/sync')
  @HttpCode(HttpStatus.OK)
  async sync(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SyncConnectorDto,
  ) {
    const results: Record<string, string> = {};
    if (dto.contacts !== false) {
      await this.connectorService.syncContacts(id);
      results.contacts = 'synced';
    }
    if (dto.leads !== false) {
      await this.connectorService.syncLeads(id);
      results.leads = 'synced';
    }
    return results;
  }
}
