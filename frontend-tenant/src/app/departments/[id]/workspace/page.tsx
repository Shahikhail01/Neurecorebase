'use client';

/**
 * /departments/[id]/workspace — Department Workspace (Phase 5)
 *
 * The single page where all of a department's work lives.
 *
 * Layout:
 *   ┌─ Workspace Header ─────────────────────────────────────────┐
 *   │  [Icon] Dept Name    [status]                              │
 *   │  Description · Head agent · Budget bar                     │
 *   │  [Add agent] [Edit dept]                                   │
 *   └────────────────────────────────────────────────────────────┘
 *   ┌─ Tabs ──────────────────────────────────────────────────────┐
 *   │ Overview │ Agents │ Tasks │ Workflows │ Routines │         │
 *   │ Projects │ Goals │ Costs │ Members                        │
 *   └────────────────────────────────────────────────────────────┘
 *   ┌─ Tab Content ───────────────────────────────────────────────┐
 *   │  (active tab content)                                       │
 *   └────────────────────────────────────────────────────────────┘
 *
 * Per-dept data scoping uses backend gap fixes from Phase 1:
 *   - ?departmentId= on agents/tasks/workflows/goals/projects
 *   - ?ownerAgentIds= (comma-separated) on routines (added in Phase 1)
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Building2,
  Users,
  ListTodo,
  GitBranch,
  Repeat,
  Briefcase,
  Target,
  Wallet,
  UserCog,
  Plus,
  ArrowLeft,
  RefreshCw,
  Activity,
  Edit3,
  ChevronRight,
} from 'lucide-react';

import { useTenantAuth } from '@/hooks/useTenantAuth';
import TenantShell from '@/components/TenantShell';
import { KpiCard } from '@/components/creatio/KpiCard';
import { StatusBadge } from '@/components/creatio/StatusBadge';
import { ActionButton, ActionToolbar } from '@/components/creatio/ActionToolbar';
import { QuickAction } from '@/components/creatio/QuickAction';
import { AgentCard } from '@/components/agent-card/AgentCard';
import { AreaChart } from '@/components/charts/AreaChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { useAgentStore } from '@/stores/agentStore';
import { useTaskStore } from '@/stores/taskStore';
import { useWorkflowStore } from '@/stores/workflowStore';
import { useDepartmentStore } from '@/stores/departmentStore';
import { useInspectorStore } from '@/stores/inspectorStore';
import api from '@/services/api';
import { unwrapArrayOrEmpty, unwrapList, unwrapItem } from '@/services/unwrap';

// ─── Types ────────────────────────────────────────────────────────────────
type WorkspaceTabId =
  | 'overview'
  | 'agents'
  | 'tasks'
  | 'workflows'
  | 'routines'
  | 'projects'
  | 'goals'
  | 'costs'
  | 'members';

interface TabDef {
  id: WorkspaceTabId;
  label: string;
  icon: typeof Users;
}

const TABS: TabDef[] = [
  { id: 'overview',   label: 'Overview',   icon: Activity },
  { id: 'agents',     label: 'Agents',     icon: Users },
  { id: 'tasks',      label: 'Tasks',      icon: ListTodo },
  { id: 'workflows',  label: 'Workflows',  icon: GitBranch },
  { id: 'routines',   label: 'Routines',   icon: Repeat },
  { id: 'projects',   label: 'Projects',   icon: Briefcase },
  { id: 'goals',      label: 'Goals',      icon: Target },
  { id: 'costs',      label: 'Costs',      icon: Wallet },
  { id: 'members',    label: 'Members',    icon: UserCog },
];

interface Member {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  isActive?: boolean;
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function DepartmentWorkspacePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = useTenantAuth();
  const openInspector = useInspectorStore((s) => s.openInspector);

  const deptId = decodeURIComponent(params.id);

  const { departments, fetchDepartments, fetchDepartment } = useDepartmentStore();
  const { agents, fetchAgents } = useAgentStore();
  const { tasks, fetchTasks } = useTaskStore();
  const { workflows, fetchWorkflows } = useWorkflowStore();

  const [activeTab, setActiveTab] = useState<WorkspaceTabId>('overview');
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [monthCostCents, setMonthCostCents] = useState(0);
  const [costLoading, setCostLoading] = useState(true);

  const dept = departments.find((d) => d.id === deptId);

  // ── Data fetchers ────────────────────────────────────────────────────
  useEffect(() => {
    void fetchDepartment(deptId);
    void fetchDepartments();
  }, [deptId, fetchDepartment, fetchDepartments]);

  useEffect(() => {
    void fetchAgents(1, 200);
    void fetchTasks(1, 200);
    void fetchWorkflows(1, 200);
  }, [fetchAgents, fetchTasks, fetchWorkflows]);

  // Per-dept filtered data
  const deptAgents = useMemo(
    () => agents.filter((a) => (a as { departmentId?: string }).departmentId === deptId),
    [agents, deptId],
  );
  const deptTasks = useMemo(
    () => tasks.filter((t) => (t as { departmentId?: string }).departmentId === deptId),
    [tasks, deptId],
  );
  const deptWorkflows = useMemo(
    () => workflows.filter((w) => (w as { departmentId?: string }).departmentId === deptId),
    [workflows, deptId],
  );

  const fetchMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const res = await api.get(`/users?departmentId=${deptId}&limit=50`);
      const list = unwrapArrayOrEmpty(res);
      setMembers(list);
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, [deptId]);

  const fetchCosts = useCallback(async () => {
    setCostLoading(true);
    try {
      const res = await api.get(`/costs/summary?departmentId=${deptId}`);
      const data = unwrapItem(res);
      setMonthCostCents((data?.totalCostCents ?? 0) as number);
    } catch {
      setMonthCostCents(0);
    } finally {
      setCostLoading(false);
    }
  }, [deptId]);

  useEffect(() => {
    if (activeTab === 'members') void fetchMembers();
    if (activeTab === 'overview' || activeTab === 'costs') void fetchCosts();
  }, [activeTab, fetchMembers, fetchCosts]);

  if (!user) return null;

  if (!dept) {
    return (
      <TenantShell user={user}>
        <div className="max-w-7xl mx-auto">
          <div className="card-surface p-12 text-center">
            <Building2 className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-300 font-medium">Department not found</p>
            <p className="text-xs text-zinc-500 mt-1 mb-4">
              The department ID {deptId} does not exist or you don't have access.
            </p>
            <Link
              href="/departments"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-xs font-medium transition"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Departments
            </Link>
          </div>
        </div>
      </TenantShell>
    );
  }

  // ── Derived ──────────────────────────────────────────────────────────
  const runningAgents = deptAgents.filter((a) => a.status === 'ACTIVE' || a.status === 'RUNNING').length;
  const completedTasks = deptTasks.filter((t) => t.status === 'COMPLETED').length;
  const failedTasks = deptTasks.filter((t) => t.status === 'FAILED').length;
  const activeWorkflows = deptWorkflows.filter((w) => w.isActive).length;

  const taskStatusDonut = [
    { name: 'Completed', value: completedTasks, color: '#22c55e' },
    { name: 'Running',   value: deptTasks.filter((t) => t.status === 'RUNNING' || t.status === 'IN_PROGRESS').length, color: '#3b82f6' },
    { name: 'Pending',   value: deptTasks.filter((t) => t.status === 'PENDING').length, color: '#a855f7' },
    { name: 'Failed',    value: failedTasks, color: '#ef4444' },
  ].filter((s) => s.value > 0);

  return (
    <TenantShell user={user}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Breadcrumb ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Link href="/departments" className="hover:text-zinc-300 transition">
            Departments
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-zinc-300">{dept.name}</span>
          <ChevronRight className="w-3 h-3" />
          <span>Workspace</span>
        </div>

        {/* ── Workspace Header ───────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="card-surface p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <div className="w-14 h-14 rounded-xl bg-accent-500/15 text-accent-500 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-zinc-100 truncate">{dept.name}</h1>
                  <StatusBadge status="ACTIVE" label="Active" />
                  {dept.harmonyScore !== undefined && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-state-success/15 text-state-success border border-state-success/30 font-medium">
                      Harmony {dept.harmonyScore}%
                    </span>
                  )}
                </div>
                {dept.description && (
                  <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{dept.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {deptAgents.length} agents
                  </span>
                  <span className="flex items-center gap-1">
                    <ListTodo className="w-3 h-3" />
                    {deptTasks.length} tasks
                  </span>
                  <span className="flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />
                    {deptWorkflows.length} workflows
                  </span>
                </div>
              </div>
            </div>

            <ActionToolbar
              right={
                <>
                  <ActionButton
                    variant="secondary"
                    size="md"
                    icon={<Edit3 className="w-3.5 h-3.5" />}
                  >
                    Edit
                  </ActionButton>
                  <ActionButton
                    variant="primary"
                    size="md"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => router.push('/marketplace?tab=spawn')}
                  >
                    Add Agent
                  </ActionButton>
                </>
              }
            />
          </div>

          {/* Budget bar */}
          <div className="mt-5 pt-5 border-t border-surface-border">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-zinc-500 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" />
                Budget this month
              </span>
              <span className="text-zinc-300 font-mono">
                ${(monthCostCents / 100).toFixed(2)} / $1,000.00
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-overlay overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (monthCostCents / 100000) * 100)}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-accent-500"
              />
            </div>
          </div>
        </motion.section>

        {/* ── Tab Navigation ─────────────────────────────────────── */}
        <div className="border-b border-surface-border overflow-x-auto">
          <nav className="flex items-center gap-1 -mb-px min-w-max">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                    active
                      ? 'border-accent-500 text-zinc-100'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:border-surface-border'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === 'agents' && deptAgents.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-overlay text-zinc-400">
                      {deptAgents.length}
                    </span>
                  )}
                  {tab.id === 'tasks' && deptTasks.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-overlay text-zinc-400">
                      {deptTasks.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Tab Content ────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <OverviewTab
                deptId={deptId}
                deptName={dept.name}
                agentCount={deptAgents.length}
                runningAgents={runningAgents}
                completedTasks={completedTasks}
                failedTasks={failedTasks}
                activeWorkflows={activeWorkflows}
                monthCostCents={monthCostCents}
                costLoading={costLoading}
                taskStatusDonut={taskStatusDonut}
              />
            )}
            {activeTab === 'agents' && (
              <AgentsTab deptAgents={deptAgents} onInspect={(id) => openInspector('agent', id)} />
            )}
            {activeTab === 'tasks' && (
              <TasksTab deptTasks={deptTasks} onInspect={(id) => openInspector('task', id)} />
            )}
            {activeTab === 'workflows' && (
              <WorkflowsTab deptWorkflows={deptWorkflows} />
            )}
            {activeTab === 'routines' && (
              <RoutinesTab agentIds={deptAgents.map((a) => a.id)} />
            )}
            {activeTab === 'projects' && (
              <ProjectsTab deptId={deptId} />
            )}
            {activeTab === 'goals' && (
              <GoalsTab deptId={deptId} />
            )}
            {activeTab === 'costs' && (
              <CostsTab
                deptId={deptId}
                monthCostCents={monthCostCents}
                loading={costLoading}
              />
            )}
            {activeTab === 'members' && (
              <MembersTab members={members} loading={membersLoading} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </TenantShell>
  );
}

