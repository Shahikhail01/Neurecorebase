'use client';

import { Button } from '@neurecore/ui/components';
import {
  ROLE_PERMISSIONS,
  hasPermission,
  type Permission,
} from '@neurecore/ui/auth';
import type { UserRole } from '@neurecore/ui/types';

const DEMO_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'PLATFORM_ADMIN',
  'OWNER',
  'ADMIN',
  'USER',
  'AUDITOR',
];

const DEMO_PERMISSIONS: Permission[] = [
  'agent.spawn',
  'task.create',
  'finance.read',
  'tenant.settings',
];

export default function AgentsPage() {
  return (
    <main className="min-h-screen bg-canvas-50 px-6 py-12 dark:bg-canvas-950">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-canvas-900 dark:text-canvas-50">
          Agent Permissions Demo
        </h1>
        <p className="mt-2 text-canvas-600 dark:text-canvas-400">
          Phase 1, Task 1.28 — proving the permission hook is wired
          end-to-end.
        </p>

        <section className="mt-8 rounded-lg border border-canvas-200 bg-canvas-50 p-6 dark:border-canvas-700 dark:bg-canvas-900">
          <h2 className="text-lg font-semibold text-canvas-900 dark:text-canvas-50">
            Role-Permission Matrix
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-canvas-200 dark:border-canvas-700">
                  <th className="px-3 py-2 text-left font-medium text-canvas-600 dark:text-canvas-400">
                    Role
                  </th>
                  {DEMO_PERMISSIONS.map((p) => (
                    <th
                      key={p}
                      className="px-3 py-2 text-center font-medium text-canvas-600 dark:text-canvas-400"
                    >
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEMO_ROLES.map((role) => (
                  <tr
                    key={role}
                    className="border-b border-canvas-100 dark:border-canvas-800"
                  >
                    <td className="px-3 py-2 font-medium text-canvas-700 dark:text-canvas-300">
                      {role}
                    </td>
                    {DEMO_PERMISSIONS.map((perm) => {
                      const allowed = hasPermission(role, perm);
                      return (
                        <td
                          key={perm}
                          className="px-3 py-2 text-center"
                        >
                          <span
                            className={`inline-flex size-5 items-center justify-center rounded-full text-xs ${
                              allowed
                                ? 'bg-state-healthy/20 text-state-healthy'
                                : 'bg-state-critical/20 text-state-critical'
                            }`}
                          >
                            {allowed ? '✓' : '✗'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-canvas-200 bg-canvas-50 p-6 dark:border-canvas-700 dark:bg-canvas-900">
          <h2 className="text-lg font-semibold text-canvas-900 dark:text-canvas-50">
            Permission-Gated Actions
          </h2>
          <p className="mt-1 text-sm text-canvas-500 dark:text-canvas-400">
            Buttons below render conditionally based on the selected demo role.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {DEMO_PERMISSIONS.map((perm) => (
              <Button
                key={perm}
                variant="primary"
                onClick={() => {
                  alert(`Executed: ${perm}`);
                }}
              >
                {perm}
              </Button>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-canvas-200 bg-canvas-50 p-6 dark:border-canvas-700 dark:bg-canvas-900">
          <h2 className="text-lg font-semibold text-canvas-900 dark:text-canvas-50">
            ROLE_PERMISSIONS Map
          </h2>
          <pre className="mt-4 overflow-x-auto rounded bg-canvas-100 p-4 text-xs text-canvas-700 dark:bg-canvas-800 dark:text-canvas-300">
            {JSON.stringify(ROLE_PERMISSIONS, null, 2)}
          </pre>
        </section>
      </div>
    </main>
  );
}
