import api from './api';
import { unwrapItem } from './unwrap';

export interface IntegrationStatus {
  connected: boolean;
  email?: string;
  scopes?: string[];
  expiresAt?: string;
}

export interface Integration {
  provider: string;
  label: string;
  description: string;
  connected: boolean;
  email?: string;
  scopes?: string[];
  expiresAt?: string;
}

export interface IntegrationsList {
  google: Integration;
  brevo: Integration;
}

class IntegrationsService {
  async listIntegrations(): Promise<IntegrationsList> {
    const res = await api.get('/integrations');
    return unwrapItem(res) as IntegrationsList;
  }

  async getGoogleStatus(): Promise<IntegrationStatus> {
    const res = await api.get('/integrations/google/status');
    return unwrapItem(res) as IntegrationStatus;
  }

  async getBrevoStatus(): Promise<{ connected: boolean }> {
    const res = await api.get('/integrations/brevo/status');
    return unwrapItem(res) as { connected: boolean };
  }

  async initiateGoogleOAuth(redirectUri?: string): Promise<{ url: string }> {
    const res = await api.post('/integrations/google/authorize', { redirectUri });
    return unwrapItem(res) as { url: string };
  }

  async disconnectGoogle(): Promise<void> {
    await api.post('/integrations/google/disconnect');
  }

  async connectBrevo(apiKey: string): Promise<{ connected: boolean }> {
    const res = await api.post('/integrations/brevo/connect', { apiKey });
    return unwrapItem(res) as { connected: boolean };
  }

  async disconnectBrevo(): Promise<void> {
    await api.post('/integrations/brevo/disconnect');
  }
}

export const integrationsService = new IntegrationsService();
