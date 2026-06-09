import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/store";
import { PageHeader, StatCard, SectionPanel, StatusBadge } from "@/components/ui-kit";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/api/base";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Truck,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/dashboard")({
  component: Dashboard,
});

const chartColors = ["#5e6ad2", "#7ab7c2", "#e3c474", "#7ac8a4", "#d97373"];
const tooltipStyle = {
  backgroundColor: "oklch(0.18 0.014 270)",
  border: "1px solid oklch(1 0 0 / 0.08)",
  borderRadius: 8,
  fontSize: 11,
};

function Dashboard() {
  const user = useAuth((s) => s.user);
  const role = user?.role || "admin";

  const [orders, setOrders] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const promises: Promise<any>[] = [];

        if (role !== "delivery") {
          promises.push(api.get("/orders").then((r) => setOrders(r.data)));
          promises.push(api.get("/medicines").then((r) => setMedicines(r.data)));
        }

        promises.push(api.get("/shipments").then((r) => setShipments(r.data)));

        if (role === "admin") {
          promises.push(api.get("/analytics/admin").then((r) => setAnalytics(r.data)));
        } else if (role === "manufacturer") {
          promises.push(api.get("/analytics/manufacturer").then((r) => setAnalytics(r.data)));
        } else if (role === "pharmacy" || role === "customer") {
          promises.push(api.get("/analytics/pharmacy").then((r) => setAnalytics(r.data)));
        }

        await Promise.allSettled(promises);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [role]);

  const titles: Record<string, string> = {
    admin: "Network Overview",
    manufacturer: "Production Overview",
    pharmacy: "Pharmacy Overview",
    customer: "My Pharmacy Dashboard",
    delivery: "Today's Routes",
  };

  const totalRevenue = orders.reduce((a, b) => a + (b.total || 0), 0);
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
  const activeShipments = shipments.filter((s) => s.status === "in_transit" || s.status === "delivered_pending").length;

  if (loading) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Skeleton className="h-80 lg:col-span-2" /><Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title={titles[role] || "Dashboard"}
        description={`Real-time insights across your ${role === "delivery" ? "deliveries" : "operations"}.`}
      />

      {role !== "delivery" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard
              label={role === "pharmacy" ? "Total Spent" : "Revenue"}
              value={`Rs ${totalRevenue.toLocaleString()}`}
              icon={DollarSign}
            />
            <StatCard
              label="Orders"
              value={orders.length.toString()}
              icon={ShoppingCart}
            />
            <StatCard
              label="Active SKUs"
              value={medicines.length.toString()}
              icon={Package}
            />
            <StatCard
              label="Shipments"
              value={shipments.length.toString()}
              icon={TrendingUp}
            />
          </div>

          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
              {analytics.revenueData?.length > 0 && (
                <SectionPanel
                  title={role === "pharmacy" ? "Spending trend" : "Revenue trend"}
                  description="Last 6 months"
                  className="lg:col-span-2"
                >
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={analytics.revenueData} margin={{ left: -20, right: 8, top: 8 }}>
                      <defs>
                        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#5e6ad2" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#5e6ad2" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                      <XAxis
                        dataKey="month"
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
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#5e6ad2"
                        strokeWidth={2}
                        fill="url(#rev)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </SectionPanel>
              )}

              {analytics.categoryData?.length > 0 && (
                <SectionPanel title="Category demand" description="Top categories">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={analytics.categoryData}
                        dataKey="demand"
                        nameKey="category"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={2}
                      >
                        {analytics.categoryData.map((_: any, i: number) => (
                          <Cell
                            key={i}
                            fill={chartColors[i % chartColors.length]}
                            stroke="oklch(0.16 0.012 270)"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5">
                    {analytics.categoryData.map((c: any, i: number) => (
                      <div key={c.category} className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-sm"
                            style={{ background: chartColors[i % chartColors.length] }}
                          />
                          <span className="text-muted-foreground">{c.category}</span>
                        </div>
                        <span className="tabular-nums">{c.demand}</span>
                      </div>
                    ))}
                  </div>
                </SectionPanel>
              )}
            </div>
          )}

          {analytics?.deliveryData?.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
              <SectionPanel title="Delivery performance" description="On-time vs delayed (last 7 days)">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analytics.deliveryData} margin={{ left: -20, right: 8 }}>
                    <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                    <XAxis
                      dataKey="day"
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
                    <Bar dataKey="onTime" fill="#5e6ad2" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="delayed" fill="#d97373" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </SectionPanel>

              <SectionPanel title="Order summary" description="Quick stats">
                <div className="grid grid-cols-2 gap-3 py-4">
                  <div className="surface rounded-xl p-4 border border-border">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Delivered</div>
                    <div className="text-2xl font-semibold tabular-nums">{deliveredOrders}</div>
                  </div>
                  <div className="surface rounded-xl p-4 border border-border">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Active Shipments</div>
                    <div className="text-2xl font-semibold tabular-nums">{activeShipments}</div>
                  </div>
                  <div className="surface rounded-xl p-4 border border-border">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Pending</div>
                    <div className="text-2xl font-semibold tabular-nums">{orders.filter((o) => o.status === "pending").length}</div>
                  </div>
                  <div className="surface rounded-xl p-4 border border-border">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Processing</div>
                    <div className="text-2xl font-semibold tabular-nums">{orders.filter((o) => o.status === "processing").length}</div>
                  </div>
                </div>
              </SectionPanel>
            </div>
          )}

          <SectionPanel
            title="Recent orders"
            description={role === "admin" ? "Latest activity across the network" : "Your recent orders"}
            action={
              <Link to="/app/orders">
                <Button variant="outline" size="sm" className="h-7 text-xs border-border bg-surface">
                  View all
                </Button>
              </Link>
            }
          >
            <div className="overflow-x-auto -mx-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="text-left font-medium px-4 py-2">Order</th>
                    <th className="text-left font-medium px-4 py-2">Items</th>
                    <th className="text-left font-medium px-4 py-2">Total</th>
                    <th className="text-left font-medium px-4 py-2">Status</th>
                    <th className="text-left font-medium px-4 py-2">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 8).map((o) => (
                    <tr
                      key={o.id}
                      className="border-b border-border last:border-0 hover:bg-surface-2/50 cursor-pointer"
                      onClick={() => window.location.href = `/app/orders/${o.id}`}
                    >
                      <td className="px-4 py-2.5 font-mono text-[11px]">{o.id}</td>
                      <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{o.items?.length || 0}</td>
                      <td className="px-4 py-2.5 tabular-nums">Rs {(o.total || 0).toLocaleString()}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={o.paymentStatus} />
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                        No orders to display
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionPanel>
        </>
      )}

      {role === "delivery" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <StatCard
              label="Total Shipments"
              value={shipments.length.toString()}
              icon={Truck}
            />
            <StatCard
              label="Active"
              value={activeShipments.toString()}
              icon={Navigation}
            />
            <StatCard
              label="Delivered"
              value={shipments.filter((s) => s.status === "delivered").length.toString()}
              icon={Package}
            />
          </div>

          <SectionPanel
            title="My Shipments"
            description="Assigned deliveries"
            action={
              <Link to="/app/deliveries">
                <Button variant="outline" size="sm" className="h-7 text-xs border-border bg-surface">
                  View all
                </Button>
              </Link>
            }
          >
            {shipments.length > 0 ? (
              <div className="space-y-2">
                {shipments.slice(0, 8).map((s: any) => (
                  <Link
                    key={s.id}
                    to="/app/deliveries/$id"
                    params={{ id: s.id }}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface-2 hover:border-border-strong transition-colors"
                  >
                    <div className="h-8 w-8 rounded-md bg-primary/10 border border-primary/20 grid place-items-center shrink-0">
                      <Truck className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium">{s.id}</div>
                      <div className="text-[10px] text-muted-foreground">{s.origin} → {s.destination}</div>
                    </div>
                    <StatusBadge status={s.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground text-center py-6">
                No shipments assigned yet
              </div>
            )}
          </SectionPanel>
        </>
      )}
    </div>
  );
}
