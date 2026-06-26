import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { PrismaIntegrationCredentialStore } from './services/integration-credential.store';
import { BrevoEmailService } from './brevo/brevo-email.service';
import { CryptoService } from '../../connectors/services/crypto.service';

@Module({
  controllers: [IntegrationsController],
  providers: [IntegrationsService, PrismaIntegrationCredentialStore, BrevoEmailService, CryptoService],
  exports: [IntegrationsService, BrevoEmailService],
})
export class IntegrationsModule {}
