import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, SectionPanel } from "@/components/ui-kit";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@/store";
import api from "@/api/base";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/app/analytics")({ component: Analytics });

const ts = {
  backgroundColor: "oklch(0.18 0.014 270)",
  border: "1px solid oklch(1 0 0 / 0.08)",
  borderRadius: 8,
  fontSize: 11,
};

function Analytics() {
  const user = useAuth((s) => s.user);
  const isAdmin = user?.role === "admin";
  const isManufacturer = user?.role === "manufacturer";
  const isPharmacy = user?.role === "pharmacy";
  const isAuthorized = isAdmin || isManufacturer || isPharmacy;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthorized) {
      const fetchAnalytics = async () => {
        try {
          let endpoint = "/analytics/manufacturer";
          if (isAdmin) endpoint = "/analytics/admin";
          else if (isPharmacy) endpoint = "/analytics/pharmacy";
          
          const res = await api.get(endpoint);
          setData(res.data);
        } catch (error: any) {
          toast.error(error.response?.data?.error || "Failed to load analytics");
        } finally {
          setLoading(false);
        }
      };
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [isAuthorized, isAdmin, isPharmacy]);

  if (loading) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto space-y-6">
        <PageHeader title="Analytics" description="Loading deep insights..." />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <SectionPanel key={i} title="Loading...">
              <Skeleton className="h-[260px] w-full rounded-xl" />
            </SectionPanel>
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">
        <PageHeader title="Analytics" description="Access restricted" />
        <div className="text-center py-20 text-muted-foreground border border-dashed rounded-xl">
          Real-time analytics are currently only available for Admin, Manufacturer, and Pharmacy accounts.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader title="Analytics" description={`${isAdmin ? "Global" : isPharmacy ? "Procurement" : "Operational"} insights (Last updated: ${data?.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : "N/A"})`} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <SectionPanel title={isPharmacy ? "Spending" : "Revenue"} description={`${isPharmacy ? 'Monthly cost' : 'Monthly trend'} (Last 6 Months)`}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data?.revenueData || []} margin={{ left: -20, right: 8 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
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
              <Tooltip contentStyle={ts} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#5e6ad2"
                strokeWidth={2}
                fill="url(#g1)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </SectionPanel>
        <SectionPanel title="Orders" description="Volume trend (Last 6 Months)">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data?.revenueData || []} margin={{ left: -20, right: 8 }}>
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
              <Tooltip contentStyle={ts} />
              <Line type="monotone" dataKey="orders" stroke="#7ac8a4" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </SectionPanel>
        <SectionPanel title={isPharmacy ? "Category spending" : "Category demand"} description={`${isPharmacy ? 'Spending' : 'Top selling'} segments (${isPharmacy ? 'Rs' : 'Items Sold'})`}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.categoryData || []} margin={{ left: -20, right: 8 }}>
              <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
              <XAxis
                dataKey="category"
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
              <Tooltip contentStyle={ts} />
              <Bar dataKey="demand" fill="#5e6ad2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionPanel>
        <SectionPanel title="Delivery SLA" description="On-time vs delayed (Last 7 Days)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.deliveryData || []} margin={{ left: -20, right: 8 }}>
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
              <Tooltip contentStyle={ts} />
              <Bar dataKey="onTime" stackId="a" fill="#5e6ad2" radius={[0, 0, 0, 0]} />
              <Bar dataKey="delayed" stackId="a" fill="#d97373" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionPanel>
      </div>
    </div>
  );
}

