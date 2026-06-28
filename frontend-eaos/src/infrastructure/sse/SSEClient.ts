import { API_CONFIG } from '@/config/api.config';

export interface SSEEvent<T = unknown> {
  type: string;
  data: T;
  id?: string;
  retry?: number;
}

export class SSEClient {
  open<T = unknown>(
    path: string,
    onEvent: (event: SSEEvent<T>) => void,
    options?: { signal?: AbortSignal; token?: string },
  ): () => void {
    let url = `${API_CONFIG.baseURL}${path}`;
    if (options?.token) {
      url += `${path.includes('?') ? '&' : '?'}token=${encodeURIComponent(options.token)}`;
    }

    const eventSource = new EventSource(url, { withCredentials: true });

    const messageHandler = (event: MessageEvent) => {
      if (event.data === '[DONE]') {
        eventSource.close();
        return;
      }
      try {
        const parsed = JSON.parse(event.data) as T;
        onEvent({
          type: event.type || 'message',
          data: parsed,
          id: event.lastEventId || undefined,
        });
      } catch {
        // ignore parse errors
      }
    };

    eventSource.addEventListener('message', messageHandler);

    const handleError = () => {
      // Native EventSource handles reconnection automatically
      // with the retry value from server
    };

    eventSource.addEventListener('error', handleError);

    if (options?.signal) {
      options.signal.addEventListener('abort', () => {
        eventSource.removeEventListener('message', messageHandler);
        eventSource.removeEventListener('error', handleError);
        eventSource.close();
      });
    }

    return () => {
      eventSource.removeEventListener('message', messageHandler);
      eventSource.removeEventListener('error', handleError);
      eventSource.close();
    };
  }

  openRaw(
    path: string,
    onMessage: (data: string) => void,
    options?: { signal?: AbortSignal },
  ): () => void {
    const url = `${API_CONFIG.baseURL}${path}`;
    const eventSource = new EventSource(url, { withCredentials: true });

    const messageHandler = (event: MessageEvent) => {
      if (event.data === '[DONE]') {
        eventSource.close();
        return;
      }
      onMessage(event.data);
    };

    eventSource.addEventListener('message', messageHandler);

    if (options?.signal) {
      options.signal.addEventListener('abort', () => {
        eventSource.removeEventListener('message', messageHandler);
        eventSource.close();
      });
    }

    return () => {
      eventSource.removeEventListener('message', messageHandler);
      eventSource.close();
    };
  }
}

export const sseClient = new SSEClient();
