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

export const Route = createFileRoute("/app/shipments/$id")({
  component: ShipmentDetail,
});

const STATUS_META: Record<string, { icon: typeof Truck; color: string; label: string }> = {
  pickup: { icon: Package, color: "text-warning", label: "Pickup" },
  in_transit: { icon: Truck, color: "text-info", label: "In Transit" },
  delivered: { icon: CheckCircle2, color: "text-success", label: "Delivered" },
};

function ShipmentDetail() {
  const { id } = Route.useParams();
  const user = useAuth((s) => s.user);
  const role = user?.role || "admin";
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/shipments/${id}`);
        setShipment(res.data);
      } catch (error: any) {
        toast.error(error.response?.data?.error || "Failed to load shipment");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

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
        <Link to="/app/shipments" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="h-3 w-3" /> Back to Shipments
        </Link>
        <div className="text-center py-20">
          <Truck className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <div className="text-sm text-muted-foreground">Shipment not found or you don't have access.</div>
        </div>
      </div>
    );
  }

  const statusMeta = STATUS_META[shipment.status] || STATUS_META.pickup;
  const StatusIcon = statusMeta.icon;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Link to="/app/shipments" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="h-3 w-3" /> Back to Shipments
      </Link>

      <PageHeader
        title={shipment.id}
        description={`${shipment.origin} → ${shipment.destination} · Order ${shipment.orderId}`}
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

      <SectionPanel title="Route" description={`${shipment.origin} to ${shipment.destination}`} className="mb-3">
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
            <Link to="/app/orders/$id" params={{ id: shipment.orderId }} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-2">
              <Package className="h-3 w-3" /> View order
            </Link>
          </div>
        </SectionPanel>

        <SectionPanel title="Rider" description={shipment.riderName || "—"}>
          <div className="space-y-3">
            {[
              { label: "Name", value: shipment.riderName },
              { label: "ID", value: shipment.riderId, mono: true },
              { label: "Email", value: shipment.riderEmail || "N/A" },
              { label: "Phone", value: shipment.riderPhone || "N/A" },
              { label: "Vehicle", value: shipment.riderVehicle || "N/A" },
              { label: "Zone", value: shipment.riderZone || "N/A" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-[11px] text-muted-foreground">{row.label}</span>
                <span className={`text-xs font-medium ${row.mono ? "font-mono text-[11px]" : ""}`}>{row.value}</span>
              </div>
            ))}
            {role === "admin" && (
              <Link to="/app/users/delivery/$id" params={{ id: shipment.riderId }} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-2">
                <Truck className="h-3 w-3" /> View profile
              </Link>
            )}
          </div>
        </SectionPanel>

        <SectionPanel title="Entities">
          <div className="space-y-3">
            {[
              { label: "Manufacturer", value: shipment.manufacturerName },
              { label: "Manufacturer ID", value: shipment.manufacturerId, mono: true },
              { label: "Pharmacy", value: shipment.pharmacyName },
              { label: "Pharmacy ID", value: shipment.pharmacyId, mono: true },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-[11px] text-muted-foreground">{row.label}</span>
                <span className={`text-xs font-medium ${row.mono ? "font-mono text-[11px]" : ""}`}>{row.value}</span>
              </div>
            ))}
            {role === "admin" && (
              <div className="flex gap-3 mt-2">
                <Link to="/app/users/manufacturer/$id" params={{ id: shipment.manufacturerId }} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                  <Building2 className="h-3 w-3" /> Manufacturer
                </Link>
                <Link to="/app/users/pharmacy/$id" params={{ id: shipment.pharmacyId }} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                  <Building2 className="h-3 w-3" /> Pharmacy
                </Link>
              </div>
            )}
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}
