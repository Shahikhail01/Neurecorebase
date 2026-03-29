"use client";

import { useState } from "react";
import TenantShell from "@/components/TenantShell";
import { useTenantAuth } from "@/hooks/useTenantAuth";
import { useOrgChart } from "@/features/org-chart/hooks/useOrgChart";
import {
  Search,
  Download,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Building2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function OrgChartPage() {
  const user = useTenantAuth();
  const {
    filteredTree,
    query,
    setQuery,
    isLoading,
    expandedDepts,
    toggleDept,
  } = useOrgChart();

  const [zoom, setZoom] = useState(1);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 1.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.5));
  const handleReset = () => {
    setZoom(1);
    setQuery("");
  };

  const handleExport = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      departments: filteredTree.length,
      tree: filteredTree,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `org-chart-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalAgents = filteredTree.reduce(
    (sum, dept) => sum + (dept.children?.length || 0),
    0,
  );

  return (
    <TenantShell user={user}>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Organization Chart
            </h1>
            <p className="text-muted-foreground">
              View and manage your organization structure
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search departments or agents..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departments</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredTree.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agents</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAgents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expanded</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expandedDepts.size}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Filtered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {query ? `${filteredTree.length} depts` : "All"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Org Chart Tree */}
        <Card>
          <CardContent className="p-6 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">Loading organization...</p>
              </div>
            ) : filteredTree.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  {query
                    ? "No results match your search."
                    : "No departments found."}
                </p>
                {query && (
                  <Button variant="outline" onClick={() => setQuery("")}>
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <div
                className="min-w-[600px] transition-transform duration-200"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                }}
              >
                {/* Tree */}
                <div className="space-y-3">
                  {filteredTree.map((dept) => {
                    const isExpanded = expandedDepts.has(dept.id);
                    const agentCount = dept.children?.length || 0;

                    return (
                      <div key={dept.id} className="space-y-2">
                        {/* Department Row */}
                        <div
                          className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/30 cursor-pointer transition-colors"
                          onClick={() => toggleDept(dept.id)}
                        >
                          <span className="text-zinc-400 transition-transform">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </span>
                          <Building2 className="h-5 w-5 text-indigo-400" />
                          <div className="flex-1">
                            <p className="font-medium text-zinc-200">
                              {dept.name}
                            </p>
                            {dept._dept?.description && (
                              <p className="text-xs text-zinc-500 truncate">
                                {dept._dept.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {agentCount} agent{agentCount !== 1 ? "s" : ""}
                          </Badge>
                        </div>

                        {/* Agents */}
                        {isExpanded && agentCount > 0 && (
                          <div className="ml-8 space-y-2 border-l-2 border-zinc-800 pl-4">
                            {dept.children?.map((agent) => (
                              <div
                                key={agent.id}
                                className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-800/20 transition-colors"
                              >
                                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                {agent.avatarUrl ? (
                                  <img
                                    src={agent.avatarUrl}
                                    alt={agent.name}
                                    className="h-8 w-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-indigo-900/60 flex items-center justify-center text-xs font-bold text-indigo-300">
                                    {agent.name.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div className="flex-1">
                                  <p className="font-medium text-zinc-300">
                                    {agent.name}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    {agent.status && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] px-1.5 py-0"
                                      >
                                        {agent.status}
                                      </Badge>
                                    )}
                                    {agent.mood && <span>{agent.mood}</span>}
                                  </div>
                                </div>
                                {agent.workloadGauge !== undefined && (
                                  <div className="w-16">
                                    <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-indigo-500"
                                        style={{
                                          width: `${agent.workloadGauge}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Help text */}
                <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground text-center">
                    Click on a department to expand/collapse agents. Use zoom
                    controls to adjust view size. Export to download as JSON.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TenantShell>
  );
}
