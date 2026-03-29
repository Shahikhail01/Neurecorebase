"use client";

/**
 * Activity Page
 *
 * Activity feed showing all system events and user actions
 * Following SOLID: Single Responsibility - UI only, API calls delegated
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import TenantShell from "@/components/TenantShell";
import { useTenantAuth } from "@/hooks/useTenantAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  History,
  RefreshCw,
  Filter,
  User,
  Bot,
  Settings,
  Shield,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  LogIn,
  LogOut,
} from "lucide-react";

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userName?: string;
  agentId?: string;
  agentName?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

type ActivityFilter = "all" | "agent" | "user" | "approval" | "system";

const ACTION_ICONS: Record<string, React.ReactNode> = {
  CREATE: <Plus className="h-4 w-4 text-green-500" />,
  UPDATE: <Edit className="h-4 w-4 text-blue-500" />,
  DELETE: <Trash2 className="h-4 w-4 text-red-500" />,
  APPROVE: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  REJECT: <AlertCircle className="h-4 w-4 text-red-500" />,
  LOGIN: <LogIn className="h-4 w-4 text-purple-500" />,
  LOGOUT: <LogOut className="h-4 w-4 text-gray-500" />,
  ASSIGN: <ArrowUpRight className="h-4 w-4 text-blue-500" />,
  UNASSIGN: <ArrowDownLeft className="h-4 w-4 text-orange-500" />,
};

const ACTION_BADGE_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  UPDATE: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  APPROVE: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  REJECT: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  LOGIN:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  LOGOUT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  ASSIGN: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  UNASSIGN:
    "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function formatAction(action: string): string {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function groupByDate(entries: AuditLogEntry[]): Map<string, AuditLogEntry[]> {
  const groups = new Map<string, AuditLogEntry[]>();

  for (const entry of entries) {
    const date = new Date(entry.createdAt).toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(entry);
  }

  return groups;
}

export default function ActivityPage() {
  const user = useTenantAuth();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/audit-logs/tenant");

      if (!res.ok) {
        throw new Error("Failed to fetch activity");
      }

      const data = await res.json();
      setEntries(Array.isArray(data.data) ? data.data : data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const filteredEntries = useMemo(() => {
    let result = entries;

    // Filter by category
    if (filter !== "all") {
      switch (filter) {
        case "agent":
          result = result.filter(
            (e) => e.agentId || e.entityType.toLowerCase().includes("agent"),
          );
          break;
        case "user":
          result = result.filter((e) => e.userId && !e.agentId);
          break;
        case "approval":
          result = result.filter(
            (e) =>
              e.entityType.toLowerCase().includes("approval") ||
              e.action.toLowerCase().includes("approval"),
          );
          break;
        case "system":
          result = result.filter((e) => !e.userId && !e.agentId);
          break;
      }
    }

    // Filter by entity type
    if (entityFilter !== "all") {
      result = result.filter(
        (e) => e.entityType.toLowerCase() === entityFilter.toLowerCase(),
      );
    }

    return result;
  }, [entries, filter, entityFilter]);

  const groupedEntries = useMemo(
    () => groupByDate(filteredEntries),
    [filteredEntries],
  );

  const entityTypes = useMemo(() => {
    const types = new Set<string>();
    entries.forEach((e) => types.add(e.entityType));
    return Array.from(types).sort();
  }, [entries]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Please log in to view activity.</p>
      </div>
    );
  }

  return (
    <TenantShell user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Activity</h1>
            <p className="text-muted-foreground">
              View all system events and user actions
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchActivity}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>

              <Select
                value={filter}
                onValueChange={(v) => setFilter(v as ActivityFilter)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="agent">Agent Actions</SelectItem>
                  <SelectItem value="user">User Actions</SelectItem>
                  <SelectItem value="approval">Approvals</SelectItem>
                  <SelectItem value="system">System Events</SelectItem>
                </SelectContent>
              </Select>

              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Entity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {entityTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <div className="space-y-6">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center min-h-[200px]">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : groupedEntries.size === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center min-h-[200px] text-center p-8">
                <History className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No activity found</p>
                <p className="text-sm text-muted-foreground">
                  {filter !== "all" || entityFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Activity will appear here as users interact with the system"}
                </p>
              </CardContent>
            </Card>
          ) : (
            Array.from(groupedEntries.entries()).map(([date, dayEntries]) => (
              <div key={date}>
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    {date}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {dayEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-start gap-4 px-4 py-3 hover:bg-muted/50 transition-colors"
                        >
                          {/* Icon */}
                          <div className="flex-shrink-0 mt-0.5">
                            {ACTION_ICONS[entry.action] || (
                              <History className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                className={
                                  ACTION_BADGE_COLORS[entry.action] ||
                                  "bg-gray-100 text-gray-700"
                                }
                                variant="secondary"
                              >
                                {formatAction(entry.action)}
                              </Badge>
                              <span className="text-sm">
                                on{" "}
                                <span className="font-medium capitalize">
                                  {entry.entityType
                                    .replace(/_/g, " ")
                                    .toLowerCase()}
                                </span>
                              </span>
                              {entry.entityId && (
                                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                  {entry.entityId.slice(0, 8)}...
                                </code>
                              )}
                            </div>

                            {/* Actor info */}
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              {entry.agentId ? (
                                <>
                                  <Bot className="h-3 w-3" />
                                  <span>
                                    {entry.agentName ||
                                      `Agent ${entry.agentId.slice(0, 8)}`}
                                  </span>
                                </>
                              ) : entry.userId ? (
                                <>
                                  <User className="h-3 w-3" />
                                  <span>
                                    {entry.userName ||
                                      `User ${entry.userId.slice(0, 8)}`}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Settings className="h-3 w-3" />
                                  <span>System</span>
                                </>
                              )}
                              <span>•</span>
                              <span>{formatTimeAgo(entry.createdAt)}</span>
                            </div>

                            {/* Metadata preview */}
                            {entry.metadata &&
                              Object.keys(entry.metadata).length > 0 && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {Object.entries(entry.metadata)
                                    .slice(0, 3)
                                    .map(([key, value]) => (
                                      <span key={key} className="mr-2">
                                        {key}:{" "}
                                        <span className="font-mono">
                                          {typeof value === "string"
                                            ? value.slice(0, 30)
                                            : JSON.stringify(value).slice(
                                                0,
                                                30,
                                              )}
                                        </span>
                                      </span>
                                    ))}
                                </div>
                              )}
                          </div>

                          {/* Timestamp */}
                          <div className="flex-shrink-0 text-xs text-muted-foreground">
                            {new Date(entry.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </div>
      </div>
    </TenantShell>
  );
}
