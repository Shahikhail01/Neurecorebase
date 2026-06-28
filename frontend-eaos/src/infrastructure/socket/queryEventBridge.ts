import type { QueryClient } from '@tanstack/react-query';
import { socketManager, type ServerEvent } from './SocketManager';
import { queryKeys } from '@neurecore/ui/query';

export function installQueryEventBridge(qc: QueryClient): () => void {
  const unsubscribers: Array<() => void> = [];

  const subscriber = <T = unknown>(event: ServerEvent, handler: (payload: T) => void) => {
    unsubscribers.push(socketManager.on(event, handler as (payload: unknown) => void));
  };

  subscriber('agent:status_updated', (e) => {
    const payload = e as { tenantId: string; agentId: string; status: string; subState?: string };
    qc.invalidateQueries({ queryKey: ['agents', payload.tenantId] });
    qc.setQueryData(
      ['agents', payload.agentId],
      (prev: { status?: string; subState?: string } | undefined) =>
        prev
          ? { ...prev, status: payload.status, subState: payload.subState }
          : prev,
    );
  });

  subscriber('task:started', (e) => {
    const payload = e as { tenantId: string; taskId: string };
    qc.invalidateQueries({ queryKey: ['tasks', payload.tenantId] });
    qc.setQueryData(
      ['tasks', payload.taskId],
      (prev: { status?: string } | undefined) =>
        prev ? { ...prev, status: 'in_progress' } : prev,
    );
  });

  subscriber('task:completed', (e) => {
    const payload = e as { tenantId: string; taskId: string };
    qc.invalidateQueries({ queryKey: ['tasks', payload.tenantId] });
    qc.setQueryData(
      ['tasks', payload.taskId],
      (prev: { status?: string } | undefined) =>
        prev ? { ...prev, status: 'completed' } : prev,
    );
  });

  subscriber('task:failed', (e) => {
    const payload = e as { tenantId: string; taskId: string };
    qc.invalidateQueries({ queryKey: ['tasks', payload.tenantId] });
    qc.setQueryData(
      ['tasks', payload.taskId],
      (prev: { status?: string } | undefined) =>
        prev ? { ...prev, status: 'failed' } : prev,
    );
  });

  subscriber('intelligence:refreshed', (e) => {
    const payload = e as { entityType: string; entityId: string };
    qc.invalidateQueries({
      queryKey: queryKeys.entity.intelligence(payload.entityType, payload.entityId),
    });
  });

  subscriber('mission_feed:updated', (e) => {
    const payload = e as { tenantId: string };
    qc.invalidateQueries({ queryKey: queryKeys.missionFeed.all(payload.tenantId) });
  });

  subscriber('lifecycle:transitioned', (e) => {
    const payload = e as { entityType: string; entityId: string };
    qc.invalidateQueries({
      queryKey: queryKeys.entity.lifecycle(payload.entityType, payload.entityId),
    });
    qc.invalidateQueries({
      queryKey: queryKeys.entity.intelligence(payload.entityType, payload.entityId),
    });
    qc.invalidateQueries({
      queryKey: queryKeys.entity.activity(payload.entityType, payload.entityId),
    });
  });

  subscriber('notification:new', () => {
    qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
  });

  subscriber('workflow:status_changed', (e) => {
    const payload = e as { tenantId: string; workflowId: string; status: string };
    qc.invalidateQueries({ queryKey: ['workflows', payload.tenantId] });
    qc.setQueryData(
      ['workflows', payload.workflowId],
      (prev: { status?: string } | undefined) =>
        prev ? { ...prev, status: payload.status } : prev,
    );
  });

  subscriber('memory:updated', (e) => {
    const payload = e as { tenantId: string };
    qc.invalidateQueries({ queryKey: ['memory', payload.tenantId] });
  });

  subscriber('system:alert', () => {
    // System alerts are shown via toast; no query invalidation needed
  });

  subscriber('governance:triggered', (e) => {
    const payload = e as { tenantId: string };
    qc.invalidateQueries({ queryKey: ['governance', payload.tenantId] });
  });

  subscriber('approval:requested', (e) => {
    const payload = e as { tenantId: string };
    qc.invalidateQueries({ queryKey: ['inbox', payload.tenantId] });
    qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
  });

  subscriber('audit:logged', (e) => {
    const payload = e as { tenantId: string };
    qc.invalidateQueries({ queryKey: queryKeys.audit.all(payload.tenantId) });
  });

  socketManager.connect();

  return () => {
    unsubscribers.forEach((unsub) => unsub());
    socketManager.disconnect();
  };
}