// ─── Tab Components ───────────────────────────────────────────────────────

// Overview tab
function OverviewTab(props: {
  deptId: string;
  deptName: string;
  agentCount: number;
  runningAgents: number;
  completedTasks: number;
  failedTasks: number;
  activeWorkflows: number;
  monthCostCents: number;
  costLoading: boolean;
  taskStatusDonut: { name: string; value: number; color: string }[];
}) {
  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Agents"
          value={props.agentCount}
          delta={props.runningAgents}
          deltaLabel="running"
          color="ops"
          icon={<Users className="w-4 h-4" />}
        />
        <KpiCard
          label="Completed Tasks"
          value={props.completedTasks}
          color="profit"
          icon={<ListTodo className="w-4 h-4" />}
        />
        <KpiCard
          label="Active Workflows"
          value={props.activeWorkflows}
          color="strategy"
          icon={<GitBranch className="w-4 h-4" />}
        />
        <KpiCard
          label="Cost MTD"
          value={props.costLoading ? '—' : `$${(props.monthCostCents / 100).toFixed(2)}`}
          color="warn"
          icon={<Wallet className="w-4 h-4" />}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card-surface p-4">
          <h3 className="text-sm font-semibold text-zinc-200 mb-4">Task volume</h3>
          <AreaChart
            data={[]}
            dataKey="value"
            xKey="timestamp"
            color="#8b5cf6"
            loading={false}
            height={180}
          />
          <p className="text-xs text-zinc-500 text-center mt-2">
            Per-department task chart coming in Phase 5.1
          </p>
        </div>
        <div className="card-surface p-4">
          <h3 className="text-sm font-semibold text-zinc-200 mb-4">Task status</h3>
          <DonutChart
            data={
              props.taskStatusDonut.length > 0
                ? props.taskStatusDonut
                : [{ name: 'No data', value: 1, color: '#3f3f46' }]
            }
            nameKey="name"
            valueKey="value"
            loading={false}
            height={180}
          />
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">Quick actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction
            label="Spawn Agent"
            description="Add a new AI agent"
            icon={<Plus className="w-5 h-5" />}
            accent="accent"
            href="/marketplace?tab=spawn"
          />
          <QuickAction
            label="New Task"
            description="Assign work"
            icon={<ListTodo className="w-5 h-5" />}
            accent="info"
            href={`/tasks?create=1&departmentId=${props.deptId}`}
          />
          <QuickAction
            label="Set Goal"
            description="Define objective"
            icon={<Target className="w-5 h-5" />}
            accent="success"
            href={`/goals?create=1&departmentId=${props.deptId}`}
          />
          <QuickAction
            label="New Routine"
            description="Automate work"
            icon={<Repeat className="w-5 h-5" />}
            accent="warning"
            href={`/routines?create=1&departmentId=${props.deptId}`}
          />
        </div>
      </div>
    </div>
  );
}

