import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { PrismaIntegrationCredentialStore } from './services/integration-credential.store';
import { BrevoEmailService } from './brevo/brevo-email.service';
import { CryptoService } from '../connectors/services/crypto.service';
import { GoogleAuthClient } from './google/google-auth.client';
import { GoogleGmailService } from './google/google-gmail.service';
import { GoogleCalendarService } from './google/google-calendar.service';
import { GoogleDriveService } from './google/google-drive.service';

@Module({
  controllers: [IntegrationsController],
  providers: [
    IntegrationsService,
    PrismaIntegrationCredentialStore,
    BrevoEmailService,
    CryptoService,
    GoogleAuthClient,
    GoogleGmailService,
    GoogleCalendarService,
    GoogleDriveService,
  ],
  exports: [IntegrationsService, BrevoEmailService, GoogleAuthClient, GoogleGmailService, GoogleCalendarService, GoogleDriveService],
})
export class IntegrationsModule {}