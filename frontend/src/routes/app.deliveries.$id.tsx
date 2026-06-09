import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/store";
import { PageHeader, SectionPanel, StatCard, StatusBadge } from "@/components/ui-kit";
import {
  ArrowLeft,
  Truck,
  Package,
  MapPin,
  CheckCircle2,
  Building2,
  DollarSign,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/api/base";
import { toast } from "sonner";

export const Route = createFileRoute("/app/deliveries/$id")({
  component: DeliveryDetail,
});

const STATUS_META: Record<string, { icon: typeof Truck; color: string; label: string }> = {
  pickup: { icon: Package, color: "text-warning", label: "Pickup" },
  in_transit: { icon: Truck, color: "text-info", label: "In Transit" },
  delivered: { icon: CheckCircle2, color: "text-success", label: "Delivered" },
};

function DeliveryDetail() {
  const { id } = Route.useParams();
  const user = useAuth((s) => s.user);
  const role = user?.role || "admin";
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchShipment = async () => {
    try {
      const res = await api.get(`/shipments/${id}`);
      setShipment(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to load delivery");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipment();
  }, [id]);

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setUpdating(true);
      await api.patch(`/shipments/${id}/status`, { status: newStatus });
      toast.success("Shipment status updated");
      await fetchShipment();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-3">
          <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">
        <Link to="/app/deliveries" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="h-3 w-3" /> Back to Deliveries
        </Link>
        <div className="text-center py-20">
          <Truck className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <div className="text-sm text-muted-foreground">Delivery not found or you don't have access.</div>
        </div>
      </div>
    );
  }

  const statusMeta = STATUS_META[shipment.status] || STATUS_META.pickup;
  const StatusIcon = statusMeta.icon;
  const canUpdate = role === "delivery" || role === "admin";

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Link to="/app/deliveries" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="h-3 w-3" /> Back to Deliveries
      </Link>

      <PageHeader
        title={shipment.id}
        description={`${shipment.origin} → ${shipment.destination}`}
      >
        <StatusBadge status={shipment.status} />
        {(shipment.status === "in_transit" || shipment.status === "delivered_pending" || shipment.status === "delivered") && (
          <Link to="/app/tracking/$id" params={{ id: shipment.id }}>
            <Button size="sm" variant="outline" className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/5">
              <Radio className={`h-3.5 w-3.5 mr-1.5 ${shipment.status !== 'delivered' ? 'pulse-dot text-success' : ''}`} />
              {shipment.status === "delivered" ? "Track History" : "Live Tracking"}
            </Button>
          </Link>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Status" value={statusMeta.label} icon={StatusIcon} />
        <StatCard label="Items" value={shipment.orderItems?.toString() || "—"} icon={Package} />
        <StatCard label="Order Total" value={shipment.orderTotal ? `Rs ${shipment.orderTotal.toLocaleString()}` : "—"} icon={DollarSign} />
        <StatCard label="Created" value={new Date(shipment.createdAt).toLocaleDateString()} icon={MapPin} />
      </div>

      {canUpdate && shipment.status !== "delivered" && (
        <SectionPanel title="Update Status" description="Progress this shipment" className="mb-3">
          <div className="flex flex-wrap gap-2 py-1">
            {Object.keys(STATUS_META).map((s) => (
              <button
                key={s}
                disabled={updating || shipment.status === s}
                onClick={() => handleStatusUpdate(s)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all border ${
                  shipment.status === s
                    ? "bg-primary/10 border-primary/40 text-primary cursor-default"
                    : "bg-surface-2 border-border text-muted-foreground hover:text-foreground hover:border-border-strong disabled:opacity-50"
                }`}
              >
                {STATUS_META[s].label}
              </button>
            ))}
          </div>
        </SectionPanel>
      )}

      <SectionPanel title="Route" className="mb-3">
        <div className="flex items-center gap-0 py-4">
          {(["pickup", "in_transit", "delivered"] as const).map((step, i) => {
            const meta = STATUS_META[step];
            const Icon = meta.icon;
            const steps = ["pickup", "in_transit", "delivered"];
            const currentIdx = steps.indexOf(shipment.status);
            const isCompleted = i <= currentIdx;
            const isCurrent = i === currentIdx;

            return (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`h-8 w-8 rounded-full border-2 grid place-items-center ${isCurrent ? "border-primary bg-primary/15" : isCompleted ? "border-success bg-success/15" : "border-border bg-surface-2"}`}>
                    <Icon className={`h-3.5 w-3.5 ${isCurrent ? "text-primary" : isCompleted ? "text-success" : "text-muted-foreground/50"}`} />
                  </div>
                  <span className={`text-[10px] font-medium ${isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground/60"}`}>
                    {meta.label}
                  </span>
                </div>
                {i < 2 && (
                  <div className={`flex-1 h-0.5 mx-2 mt-[-18px] rounded-full ${i < currentIdx ? "bg-success" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>
      </SectionPanel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <SectionPanel title="Shipment Details">
          <div className="space-y-3">
            {[
              { label: "Shipment ID", value: shipment.id, mono: true },
              { label: "Order ID", value: shipment.orderId, mono: true },
              { label: "Rider", value: shipment.riderName },
              { label: "Origin", value: shipment.origin },
              { label: "Destination", value: shipment.destination },
              { label: "Status", value: shipment.status },
              { label: "Created", value: new Date(shipment.createdAt).toLocaleString() },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-[11px] text-muted-foreground">{row.label}</span>
                <span className={`text-xs font-medium ${row.mono ? "font-mono text-[11px]" : ""}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel title="Manufacturer" description={shipment.manufacturerName || "—"}>
          <div className="space-y-3">
            {[
              { label: "Name", value: shipment.manufacturerName },
              { label: "ID", value: shipment.manufacturerId, mono: true },
              { label: "Email", value: shipment.manufacturerEmail || "N/A" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-[11px] text-muted-foreground">{row.label}</span>
                <span className={`text-xs font-medium ${row.mono ? "font-mono text-[11px]" : ""}`}>{row.value}</span>
              </div>
            ))}
            {role === "admin" && (
              <Link to="/app/users/manufacturer/$id" params={{ id: shipment.manufacturerId }} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-2">
                <Building2 className="h-3 w-3" /> View profile
              </Link>
            )}
          </div>
        </SectionPanel>

        <SectionPanel title="Pharmacy" description={shipment.pharmacyName || "—"}>
          <div className="space-y-3">
            {[
              { label: "Name", value: shipment.pharmacyName },
              { label: "ID", value: shipment.pharmacyId, mono: true },
              { label: "Email", value: shipment.pharmacyEmail || "N/A" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-[11px] text-muted-foreground">{row.label}</span>
                <span className={`text-xs font-medium ${row.mono ? "font-mono text-[11px]" : ""}`}>{row.value}</span>
              </div>
            ))}
            {role === "admin" && (
              <Link to="/app/users/pharmacy/$id" params={{ id: shipment.pharmacyId }} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-2">
                <Building2 className="h-3 w-3" /> View profile
              </Link>
            )}
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}