// Agents tab
function AgentsTab({ deptAgents, onInspect }: { deptAgents: unknown[]; onInspect: (id: string) => void }) {
  if (deptAgents.length === 0) {
    return (
      <EmptyTab
        icon={<Users className="w-10 h-10" />}
        title="No agents in this department yet"
        description="Spawn your first agent from the marketplace."
        ctaLabel="Spawn Agent"
        ctaHref="/marketplace?tab=spawn"
      />
    );
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {deptAgents.map((agent) => {
          const a = agent as {
            id: string; name: string; status: string; type?: string;
            updatedAt?: string; model?: { name?: string };
            department?: { name?: string }; monthlyBudget?: number;
          };
          return (
            <AgentCard
              key={a.id}
              agent={{
                id: a.id,
                name: a.name,
                type: a.type ?? 'FUNCTIONAL',
                status: a.status as never,
                department: a.department?.name,
                model: a.model?.name ?? 'gpt-4o',
                workload: 0,
                taskCount: 0,
                successRate: 0,
                budgetUsed: 0,
                budgetTotal: a.monthlyBudget ?? 100,
                lastActiveAt: a.updatedAt,
              }}
              variant="compact"
              onAction={(action, id) => action === 'inspect' && onInspect(id)}
            />
          );
        })}
      </div>
    </div>
  );
}

