'use client';

/**
 * CommandPalette — Phase 5, Task 5.8.
 *
 * Per `EAOS-NUWS-principles.md` §5.5:
 *   - Toggle: ⌘K / Ctrl+K
 *   - Two modes: `navigate` (default) and `ask-ai` (when prefixed with `?`).
 *   - `navigate` mode: jumps to entity pages, settings, etc.
 *   - `ask-ai` mode: lists AI Actions the current user can invoke against
 *     the current entity (or against the workspace if no entity context).
 *
 * Streaming output lives in a slide-down panel under the palette input.
 * Multiple actions can be queued (one at a time per invocation).
 *
 * SOLID:
 *   - SRP — palette owns only the search/launch surface.
 *   - DIP — depends on `useAvailableAiActions` + `useInvokeAndStream`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useAvailableAiActions,
  useInvokeAndStream,
} from '@/core/hooks/ai-actions';
import { CitationChip } from '@/components/panels/CitationChip';
import type {
  AiActionDefinition,
  AiActionCitation,
} from '@/core/hooks/ai-actions';

export interface CommandPaletteProps {
  /** Optional current entity scope for the Ask-AI picker. */
  scope?: { entityType: string; entityId: string };
}

type Mode = 'navigate' | 'ask-ai';

interface NavItem {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
}

export function CommandPalette({ scope }: CommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Keyboard toggle.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isToggle = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (isToggle) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (open && e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Autofocus input when opened.
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery('');
      setHighlight(0);
    }
  }, [open]);

  const mode: Mode = query.startsWith('?') ? 'ask-ai' : 'navigate';
  const strippedQuery = mode === 'ask-ai' ? query.slice(1).trim() : query.trim();

  // Static navigation registry. Grows as the app gains more routes.
  const navItems: NavItem[] = useMemo(
    () => [
      { id: 'home', label: 'Go to Dashboard', run: () => router.push('/') },
      ...(scope
        ? [
            {
              id: 'entity',
              label: `Open current entity (${scope.entityType}/${scope.entityId.slice(
                0,
                8,
              )}…)`,
              run: () =>
                router.push(`/entity/${scope.entityType}/${scope.entityId}`),
            },
          ]
        : []),
      { id: 'knowledge', label: 'Knowledge Hub', run: () => router.push('/knowledge') },
      { id: 'marketplace', label: 'Marketplace', run: () => router.push('/marketplace') },
      { id: 'mission-feed', label: 'Mission Feed', run: () => router.push('/mission-feed') },
      {
        id: 'admin',
        label: 'Administration',
        hint: 'Open administration modal',
        run: () => {
          window.dispatchEvent(new CustomEvent('eaos:open-admin'));
        },
      },
    ],
    [router, scope],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-canvas-300 bg-canvas-50 px-3 py-1.5 text-xs font-medium text-canvas-700 hover:bg-canvas-100 dark:border-canvas-700 dark:bg-canvas-800 dark:text-canvas-200 dark:hover:bg-canvas-700"
        aria-label="Open command palette"
      >
        ⌘K
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-24 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-lg border border-canvas-200 bg-canvas-50 shadow-2xl dark:border-canvas-700 dark:bg-canvas-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-canvas-200 px-4 py-3 dark:border-canvas-700">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-wider text-canvas-500">
                  {mode === 'ask-ai' ? 'Ask AI' : 'Navigate'}
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setHighlight(0);
                  }}
                  placeholder={
                    mode === 'ask-ai'
                      ? '? then action name (e.g. ?summary)'
                      : 'Type to navigate… (? for Ask AI)'
                  }
                  className="w-full bg-transparent text-sm text-canvas-900 outline-none placeholder:text-canvas-400 dark:text-canvas-50"
                  data-testid="command-palette-input"
                />
              </div>
            </div>

            <div ref={listRef} className="max-h-80 overflow-y-auto">
              {mode === 'navigate' ? (
                <NavigateList
                  items={navItems}
                  query={strippedQuery}
                  highlight={highlight}
                  setHighlight={setHighlight}
                  onSelect={(item) => {
                    item.run();
                    setOpen(false);
                  }}
                />
              ) : (
                <AskAiList
                  query={strippedQuery}
                  highlight={highlight}
                  setHighlight={setHighlight}
                  scope={scope}
                  onInvoked={() => setOpen(false)}
                />
              )}
            </div>

            <div className="border-t border-canvas-200 bg-canvas-100 px-4 py-2 text-xs text-canvas-500 dark:border-canvas-700 dark:bg-canvas-800">
              ↑↓ navigate · ↵ select · esc close
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Navigate list ─────────────────────────────────────────────────────

