import type { QueryClient } from '@tanstack/react-query';
import type { AppError } from '@/infrastructure/api/RestClient';

let isSetup = false;

export function setupGlobalErrorHandler(qc: QueryClient): void {
  if (isSetup) return;
  isSetup = true;

  if (typeof window === 'undefined') return;

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[App] Unhandled rejection:', event.reason);
  });

  window.addEventListener('error', (event) => {
    console.error('[App] Global error:', event.error);
  });
}

export function handleAppError(error: unknown): void {
  if (error instanceof Error) {
    const appError = error as AppError;
    if ('code' in appError) {
      switch (appError.code) {
        case 'AUTHENTICATION_FAILED':
          window.location.href = '/login';
          break;
        case 'RATE_LIMIT_EXCEEDED':
          console.warn('[App] Rate limit exceeded');
          break;
        case 'CROSS_TENANT_ACCESS':
          console.error('[App] Cross-tenant access denied');
          break;
        default:
          console.error(`[App] Error: ${appError.message}`, {
            code: appError.code,
            status: appError.status,
            details: appError.details,
          });
      }
    }
  }
}
