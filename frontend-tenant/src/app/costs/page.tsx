"use client";

/**
 * Costs Page
 *
 * Cost tracking and budget management dashboard
 * Following the Paperclip Costs UI pattern
 */

import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Plus,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface CostSummary {
  totalCostCents: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  recordCount: number;
  byModel?: Record<string, number>;
  byProvider?: Record<string, number>;
}

interface BudgetPolicy {
  id: string;
  name: string;
  limitCents: number;
  currentSpendCents: number;
  period: "DAILY" | "WEEKLY" | "MONTHLY";
  scope: "TENANT" | "DEPARTMENT" | "AGENT" | "MODEL";
  alertThresholds: number[];
  action: "ALERT" | "BLOCK" | "DEGRADE";
  enabled: boolean;
  utilizationPercent: number;
}

interface CostRecord {
  id: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costCents: number;
  createdAt: string;
}

export default function CostsPage() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [budgets, setBudgets] = useState<BudgetPolicy[]>([]);
  const [records, setRecords] = useState<CostRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "custom">(
    "30d",
  );

  const fetchCosts = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      if (dateRange === "7d") startDate.setDate(startDate.getDate() - 7);
      else if (dateRange === "30d") startDate.setDate(startDate.getDate() - 30);
      else if (dateRange === "90d") startDate.setDate(startDate.getDate() - 90);

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      });

      const [summaryRes, budgetsRes, recordsRes] = await Promise.all([
        fetch(`/api/v1/costs/summary?${params}`),
        fetch("/api/v1/costs/budgets"),
        fetch(`/api/v1/costs/records?${params}&limit=50`),
      ]);

      if (summaryRes.ok) {
        setSummary(await summaryRes.json());
      }
      if (budgetsRes.ok) {
        const budgetsData = await budgetsRes.json();
        // Calculate utilization percentages
        setBudgets(
          (Array.isArray(budgetsData) ? budgetsData : []).map(
            (b: BudgetPolicy) => ({
              ...b,
              utilizationPercent:
                (Number(b.currentSpendCents) / Number(b.limitCents)) * 100,
            }),
          ),
        );
      }
      if (recordsRes.ok) {
        const recordsData = await recordsRes.json();
        setRecords(Array.isArray(recordsData.data) ? recordsData.data : []);
      }
    } catch (error) {
      console.error("Failed to fetch costs:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const getUtilizationColor = (percent: number) => {
    if (percent >= 90) return "text-red-500";
    if (percent >= 75) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Costs</h1>
          <p className="text-muted-foreground">
            Track AI spending and manage budgets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={dateRange}
            onValueChange={(v: string) => setDateRange(v as typeof dateRange)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchCosts} disabled={loading}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Budget Policy</DialogTitle>
                <DialogDescription>
                  Set spending limits and alert thresholds for your
                  organization.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Budget Name</Label>
                  <Input id="name" placeholder="Monthly AI Spend" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="limit">Limit ($)</Label>
                    <Input id="limit" type="number" placeholder="100.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="period">Period</Label>
                    <Select defaultValue="MONTHLY">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scope">Scope</Label>
                  <Select defaultValue="TENANT">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TENANT">
                        Entire Organization
                      </SelectItem>
                      <SelectItem value="DEPARTMENT">Department</SelectItem>
                      <SelectItem value="AGENT">Specific Agent</SelectItem>
                      <SelectItem value="MODEL">Model Type</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  Create Budget
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.totalCostCents)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.recordCount.toLocaleString()} API calls
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Input Tokens
              </CardTitle>
              <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.totalInputTokens.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Tokens sent to models
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Output Tokens
              </CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.totalOutputTokens.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Tokens received from models
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Cost per Call
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.recordCount > 0
                  ? formatCurrency(summary.totalCostCents / summary.recordCount)
                  : "$0.00"}
              </div>
              <p className="text-xs text-muted-foreground">
                Average cost per API call
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Budget Alerts */}
      {budgets.filter((b) => b.utilizationPercent >= 75).length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {budgets.filter((b) => b.utilizationPercent >= 75).length} budget(s)
            exceeding 75% utilization
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="records">Cost Records</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* By Provider */}
            <Card>
              <CardHeader>
                <CardTitle>Cost by Provider</CardTitle>
              </CardHeader>
              <CardContent>
                {summary?.byProvider ? (
                  <div className="space-y-4">
                    {Object.entries(summary.byProvider).map(
                      ([provider, cost]) => (
                        <div
                          key={provider}
                          className="flex items-center justify-between"
                        >
                          <span className="font-medium">{provider}</span>
                          <span className="text-muted-foreground">
                            {formatCurrency(cost as number)}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No provider data available
                  </p>
                )}
              </CardContent>
            </Card>

            {/* By Model */}
            <Card>
              <CardHeader>
                <CardTitle>Cost by Model</CardTitle>
              </CardHeader>
              <CardContent>
                {summary?.byModel ? (
                  <div className="space-y-4">
                    {Object.entries(summary.byModel).map(([model, cost]) => (
                      <div
                        key={model}
                        className="flex items-center justify-between"
                      >
                        <span className="font-medium truncate">{model}</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(cost as number)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No model data available
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Policies</CardTitle>
              <CardDescription>
                Monitor and manage spending limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              {budgets.length > 0 ? (
                <div className="space-y-4">
                  {budgets.map((budget) => (
                    <div key={budget.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{budget.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {budget.period}
                          </Badge>
                          <Badge variant="outline" className="ml-2">
                            {budget.scope}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-medium ${getUtilizationColor(budget.utilizationPercent)}`}
                          >
                            {formatCurrency(Number(budget.currentSpendCents))}
                          </span>
                          <span className="text-muted-foreground">
                            {" / "}
                            {formatCurrency(Number(budget.limitCents))}
                          </span>
                        </div>
                      </div>
                      <Progress
                        value={Math.min(budget.utilizationPercent, 100)}
                        className={`h-2 ${
                          budget.utilizationPercent >= 90
                            ? "[&>div]:bg-red-500"
                            : budget.utilizationPercent >= 75
                              ? "[&>div]:bg-yellow-500"
                              : "[&>div]:bg-green-500"
                        }`}
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {budget.utilizationPercent.toFixed(1)}% utilized
                        </span>
                        <span>
                          Alerts at {budget.alertThresholds.join("%, ")}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No budget policies configured
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Records</CardTitle>
              <CardDescription>
                Detailed history of AI API calls
              </CardDescription>
            </CardHeader>
            <CardContent>
              {records.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead className="text-right">Input Tokens</TableHead>
                      <TableHead className="text-right">
                        Output Tokens
                      </TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono text-xs">
                          {new Date(record.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.provider}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {record.model}
                        </TableCell>
                        <TableCell className="text-right">
                          {record.inputTokens.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {record.outputTokens.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(record.costCents)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No cost records found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
