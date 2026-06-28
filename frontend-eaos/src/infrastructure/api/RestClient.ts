import { API_CONFIG } from '@/config/api.config';
import { cookieManager } from '@/infrastructure/auth/CookieManager';

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  timeoutMs?: number;
  credentials?: RequestCredentials;
  /** Skip CSRF header injection (e.g., for pre-auth endpoints like /auth/login). */
  skipCsrf?: boolean;
}

export interface AppError extends Error {
  code: string;
  status?: number;
  details?: Record<string, unknown>;
}

function isAppError(err: unknown): err is AppError {
  return err instanceof Error && 'code' in err && 'status' in err;
}

function createAppError(
  code: string,
  message: string,
  status?: number,
  details?: Record<string, unknown>,
): AppError {
  const error = new Error(message) as AppError;
  error.code = code;
  error.status = status;
  error.details = details;
  return error;
}

let refreshPromise: Promise<void> | null = null;

async function refreshToken(): Promise<void> {
  if (refreshPromise) return refreshPromise;

  // Phase 9: refresh is a pre-auth endpoint (CSRF-exempt on backend).
  // We do NOT send X-CSRF-Token here — backend /auth/refresh is in the
  // exempt list (it relies on the httpOnly refresh cookie as proof of
  // possession, which is the entire point of double-submit cookies).
  refreshPromise = fetch(`${API_CONFIG.baseURL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  }).then(async (res) => {
    if (!res.ok) {
      refreshPromise = null;
      throw new Error('Refresh failed');
    }
    refreshPromise = null;
  });

  return refreshPromise;
}

export class RestClient {
  private baseURL: string;
  private timeoutMs: number;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.timeoutMs = API_CONFIG.timeoutMs;
    this.defaultHeaders = { ...API_CONFIG.defaultHeaders };
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    path: string,
    body?: unknown,
    config: RequestConfig = {},
  ): Promise<T> {
    const {
      headers = {},
      params,
      signal,
      timeoutMs = this.timeoutMs,
      credentials = 'include',
    } = config;

    let url = `${this.baseURL}${path}`;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const requestHeaders: Record<string, string> = {
      ...this.defaultHeaders,
      ...headers,
    };

    // Phase 9: CSRF double-submit cookie — on mutating requests, echo the
    // csrf cookie value as the X-CSRF-Token header. Pre-auth endpoints
    // (login, register, refresh-from-body) can pass `skipCsrf: true`.
    const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
    if (
      !config.skipCsrf &&
      !SAFE_METHODS.has(method) &&
      typeof document !== 'undefined'
    ) {
      const csrf = cookieManager.getCsrfToken();
      if (csrf) {
        requestHeaders['X-CSRF-Token'] = csrf;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: requestHeaders,
        credentials,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.status === 401) {
      try {
        await refreshToken();
        response = await fetch(url, {
          method,
          headers: requestHeaders,
          credentials,
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
      } catch {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw createAppError('AUTHENTICATION_FAILED', 'Session expired', 401);
      }
    }

    if (!response.ok) {
      let errorBody: Record<string, unknown> = {};
      try {
        errorBody = await response.json();
      } catch {
        // ignore parse errors
      }

      const code =
        (errorBody.code as string) ||
        (response.status === 403
          ? 'PERMISSION_DENIED'
          : response.status === 404
            ? 'NOT_FOUND'
            : response.status === 422
              ? 'VALIDATION_ERROR'
              : response.status === 429
                ? 'RATE_LIMIT_EXCEEDED'
                : 'SERVER_ERROR');

      throw createAppError(
        code,
        (errorBody.message as string) || `HTTP ${response.status}`,
        response.status,
        errorBody.details as Record<string, unknown>,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const data = await response.json();

    if (
      data &&
      typeof data === 'object' &&
      'status' in data &&
      (data as { status: string }).status === 'success' &&
      'data' in data
    ) {
      return data.data as T;
    }

    return data as T;
  }

  async get<T>(path: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('GET', path, undefined, config);
  }

  async post<T>(path: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('POST', path, body, config);
  }

  async patch<T>(path: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('PATCH', path, body, config);
  }

  async put<T>(path: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('PUT', path, body, config);
  }

  async delete<T>(path: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', path, undefined, config);
  }

  async stream<T>(
    path: string,
    body: unknown,
    onChunk: (chunk: T) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const url = `${this.baseURL}${path}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      credentials: 'include',
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      let errorBody: Record<string, unknown> = {};
      try {
        errorBody = await response.json();
      } catch {
        // ignore
      }
      throw createAppError(
        (errorBody.code as string) || 'SERVER_ERROR',
        (errorBody.message as string) || `HTTP ${response.status}`,
        response.status,
      );
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            try {
              const parsed = JSON.parse(data) as T;
              onChunk(parsed);
            } catch {
              // ignore parse errors in stream
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  openSSE<T>(
    path: string,
    onEvent: (event: { type: string; data: T; id?: string }) => void,
    signal?: AbortSignal,
  ): () => void {
    const url = `${this.baseURL}${path}`;
    const eventSource = new EventSource(url, { withCredentials: true });

    const messageHandler = (event: MessageEvent) => {
      const type = event.type;
      let data: T;
      try {
        data = JSON.parse(event.data) as T;
      } catch {
        return;
      }
      onEvent({ type, data, id: event.lastEventId || undefined });
    };

    eventSource.addEventListener('message', messageHandler);
    eventSource.addEventListener('error', () => {
      // SSE error events are handled by onerror
    });

    if (signal) {
      signal.addEventListener('abort', () => {
        eventSource.close();
      });
    }

    return () => {
      eventSource.removeEventListener('message', messageHandler);
      eventSource.close();
    };
  }
}

export const restClient = new RestClient();