function NavigateList({
  items,
  query,
  highlight,
  setHighlight,
  onSelect,
}: {
  items: NavItem[];
  query: string;
  highlight: number;
  setHighlight: (n: number) => void;
  onSelect: (item: NavItem) => void;
}) {
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return q ? items.filter((i) => i.label.toLowerCase().includes(q)) : items;
  }, [items, query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlight(Math.min(filtered.length - 1, highlight + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlight(Math.max(0, highlight - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = filtered[highlight];
        if (item) onSelect(item);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [filtered, highlight, onSelect, setHighlight]);

  if (filtered.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-canvas-500">
        No matches. Try <span className="font-mono">?</span> to Ask AI.
      </div>
    );
  }

  return (
    <ul role="listbox" aria-label="Navigation items">
      {filtered.map((item, i) => (
        <li
          key={item.id}
          role="option"
          aria-selected={i === highlight}
          onMouseEnter={() => setHighlight(i)}
          onClick={() => onSelect(item)}
          className={`flex cursor-pointer items-center justify-between px-4 py-2 text-sm ${
            i === highlight
              ? 'bg-canvas-200 text-canvas-900 dark:bg-canvas-800 dark:text-canvas-50'
              : 'text-canvas-700 dark:text-canvas-200'
          }`}
        >
          <span>{item.label}</span>
          {item.hint && (
            <span className="ml-2 truncate text-xs text-canvas-500">{item.hint}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

// ─── Ask-AI list ───────────────────────────────────────────────────────

function AskAiList({
  query,
  highlight,
  setHighlight,
  scope,
  onInvoked,
}: {
  query: string;
  highlight: number;
  setHighlight: (n: number) => void;
  scope?: { entityType: string; entityId: string };
  onInvoked: () => void;
}) {
  const { data, isLoading } = useAvailableAiActions(scope?.entityType);
  const [activeInvocationId, setActiveInvocationId] = useState<string | null>(null);
  const [activeActionName, setActiveActionName] = useState<string>('');
  const [activeCitations, setActiveCitations] = useState<AiActionCitation[]>([]);

  const invoke = useInvokeAndStream({
    onComplete: () => {
      // The palette stays open showing the streaming result.
    },
  });

  const items = useMemo(() => {
    const all = data?.items ?? [];
    const q = query.toLowerCase();
    return q
      ? all.filter(
          (a) =>
            a.id.toLowerCase().includes(q) ||
            a.name.toLowerCase().includes(q) ||
            a.tags.some((t) => t.toLowerCase().includes(q)),
        )
      : all;
  }, [data, query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (activeInvocationId) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlight(Math.min(items.length - 1, highlight + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlight(Math.max(0, highlight - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const a = items[highlight];
        if (a) void launch(a);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [items, highlight, activeInvocationId]);

  const launch = useCallback(
    async (a: AiActionDefinition) => {
      setActiveActionName(a.name);
      setActiveCitations([]);
      try {
        const invocation = await invoke.run({
          action: a.id,
          ...(scope ?? {}),
          idempotencyKey: `cp:${a.id}:${Date.now()}`,
        });
        setActiveInvocationId(invocation.id);
      } catch {
        onInvoked();
      }
    },
    [invoke, scope, onInvoked],
  );

  // Track citations as they arrive so the chip strip updates live.
  useEffect(() => {
    if (invoke.citations.length > 0) {
      setActiveCitations(invoke.citations);
    }
  }, [invoke.citations]);

  return (
    <div>
      {isLoading ? (
        <div className="p-6 text-center text-sm text-canvas-500">
          Loading actions…
        </div>
      ) : items.length === 0 ? (
        <div className="p-6 text-center text-sm text-canvas-500">
          No matching AI Actions.
        </div>
      ) : (
        <ul role="listbox" aria-label="AI Actions">
          {items.map((a, i) => (
            <li
              key={a.id}
              role="option"
              aria-selected={i === highlight}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => void launch(a)}
              className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2 text-sm ${
                i === highlight
                  ? 'bg-canvas-200 text-canvas-900 dark:bg-canvas-800 dark:text-canvas-50'
                  : 'text-canvas-700 dark:text-canvas-200'
              }`}
            >
              <div>
                <div className="font-medium">{a.name}</div>
                <div className="text-xs text-canvas-500">{a.description}</div>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-canvas-500">
                {a.costModel.tierRequired}
              </span>
            </li>
          ))}
        </ul>
      )}

      {(invoke.status === 'streaming' ||
        invoke.status === 'completed' ||
        invoke.status === 'failed' ||
        invoke.status === 'cancelled') && (
        <div className="border-t border-canvas-200 bg-canvas-100 px-4 py-3 dark:border-canvas-700 dark:bg-canvas-800">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-canvas-500">
              {activeActionName} ·{' '}
              {invoke.status === 'streaming'
                ? 'streaming…'
                : invoke.status === 'completed'
                  ? 'done'
                  : invoke.status === 'cancelled'
                    ? 'cancelled'
                    : 'failed'}
            </span>
            <div className="flex gap-2 text-xs">
              {invoke.status === 'streaming' && (
                <button
                  type="button"
                  onClick={invoke.stop}
                  className="text-state-error hover:underline"
                >
                  Stop
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  invoke.reset();
                  setActiveInvocationId(null);
                  setActiveActionName('');
                  setActiveCitations([]);
                }}
                className="text-canvas-500 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>
          <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap text-xs text-canvas-700 dark:text-canvas-200">
            {typeof invoke.result?.output === 'string'
              ? invoke.result.output
              : invoke.text || invoke.error || '…'}
          </pre>
          {activeCitations.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {activeCitations.map((c, i) => (
                <CitationChip
                  key={`${c.knowledgeEntryId}-${i}`}
                  citation={c}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
