import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, SectionPanel, StatusBadge } from "@/components/ui-kit";
import { Truck, MapPin, Radio, Navigation, Clock, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/api/base";
import { toast } from "sonner";

export const Route = createFileRoute("/app/tracking/")({ component: TrackingIndex });

function TrackingIndex() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/shipments");
        setShipments(res.data);
      } catch (error: any) {
        toast.error(error.response?.data?.error || "Failed to load shipments");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const activeShipments = shipments.filter((s) => s.status === "in_transit");

  if (loading) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Live Tracking"
        description={`${activeShipments.length} shipment${activeShipments.length !== 1 ? "s" : ""} currently in transit`}
      />

      {activeShipments.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {activeShipments.map((s) => (
            <Link
              key={s.id}
              to="/app/tracking/$id"
              params={{ id: s.id }}
              className="surface rounded-xl p-5 hover:border-border-strong transition-colors cursor-pointer block group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 grid place-items-center relative">
                    <Truck className="h-4 w-4 text-primary" />
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-success border-2 border-canvas pulse-dot" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-primary">{s.id}</div>
                    <div className="text-[11px] text-muted-foreground">Order {s.orderId}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={s.status} />
                  <Radio className="h-3.5 w-3.5 text-success opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs mb-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="truncate">{s.origin}</span>
                </div>
                <div className="flex-1 border-t border-dashed border-border" />
                <div className="flex items-center gap-1.5">
                  <span className="truncate">{s.destination}</span>
                  <div className="h-2 w-2 rounded-full bg-success" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div className="p-2 rounded-md bg-surface-2 border border-border">
                  <div className="text-muted-foreground mb-0.5">From</div>
                  <div className="font-medium truncate">{s.manufacturerName}</div>
                </div>
                <div className="p-2 rounded-md bg-surface-2 border border-border">
                  <div className="text-muted-foreground mb-0.5">To</div>
                  <div className="font-medium truncate">{s.pharmacyName}</div>
                </div>
                <div className="p-2 rounded-md bg-surface-2 border border-border">
                  <div className="text-muted-foreground mb-0.5">Rider</div>
                  <div className="font-medium truncate">{s.riderName}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <SectionPanel>
          <div className="flex flex-col items-center py-16 text-center">
            <div className="h-14 w-14 rounded-full bg-surface-2 border border-border grid place-items-center mb-4">
              <Truck className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <div className="text-sm font-medium mb-1">No active deliveries</div>
            <div className="text-xs text-muted-foreground max-w-xs">
              There are no shipments currently in transit. Shipments with "in transit" status will appear here for live tracking.
            </div>
          </div>
        </SectionPanel>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
        <div className="surface rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <Navigation className="h-3.5 w-3.5" /> Active vehicles
          </div>
          <div className="text-2xl font-semibold tabular-nums">{activeShipments.length}</div>
        </div>
        <div className="surface rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <Clock className="h-3.5 w-3.5" /> Total shipments
          </div>
          <div className="text-2xl font-semibold tabular-nums">{shipments.length}</div>
        </div>
        <div className="surface rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <Package className="h-3.5 w-3.5" /> Delivered
          </div>
          <div className="text-2xl font-semibold tabular-nums">{shipments.filter((s) => s.status === "delivered").length}</div>
        </div>
      </div>
    </div>
  );
}
