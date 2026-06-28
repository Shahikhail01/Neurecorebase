import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '@/config/api.config';

export const SOCKET_EVENTS = [
  'agent:status_updated',
  'agent:error',
  'task:started',
  'task:completed',
  'task:failed',
  'memory:updated',
  'system:alert',
  'workflow:status_changed',
  'governance:triggered',
  'notification:new',
  'approval:requested',
  'intelligence:refreshed',
  'mission_feed:updated',
  'lifecycle:transitioned',
  'audit:logged',
] as const;

export type ServerEvent = (typeof SOCKET_EVENTS)[number];

type EventHandler<T = unknown> = (payload: T) => void;

export class EventBus {
  private listeners = new Map<ServerEvent, Set<EventHandler>>();

  on<T = unknown>(event: ServerEvent, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as EventHandler);
    return () => {
      this.listeners.get(event)?.delete(handler as EventHandler);
    };
  }

  emit<T = unknown>(event: ServerEvent, payload: T): void {
    this.listeners.get(event)?.forEach((handler) => {
      try {
        handler(payload);
      } catch (e) {
        console.error(`Event handler error for ${event}:`, e);
      }
    });
  }

  off<T = unknown>(event: ServerEvent, handler: EventHandler<T>): void {
    this.listeners.get(event)?.delete(handler as EventHandler);
  }
}

export interface ISocketManager {
  connect(): void;
  disconnect(): void;
  isConnected(): boolean;
  getEventBus(): EventBus;
  on<T = unknown>(event: ServerEvent, handler: EventHandler<T>): () => void;
}

export class SocketManager implements ISocketManager {
  private socket: Socket | null = null;
  private eventBus = new EventBus();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private manualDisconnect = false;

  connect(): void {
    if (this.socket?.connected) return;
    this.manualDisconnect = false;

    this.socket = io(API_CONFIG.socketURL, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 30_000,
    });

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      if (!this.manualDisconnect && reason === 'io server disconnect') {
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', () => {
      this.reconnectAttempts++;
    });

    this.socket.on('reconnect_attempt', () => {
      this.reconnectAttempts++;
    });

    for (const event of SOCKET_EVENTS) {
      this.socket.on(event, (payload: unknown) => {
        this.eventBus.emit(event, payload);
      });
    }
  }

  disconnect(): void {
    this.manualDisconnect = true;
    this.socket?.disconnect();
    this.socket = null;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getEventBus(): EventBus {
    return this.eventBus;
  }

  on<T = unknown>(event: ServerEvent, handler: EventHandler<T>): () => void {
    return this.eventBus.on(event, handler as EventHandler<T>);
  }
}

export const socketManager = new SocketManager();
