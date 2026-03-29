"use client";

/**
 * Routines Page
 *
 * Paperclip Routines/Workflows management interface.
 * Displays routines, triggers, runs, and allows execution control.
 */

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Routine {
  id: string;
  name: string;
  description?: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "DISABLED";
  graphDefinition: GraphDefinition;
  config: RoutineConfig;
  triggerCount: number;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface RoutineTrigger {
  id: string;
  type: "SCHEDULE" | "WEBHOOK" | "EVENT" | "MANUAL";
  name?: string;
  isActive: boolean;
  webhookPath?: string;
  lastFiredAt?: string;
  nextFireAt?: string;
}

interface RoutineRun {
  id: string;
  routineId: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
  triggerType?: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
}

interface GraphDefinition {
  nodes: GraphNode[];
  edges: GraphEdge[];
  entryPoint?: string;
}

interface GraphNode {
  id: string;
  name: string;
  type: "agent" | "tool" | "condition" | "approval" | "transform";
}

interface GraphEdge {
  source: string;
  target: string;
}

interface RoutineConfig {
  maxIterations?: number;
  timeoutMs?: number;
  checkpointEnabled?: boolean;
}

// ─── Status Badge Component ───────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: Routine["status"] }> = ({ status }) => {
  const config = {
    DRAFT: { bg: "bg-gray-100", text: "text-gray-700", label: "Draft" },
    ACTIVE: { bg: "bg-green-100", text: "text-green-700", label: "Active" },
    PAUSED: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Paused" },
    DISABLED: { bg: "bg-red-100", text: "text-red-700", label: "Disabled" },
  };

  const { bg, text, label } = config[status];

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}
    >
      {label}
    </span>
  );
};

