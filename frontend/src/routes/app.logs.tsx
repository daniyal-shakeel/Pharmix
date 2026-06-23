import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import api from "@/api/base";
import { useAuth } from "@/store";
import { PageHeader, StatCard, SectionPanel, StatusBadge } from "@/components/ui-kit";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Terminal, ShieldCheck, ShieldAlert, Activity } from "lucide-react";

export const Route = createFileRoute("/app/logs")({
  component: LogsDashboard,
});

const chartColors = ["#5e6ad2", "#d97373"];
const tooltipStyle = {
  backgroundColor: "oklch(0.18 0.014 270)",
  border: "1px solid oklch(1 0 0 / 0.08)",
  borderRadius: 8,
  fontSize: 11,
};

function LogsDashboard() {
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.isSuperAdmin) {
      navigate({ to: "/app/dashboard" });
    }
  }, [user, navigate]);

  if (!user?.isSuperAdmin) return null;
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    try {
      const resultQuery = resultFilter !== "all" ? resultFilter : "";
      const actionQuery = actionFilter !== "all" ? actionFilter : "";
      const logsRes = await api.get("/analytics/logs", {
        params: { page, limit: 10, search, result: resultQuery, action: actionQuery }
      });
      setLogs(logsRes.data.logs);
      setTotalPages(logsRes.data.pages);

      const statsRes = await api.get("/analytics/logs/stats");
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, resultFilter, actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  if (loading) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="Logs & Monitoring"
        description="Monitor system-wide write activity, security events, and rate restrictions in real-time."
      />

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard
            label="Total Write Requests"
            value={stats.total?.toString() || "0"}
            icon={Activity}
          />
          <StatCard
            label="Allowed Actions"
            value={stats.allowed?.toString() || "0"}
            icon={ShieldCheck}
          />
          <StatCard
            label="Blocked Actions"
            value={stats.blocked?.toString() || "0"}
            icon={ShieldAlert}
          />
        </div>
      )}

      {stats?.chartData && stats.chartData.length > 0 && (
        <SectionPanel title="Security & Traffic Activity" description="Allowed vs Blocked actions (last 10 days)">
          <div className="h-80 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData} margin={{ left: -20, right: 8 }}>
                <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="oklch(0.66 0.02 270)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="oklch(0.66 0.02 270)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar name="Allowed" dataKey="allowed" fill="#5e6ad2" radius={[3, 3, 0, 0]} />
                <Bar name="Blocked" dataKey="blocked" fill="#d97373" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionPanel>
      )}

      <SectionPanel title="System Action Logs" description="Real-time access audit log stream">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 mb-6 items-end">
          <div className="flex-1 space-y-1.5 w-full">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Search</label>
            <Input
              placeholder="Search IP, User ID, Route..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 bg-surface border-border"
            />
          </div>
          <div className="w-full md:w-44 space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Result</label>
            <Select value={resultFilter} onValueChange={(val) => { setResultFilter(val); setPage(1); }}>
              <SelectTrigger className="h-9 bg-surface border-border">
                <SelectValue placeholder="All results" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="ALLOWED">Allowed</SelectItem>
                <SelectItem value="BLOCKED">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-44 space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Action</label>
            <Select value={actionFilter} onValueChange={(val) => { setActionFilter(val); setPage(1); }}>
              <SelectTrigger className="h-9 bg-surface border-border">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" size="sm" className="h-9 w-full md:w-auto px-5 bg-primary hover:bg-primary/90">
            Search
          </Button>
        </form>

        <div className="overflow-x-auto -mx-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="text-left font-medium px-4 py-2">Timestamp</th>
                <th className="text-left font-medium px-4 py-2">IP Address</th>
                <th className="text-left font-medium px-4 py-2">User ID</th>
                <th className="text-left font-medium px-4 py-2">Route</th>
                <th className="text-left font-medium px-4 py-2">Action</th>
                <th className="text-left font-medium px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log._id}
                  className="border-b border-border last:border-0 hover:bg-surface-2/50"
                >
                  <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px]">{log.ip}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">{log.userId}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px]">{log.route}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-semibold uppercase text-[10px] tracking-wider">{log.action}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={log.result.includes("BLOCKED") ? "cancelled" : "active"} />
                    <span className="ml-1.5 text-[10px] text-muted-foreground truncate max-w-[150px] inline-block align-middle">
                      {log.result}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    No logs found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="h-8 text-xs border-border bg-surface hover:bg-surface-2"
            >
              Previous
            </Button>
            <span className="text-[11px] text-muted-foreground font-medium">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="h-8 text-xs border-border bg-surface hover:bg-surface-2"
            >
              Next
            </Button>
          </div>
        )}
      </SectionPanel>
    </div>
  );
}
