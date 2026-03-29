"use client";

/**
 * Unified Inbox Page
 *
 * Central hub for notifications, approvals, alerts, and mentions
 * Following SOLID: Single Responsibility - UI only, API calls delegated
 */

import { useCallback, useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Inbox as InboxIcon,
  Bell,
  AlertTriangle,
  CheckCircle,
  Archive,
  Trash2,
  RefreshCw,
  Mail,
  MessageSquare,
  Shield,
  AlertCircle,
  Check,
} from "lucide-react";

interface InboxItem {
  id: string;
  kind:
    | "APPROVAL"
    | "FAILED_TASK"
    | "AGENT_ALERT"
    | "BUDGET_ALERT"
    | "MENTION"
    | "SYSTEM";
  title: string;
  body?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "UNREAD" | "READ" | "ARCHIVED";
  entityType: string;
  entityId: string;
  actionUrl?: string;
  createdAt: string;
  readAt?: string;
}

interface InboxSummary {
  total: number;
  unread: number;
  byKind: Record<string, number>;
}

const KIND_ICONS: Record<string, React.ReactNode> = {
  APPROVAL: <Shield className="h-4 w-4 text-blue-500" />,
  FAILED_TASK: <AlertCircle className="h-4 w-4 text-red-500" />,
  AGENT_ALERT: <AlertTriangle className="h-4 w-4 text-orange-500" />,
  BUDGET_ALERT: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  MENTION: <MessageSquare className="h-4 w-4 text-purple-500" />,
  SYSTEM: <Bell className="h-4 w-4 text-gray-500" />,
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
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

export default function InboxPage() {
  const user = useTenantAuth();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [summary, setSummary] = useState<InboxSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const fetchInbox = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (activeTab !== "all") {
        params.set("status", activeTab.toUpperCase());
      }

      const [itemsRes, summaryRes] = await Promise.all([
        fetch(`/api/v1/inbox?${params.toString()}`),
        fetch("/api/v1/inbox/summary"),
      ]);

      if (!itemsRes.ok || !summaryRes.ok) {
        throw new Error("Failed to fetch inbox");
      }

      const itemsData = await itemsRes.json();
      const summaryData = await summaryRes.json();

      setItems(itemsData.data || itemsData);
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }, [user, activeTab]);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  const markAsRead = async (id: string) => {
    if (!user) return;

    try {
      const res = await fetch(`/api/v1/inbox/${id}/read`, {
        method: "PATCH",
      });

      if (res.ok) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "READ" as const,
                  readAt: new Date().toISOString(),
                }
              : item,
          ),
        );
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const archiveItem = async (id: string) => {
    if (!user) return;

    try {
      const res = await fetch(`/api/v1/inbox/${id}/archive`, {
        method: "PATCH",
      });

      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        fetchInbox(); // Refresh summary
      }
    } catch (err) {
      console.error("Failed to archive:", err);
    }
  };

  const deleteItem = async (id: string) => {
    if (!user) return;

    try {
      const res = await fetch(`/api/v1/inbox/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        fetchInbox(); // Refresh summary
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const filteredItems = items.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return item.status === "UNREAD";
    return item.status === activeTab.toUpperCase();
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">
          Please log in to view your inbox.
        </p>
      </div>
    );
  }

  return (
    <TenantShell user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
            <p className="text-muted-foreground">
              {summary
                ? `${summary.unread} unread of ${summary.total} total notifications`
                : "Loading notifications..."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInbox}
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

        {/* Summary Cards */}
        {summary && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <InboxIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unread</CardTitle>
                <Mail className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {summary.unread}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approvals</CardTitle>
                <Shield className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.byKind?.APPROVAL || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(summary.byKind?.FAILED_TASK || 0) +
                    (summary.byKind?.AGENT_ALERT || 0) +
                    (summary.byKind?.BUDGET_ALERT || 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs and Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              All
              {summary && (
                <span className="ml-2 text-xs">({summary.total})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {summary && (
                <span className="ml-2 text-xs bg-blue-100 px-1.5 py-0.5 rounded-full">
                  {summary.unread}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="read">Read</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              <Card>
                <CardContent className="flex items-center justify-center min-h-[200px]">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ) : filteredItems.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center min-h-[200px] text-center">
                  <InboxIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No notifications</p>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === "all"
                      ? "You're all caught up!"
                      : `No ${activeTab} notifications`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Type</TableHead>
                      <TableHead>Notification</TableHead>
                      <TableHead className="w-[100px]">Priority</TableHead>
                      <TableHead className="w-[150px]">Time</TableHead>
                      <TableHead className="w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow
                        key={item.id}
                        className={
                          item.status === "UNREAD"
                            ? "bg-blue-50/50 dark:bg-blue-950/20"
                            : ""
                        }
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {KIND_ICONS[item.kind] || (
                              <Bell className="h-4 w-4" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{item.title}</p>
                              {item.status === "UNREAD" && (
                                <span className="h-2 w-2 rounded-full bg-blue-500" />
                              )}
                            </div>
                            {item.body && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {item.body}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground capitalize">
                              {item.entityType.replace(/_/g, " ").toLowerCase()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={PRIORITY_COLORS[item.priority]}
                            variant="secondary"
                          >
                            {item.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatTimeAgo(item.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {item.status === "UNREAD" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(item.id)}
                                title="Mark as read"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => archiveItem(item.id)}
                              title="Archive"
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteItem(item.id)}
                              title="Delete"
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TenantShell>
  );
}
