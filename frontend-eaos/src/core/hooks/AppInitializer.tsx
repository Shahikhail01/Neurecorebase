'use client';

import { useEffect, type ReactNode } from 'react';
import { socketManager } from '@/infrastructure/socket/SocketManager';
import { cookieManager } from '@/infrastructure/auth/CookieManager';
import { setupGlobalErrorHandler } from './errorHandler';
import type { QueryClient } from '@tanstack/react-query';

interface AppInitializerProps {
  children: ReactNode;
  queryClient: QueryClient;
  onAuthRequired?: () => void;
}

export function AppInitializer({
  children,
  queryClient,
  onAuthRequired,
}: AppInitializerProps) {
  useEffect(() => {
    setupGlobalErrorHandler(queryClient);
  }, [queryClient]);

  useEffect(() => {
    if (!cookieManager.hasAuthCookies()) {
      onAuthRequired?.();
      return;
    }

    socketManager.connect();

    return () => {
      socketManager.disconnect();
    };
  }, [onAuthRequired]);

  return <>{children}</>;
}
