import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, SectionPanel, StatCard, StatusBadge } from "@/components/ui-kit";
import { Truck, CheckCircle2, MapPin, Navigation, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/api/base";
import { toast } from "sonner";

export const Route = createFileRoute("/app/deliveries/")({ component: DeliveriesIndex });

function DeliveriesIndex() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/shipments");
        setShipments(res.data);
      } catch (error: any) {
        toast.error(error.response?.data?.error || "Failed to load deliveries");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const completed = shipments.filter((s) => s.status === "delivered").length;
  const inTransit = shipments.filter((s) => s.status === "in_transit").length;

  if (loading) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader title="My Deliveries" description="Assigned routes & shipments" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Shipments" value={shipments.length.toString()} icon={Truck} />
        <StatCard label="Completed" value={completed.toString()} icon={CheckCircle2} />
        <StatCard label="In Transit" value={inTransit.toString()} icon={Navigation} />
        <StatCard label="Pickup" value={shipments.filter((s) => s.status === "pickup").length.toString()} icon={Package} />
      </div>

      <SectionPanel title="Assigned routes">
        <div className="space-y-2.5">
          {shipments.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface-2 hover:border-border-strong transition-colors"
            >
              <Link
                to="/app/deliveries/$id"
                params={{ id: s.id }}
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
              >
                <div className="h-9 w-9 rounded-md bg-primary/10 border border-primary/20 grid place-items-center shrink-0">
                  <Truck className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-primary">
                    {s.id} · {s.destination}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    From {s.origin} · Order {s.orderId}
                  </div>
                </div>
              </Link>
              <StatusBadge status={s.status} />
              {s.status === "in_transit" ? (
                <Link to="/app/tracking/$id" params={{ id: s.id }}>
                  <Button size="sm" variant="outline" className="h-7 text-[11px] border-border bg-surface gap-1">
                    <Navigation className="h-3 w-3" /> Navigate
                  </Button>
                </Link>
              ) : (
                <Link to="/app/deliveries/$id" params={{ id: s.id }}>
                  <Button size="sm" variant="outline" className="h-7 text-[11px] border-border bg-surface">
                    Details
                  </Button>
                </Link>
              )}
            </div>
          ))}
          {shipments.length === 0 && (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No deliveries assigned
            </div>
          )}
        </div>
      </SectionPanel>
    </div>
  );
}
