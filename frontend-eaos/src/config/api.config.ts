export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
  socketURL: process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3000',
  timeoutMs: 30_000,
  retry: { maxRetries: 2, retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 10_000) },
  defaultHeaders: { 'Content-Type': 'application/json', Accept: 'application/json' },
} as const;
