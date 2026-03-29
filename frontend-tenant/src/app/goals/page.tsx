"use client";

/**
 * Goals Page
 *
 * Hierarchical goal management with tree view
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  Target,
  Plus,
  RefreshCw,
  Trash2,
  Edit,
  Calendar,
  ChevronRightIcon,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";

interface Goal {
  id: string;
  title: string;
  description?: string;
  level: "COMPANY" | "DEPARTMENT" | "TEAM" | "INDIVIDUAL";
  status: "ACTIVE" | "COMPLETED" | "PAUSED" | "ARCHIVED";
  progress: number;
  parentId?: string;
  children?: Goal[];
  ownerUserId?: string;
  ownerAgentId?: string;
  departmentId?: string;
  targetDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface GoalTreeNode extends Goal {
  children: GoalTreeNode[];
  depth: number;
  isExpanded: boolean;
}

const LEVEL_COLORS: Record<string, string> = {
  COMPANY:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  DEPARTMENT: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  TEAM: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  INDIVIDUAL: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  ACTIVE: <Circle className="h-4 w-4 text-green-500" />,
  COMPLETED: <CheckCircle2 className="h-4 w-4 text-blue-500" />,
  PAUSED: <AlertCircle className="h-4 w-4 text-yellow-500" />,
  ARCHIVED: <Circle className="h-4 w-4 text-gray-400" />,
};

interface GoalNodeProps {
  goal: GoalTreeNode;
  onToggle: (id: string) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}

function GoalNode({
  goal,
  onToggle,
  onEdit,
  onDelete,
  onAddChild,
}: GoalNodeProps) {
  const hasChildren = goal.children && goal.children.length > 0;

  return (
    <div className="border-b border-border last:border-b-0">
      <div
        className="flex items-center gap-2 px-4 py-3 hover:bg-muted/50 transition-colors"
        style={{ paddingLeft: `${goal.depth * 24 + 16}px` }}
      >
        {/* Expand/Collapse */}
        <button
          onClick={() => hasChildren && onToggle(goal.id)}
          className={`p-1 rounded hover:bg-muted ${!hasChildren ? "invisible" : ""}`}
          disabled={!hasChildren}
        >
          {goal.isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          )}
        </button>

        {/* Status Icon */}
        {STATUS_ICONS[goal.status]}

        {/* Goal Title & Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{goal.title}</span>
            <Badge className={LEVEL_COLORS[goal.level]} variant="secondary">
              {goal.level}
            </Badge>
            {goal.status === "COMPLETED" && (
              <Badge variant="outline" className="text-green-600">
                Completed
              </Badge>
            )}
          </div>
          {goal.description && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {goal.description}
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 w-32">
          <Progress value={goal.progress} className="h-2" />
          <span className="text-sm text-muted-foreground w-10 text-right">
            {goal.progress}%
          </span>
        </div>

        {/* Target Date */}
        {goal.targetDate && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{new Date(goal.targetDate).toLocaleDateString()}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddChild(goal.id)}
            title="Add sub-goal"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(goal)}
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(goal.id)}
            className="text-red-500 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Children */}
      {goal.isExpanded && hasChildren && (
        <Collapsible open={goal.isExpanded}>
          <CollapsibleContent>
            {goal.children.map((child) => (
              <GoalNode
                key={child.id}
                goal={child as GoalTreeNode}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

interface GoalFormData {
  title: string;
  description: string;
  level: "COMPANY" | "DEPARTMENT" | "TEAM" | "INDIVIDUAL";
  parentId?: string;
  targetDate?: string;
}

export default function GoalsPage() {
  const user = useTenantAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalTree, setGoalTree] = useState<GoalTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [parentIdForNew, setParentIdForNew] = useState<string | undefined>();
  const [formData, setFormData] = useState<GoalFormData>({
    title: "",
    description: "",
    level: "INDIVIDUAL",
    parentId: undefined,
    targetDate: undefined,
  });

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/goals/tree");

      if (!res.ok) {
        throw new Error("Failed to fetch goals");
      }

      const data = await res.json();
      setGoals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const buildTree = (goalsList: Goal[], depth = 0): GoalTreeNode[] => {
    return goalsList
      .filter((g) => !g.parentId)
      .map((goal) => ({
        ...goal,
        depth,
        isExpanded: expandedIds.has(goal.id),
        children: buildTree(
          goalsList.filter((g) => g.parentId === goal.id),
          depth + 1,
        ),
      }));
  };

  useEffect(() => {
    setGoalTree(buildTree(goals));
  }, [goals, expandedIds]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddChild = (parentId: string) => {
    setParentIdForNew(parentId);
    setEditingGoal(null);
    setFormData({
      title: "",
      description: "",
      level: "INDIVIDUAL",
      parentId,
      targetDate: undefined,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setParentIdForNew(goal.parentId);
    setFormData({
      title: goal.title,
      description: goal.description || "",
      level: goal.level,
      parentId: goal.parentId,
      targetDate: goal.targetDate?.split("T")[0],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm("Are you sure you want to delete this goal?")) return;

    try {
      const res = await fetch(`/api/v1/goals/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchGoals();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete goal");
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const url = editingGoal
        ? `/api/v1/goals/${editingGoal.id}`
        : "/api/v1/goals";
      const method = editingGoal ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        fetchGoals();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to save goal");
      }
    } catch (err) {
      console.error("Failed to save:", err);
    }
  };

  const updateProgress = async (id: string, progress: number) => {
    try {
      await fetch(`/api/v1/goals/${id}/progress`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ progress }),
      });
      fetchGoals();
    } catch (err) {
      console.error("Failed to update progress:", err);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Please log in to view goals.</p>
      </div>
    );
  }

  return (
    <TenantShell user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Goals</h1>
            <p className="text-muted-foreground">
              Track and manage hierarchical goals across your organization
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchGoals}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingGoal(null);
                    setParentIdForNew(undefined);
                    setFormData({
                      title: "",
                      description: "",
                      level: "INDIVIDUAL",
                      parentId: undefined,
                      targetDate: undefined,
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingGoal
                        ? "Edit Goal"
                        : parentIdForNew
                          ? "Add Sub-Goal"
                          : "Create New Goal"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingGoal
                        ? "Update the goal details below."
                        : parentIdForNew
                          ? "Create a sub-goal under the selected parent."
                          : "Create a new goal for your organization."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="Enter goal title"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Describe this goal..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="level">Level</Label>
                      <Select
                        value={formData.level}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            level: value as GoalFormData["level"],
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COMPANY">Company</SelectItem>
                          <SelectItem value="DEPARTMENT">Department</SelectItem>
                          <SelectItem value="TEAM">Team</SelectItem>
                          <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="targetDate">Target Date</Label>
                      <Input
                        id="targetDate"
                        type="date"
                        value={formData.targetDate || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            targetDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingGoal ? "Save Changes" : "Create Goal"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Goals Tree */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Goal Hierarchy
            </CardTitle>
            <CardDescription>
              Expand goals to view sub-goals. Click to edit or add children.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : goals.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-8">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No goals yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first goal to start tracking progress
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Goal
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {goalTree.map((goal) => (
                  <GoalNode
                    key={goal.id}
                    goal={goal}
                    onToggle={toggleExpand}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAddChild={handleAddChild}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TenantShell>
  );
}