// Tasks tab — board-style summary
function TasksTab({ deptTasks, onInspect }: { deptTasks: unknown[]; onInspect: (id: string) => void }) {
  if (deptTasks.length === 0) {
    return (
      <EmptyTab
        icon={<ListTodo className="w-10 h-10" />}
        title="No tasks in this department"
        description="Tasks assigned to agents in this department will appear here."
      />
    );
  }

  const columns = [
    { id: 'PENDING', label: 'Pending', color: 'border-zinc-700' },
    { id: 'RUNNING', label: 'Running', color: 'border-blue-700' },
    { id: 'COMPLETED', label: 'Completed', color: 'border-emerald-700' },
    { id: 'FAILED', label: 'Failed', color: 'border-red-700' },
  ] as const;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {columns.map((col) => {
        const items = deptTasks.filter((t) => {
          const task = t as { status: string };
          if (col.id === 'RUNNING') return task.status === 'RUNNING' || task.status === 'IN_PROGRESS';
          return task.status === col.id;
        });
        return (
          <div key={col.id} className={`card-surface p-3 border-t-2 ${col.color}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">{col.label}</h3>
              <span className="text-xs text-zinc-500">{items.length}</span>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-xs text-zinc-600 py-4 text-center">Empty</p>
              ) : (
                items.slice(0, 8).map((task) => {
                  const t = task as {
                    id: string; title: string; priority: string;
                    agent?: { name: string }; evaluationScore?: number;
                  };
                  return (
                    <button
                      key={t.id}
                      onClick={() => onInspect(t.id)}
                      className="w-full text-left p-2 rounded-md bg-surface-overlay hover:bg-surface-border transition"
                    >
                      <p className="text-xs font-medium text-zinc-200 line-clamp-2">{t.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={t.priority} />
                        {t.evaluationScore != null && (
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {(t.evaluationScore * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
              {items.length > 8 && (
                <p className="text-xs text-zinc-500 text-center pt-1">
                  +{items.length - 8} more
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Workflows tab
function WorkflowsTab({ deptWorkflows }: { deptWorkflows: unknown[] }) {
  if (deptWorkflows.length === 0) {
    return (
      <EmptyTab
        icon={<GitBranch className="w-10 h-10" />}
        title="No workflows in this department"
        description="Create workflows to automate recurring agent tasks."
        ctaLabel="New Workflow"
        ctaHref="/workflows"
      />
    );
  }
  return (
    <div className="card-surface divide-y divide-surface-border">
      {deptWorkflows.map((wf) => {
        const w = wf as { id: string; name: string; isActive: boolean; agent?: { name: string } };
        return (
          <Link
            key={w.id}
            href={`/workflows/${w.id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-surface-overlay transition"
          >
            <GitBranch className="w-4 h-4 text-zinc-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate">{w.name}</p>
              {w.agent && (
                <p className="text-xs text-zinc-500 truncate">{w.agent.name}</p>
              )}
            </div>
            <StatusBadge status={w.isActive ? 'ACTIVE' : 'PAUSED'} />
          </Link>
        );
      })}
    </div>
  );
}

// Routines tab — uses Phase 1 backend fix ?ownerAgentIds=
function RoutinesTab({ agentIds }: { agentIds: string[] }) {
  const [routines, setRoutines] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (agentIds.length === 0) {
      setRoutines([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ids = agentIds.join(',');
    api
      .get(`/routines?ownerAgentIds=${ids}&limit=50`)
      .then((res) => {
        const data = unwrapList(res);
        setRoutines(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => setRoutines([]))
      .finally(() => setLoading(false));
  }, [agentIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="card-surface p-8 text-center text-zinc-500 text-sm">Loading…</div>;
  if (routines.length === 0) {
    return (
      <EmptyTab
        icon={<Repeat className="w-10 h-10" />}
        title="No routines in this department"
        description="Routines owned by agents in this department will appear here."
        ctaLabel="New Routine"
        ctaHref="/routines"
      />
    );
  }
  return (
    <div className="card-surface divide-y divide-surface-border">
      {routines.map((routine) => {
        const r = routine as { id: string; name: string; status: string; description?: string };
        return (
          <Link
            key={r.id}
            href={`/routines/${r.id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-surface-overlay transition"
          >
            <Repeat className="w-4 h-4 text-zinc-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate">{r.name}</p>
              {r.description && (
                <p className="text-xs text-zinc-500 truncate">{r.description}</p>
              )}
            </div>
            <StatusBadge status={r.status} />
          </Link>
        );
      })}
    </div>
  );
}

// Projects tab
function ProjectsTab({ deptId }: { deptId: string }) {
  const [projects, setProjects] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/projects?departmentId=${deptId}&limit=50`)
      .then((res) => {
        const data = unwrapList(res);
        setProjects(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [deptId]);

  if (loading) return <div className="card-surface p-8 text-center text-zinc-500 text-sm">Loading…</div>;
  if (projects.length === 0) {
    return (
      <EmptyTab
        icon={<Briefcase className="w-10 h-10" />}
        title="No projects in this department"
        description="Create projects to track deliverables and timelines."
        ctaLabel="New Project"
        ctaHref="/projects"
      />
    );
  }
  return (
    <div className="card-surface divide-y divide-surface-border">
      {projects.map((proj) => {
        const p = proj as { id: string; name: string; status: string; description?: string; targetDate?: string };
        return (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-surface-overlay transition"
          >
            <Briefcase className="w-4 h-4 text-zinc-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate">{p.name}</p>
              {p.description && (
                <p className="text-xs text-zinc-500 truncate">{p.description}</p>
              )}
            </div>
            {p.targetDate && (
              <span className="text-xs text-zinc-500">
                {new Date(p.targetDate).toLocaleDateString()}
              </span>
            )}
            <StatusBadge status={p.status} />
          </Link>
        );
      })}
    </div>
  );
}

// Goals tab
function GoalsTab({ deptId }: { deptId: string }) {
  const [goals, setGoals] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/goals?departmentId=${deptId}&limit=50`)
      .then((res) => {
        const data = unwrapList(res);
        setGoals(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => setGoals([]))
      .finally(() => setLoading(false));
  }, [deptId]);

  if (loading) return <div className="card-surface p-8 text-center text-zinc-500 text-sm">Loading…</div>;
  if (goals.length === 0) {
    return (
      <EmptyTab
        icon={<Target className="w-10 h-10" />}
        title="No goals in this department"
        description="Define objectives and track progress at the department level."
        ctaLabel="Set Goal"
        ctaHref="/goals"
      />
    );
  }
  return (
    <div className="space-y-2">
      {goals.map((goal) => {
        const g = goal as {
          id: string; title: string; status: string; progress: number;
          level?: string; ownerAgent?: { name?: string };
        };
        return (
          <div key={g.id} className="card-surface p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-200">{g.title}</p>
                {g.ownerAgent?.name && (
                  <p className="text-xs text-zinc-500 mt-0.5">Owner: {g.ownerAgent.name}</p>
                )}
              </div>
              <StatusBadge status={g.status} />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-surface-overlay overflow-hidden">
                <div
                  className="h-full bg-accent-500 transition-all"
                  style={{ width: `${Math.min(100, g.progress ?? 0)}%` }}
                />
              </div>
              <span className="text-xs font-mono text-zinc-400 w-10 text-right">
                {g.progress ?? 0}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Costs tab
function CostsTab({ deptId, monthCostCents, loading }: { deptId: string; monthCostCents: number; loading: boolean }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          label="MTD Cost"
          value={loading ? '—' : `$${(monthCostCents / 100).toFixed(2)}`}
          color="warn"
          icon={<Wallet className="w-4 h-4" />}
        />
        <KpiCard label="Daily average" value="—" color="neutral" />
        <KpiCard label="Projected EOM" value="—" color="neutral" />
      </div>
      <div className="card-surface p-6 text-center">
        <Wallet className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
        <p className="text-sm text-zinc-300 font-medium">Cost detail coming soon</p>
        <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
          Detailed cost breakdown (by model, by agent, by provider) for department <code className="text-zinc-400">{deptId}</code> requires per-agent cost endpoints.
        </p>
      </div>
    </div>
  );
}

// Members tab
function MembersTab({ members, loading }: { members: Member[]; loading: boolean }) {
  if (loading) return <div className="card-surface p-8 text-center text-zinc-500 text-sm">Loading…</div>;
  if (members.length === 0) {
    return (
      <EmptyTab
        icon={<UserCog className="w-10 h-10" />}
        title="No members assigned"
        description="Members of this department will appear here. Assign users from the admin panel."
      />
    );
  }
  return (
    <div className="card-surface divide-y divide-surface-border">
      {members.map((m) => (
        <div key={m.id} className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 rounded-full bg-accent-500/15 text-accent-500 flex items-center justify-center text-sm font-semibold">
            {(m.firstName?.[0] ?? m.email[0]).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">
              {m.firstName} {m.lastName}
            </p>
            <p className="text-xs text-zinc-500 truncate">{m.email}</p>
          </div>
          <StatusBadge status={m.role} />
          {m.isActive !== undefined && (
            <StatusBadge status={m.isActive ? 'ACTIVE' : 'INACTIVE'} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Empty State Helper ───────────────────────────────────────────────────
function EmptyTab({
  icon,
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="card-surface p-12 text-center">
      <div className="w-12 h-12 rounded-xl bg-surface-overlay text-zinc-500 flex items-center justify-center mx-auto mb-3">
        {icon}
      </div>
      <p className="text-sm font-medium text-zinc-300">{title}</p>
      <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">{description}</p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-xs font-medium transition"
        >
          <Plus className="w-3 h-3" />
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}