const RunStatusBadge: React.FC<{ status: RoutineRun["status"] }> = ({
  status,
}) => {
  const config = {
    PENDING: { bg: "bg-gray-100", text: "text-gray-700", icon: "⏳" },
    RUNNING: { bg: "bg-blue-100", text: "text-blue-700", icon: "🔄" },
    COMPLETED: { bg: "bg-green-100", text: "text-green-700", icon: "✅" },
    FAILED: { bg: "bg-red-100", text: "text-red-700", icon: "❌" },
    CANCELLED: { bg: "bg-yellow-100", text: "text-yellow-700", icon: "⚠️" },
  };

  const { bg, text, icon } = config[status];

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text} inline-flex items-center gap-1`}
    >
      <span>{icon}</span>
      {status}
    </span>
  );
};

// ─── Trigger Icon Component ──────────────────────────────────────────────────

const TriggerIcon: React.FC<{ type: RoutineTrigger["type"] }> = ({ type }) => {
  switch (type) {
    case "SCHEDULE":
      return <span className="text-purple-500">📅</span>;
    case "WEBHOOK":
      return <span className="text-blue-500">🔗</span>;
    case "EVENT":
      return <span className="text-yellow-500">⚡</span>;
    case "MANUAL":
    default:
      return <span className="text-gray-500">▶️</span>;
  }
};

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function RoutinesPage() {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const router = useRouter();

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRunHistory, setShowRunHistory] = useState(false);
  const [runs, setRuns] = useState<RoutineRun[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (hasHydrated && !user) {
      router.push("/login");
    }
  }, [hasHydrated, user, router]);

  // Fetch routines
  const fetchRoutines = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/routines`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch routines");

      const data = await response.json();
      setRoutines(data.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchRoutines();
    }
  }, [user, fetchRoutines]);

  // Execute routine
  const handleExecute = async (routineId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/routines/${routineId}/execute`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
      );

      if (!response.ok) throw new Error("Failed to execute routine");

      fetchRoutines();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute");
    }
  };

  // Activate routine
  const handleActivate = async (routineId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/routines/${routineId}/activate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to activate routine");

      fetchRoutines();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to activate");
    }
  };

  // Pause routine
  const handlePause = async (routineId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/routines/${routineId}/pause`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to pause routine");

      fetchRoutines();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pause");
    }
  };

  // Delete routine
  const handleDelete = async (routineId: string) => {
    if (!confirm("Are you sure you want to delete this routine?")) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/routines/${routineId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to delete routine");

      setSelectedRoutine(null);
      fetchRoutines();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  // Fetch runs for selected routine
  const fetchRuns = useCallback(async (routineId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/routines/${routineId}/runs`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch runs");

      const data = await response.json();
      setRuns(data.data || []);
    } catch (err) {
      console.error("Failed to fetch runs:", err);
    }
  }, []);

  // Handle routine selection
  const handleSelectRoutine = (routine: Routine) => {
    setSelectedRoutine(routine);
    setShowRunHistory(false);
  };

  // Handle run history toggle
  const handleShowRunHistory = (routine: Routine) => {
    setSelectedRoutine(routine);
    setShowRunHistory(true);
    fetchRuns(routine.id);
  };

  // Format duration
  const formatDuration = (ms?: number) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString();
  };

  if (!hasHydrated || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-4xl animate-spin">🔄</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Routines</h1>
              <p className="mt-1 text-sm text-gray-500">
                Automated workflows powered by LangGraph
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>➕</span>
              New Routine
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Routines List */}
          <div className="w-1/3">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <input
                  type="search"
                  placeholder="Search routines..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border-b border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="divide-y divide-gray-100">
                {routines.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <span className="text-5xl">⚡</span>
                    <p className="mt-4 font-medium">No routines yet</p>
                    <p className="mt-1 text-sm">
                      Create your first routine to get started
                    </p>
                  </div>
                ) : (
                  routines.map((routine) => (
                    <div
                      key={routine.id}
                      onClick={() => handleSelectRoutine(routine)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedRoutine?.id === routine.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {routine.name}
                            </h3>
                            <StatusBadge status={routine.status} />
                          </div>
                          {routine.description && (
                            <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                              {routine.description}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <span>⚡</span>
                              {routine.triggerCount} triggers
                            </span>
                            {routine.lastRunAt && (
                              <span>
                                Last run: {formatDate(routine.lastRunAt)}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-gray-400">▶</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Routine Detail / Run History */}
          <div className="flex-1">
            {selectedRoutine ? (
              <div className="bg-white rounded-lg shadow">
                {/* Detail Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {selectedRoutine.name}
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        {selectedRoutine.description || "No description"}
                      </p>
                    </div>
                    <StatusBadge status={selectedRoutine.status} />
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex items-center gap-3">
                    {selectedRoutine.status === "DRAFT" && (
                      <button
                        onClick={() => handleActivate(selectedRoutine.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <span>▶️</span>
                        Activate
                      </button>
                    )}
                    {selectedRoutine.status === "ACTIVE" && (
                      <button
                        onClick={() => handlePause(selectedRoutine.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                      >
                        <span>⏸️</span>
                        Pause
                      </button>
                    )}
                    <button
                      onClick={() => handleExecute(selectedRoutine.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <span>▶️</span>
                      Execute Now
                    </button>
                    <button
                      onClick={() => handleShowRunHistory(selectedRoutine)}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span>📋</span>
                      View Runs
                    </button>
                    <button
                      onClick={() => handleDelete(selectedRoutine.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Run History or Graph Preview */}
                {showRunHistory ? (
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Run History
                    </h3>
                    <div className="space-y-3">
                      {runs.length === 0 ? (
                        <p className="text-gray-500 text-sm">No runs yet</p>
                      ) : (
                        runs.map((run) => (
                          <div
                            key={run.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <RunStatusBadge status={run.status} />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {run.triggerType || "Manual"} trigger
                                </p>
                                <p className="text-xs text-gray-500">
                                  Started: {formatDate(run.startedAt)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                Duration: {formatDuration(run.durationMs)}
                              </p>
                              {run.error && (
                                <p className="text-xs text-red-600 mt-1 max-w-xs truncate">
                                  {run.error}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Workflow Graph
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex flex-wrap gap-4">
                        {selectedRoutine.graphDefinition?.nodes?.map((node) => (
                          <div
                            key={node.id}
                            className="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200"
                          >
                            <span className="text-xs font-medium text-gray-500 uppercase">
                              {node.type}
                            </span>
                            <p className="text-sm font-medium text-gray-900">
                              {node.name}
                            </p>
                          </div>
                        ))}
                      </div>
                      {(!selectedRoutine.graphDefinition?.nodes ||
                        selectedRoutine.graphDefinition.nodes.length === 0) && (
                        <p className="text-gray-500 text-sm">
                          No nodes defined
                        </p>
                      )}
                    </div>

                    <h3 className="text-lg font-medium text-gray-900 mt-6 mb-4">
                      Configuration
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Max Iterations</span>
                        <span className="font-medium">
                          {selectedRoutine.config?.maxIterations || 10}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Timeout</span>
                        <span className="font-medium">
                          {selectedRoutine.config?.timeoutMs
                            ? `${selectedRoutine.config.timeoutMs / 1000}s`
                            : "None"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Checkpointing</span>
                        <span className="font-medium">
                          {selectedRoutine.config?.checkpointEnabled
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <span className="text-6xl">⚡</span>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Select a Routine
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Choose a routine from the list to view details and manage
                  execution
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal (simplified for this implementation) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Create New Routine
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Routine creation wizard coming soon. For now, routines can be
              created via API.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
