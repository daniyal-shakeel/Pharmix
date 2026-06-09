import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/store";
import { PageHeader, SectionPanel, StatCard, StatusBadge } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Package,
  DollarSign,
  ShoppingCart,
  Truck,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/api/base";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/app/orders/$id")({
  component: OrderDetail,
});

const STATUS_STEPS = ["pending", "processing", "shipped", "delivered"] as const;

const STATUS_META: Record<string, { icon: typeof Package; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-warning", label: "Pending" },
  processing: { icon: Loader2, color: "text-info", label: "Processing" },
  shipped: { icon: Truck, color: "text-primary", label: "Shipped" },
  delivered: { icon: CheckCircle2, color: "text-success", label: "Delivered" },
  cancelled: { icon: XCircle, color: "text-destructive", label: "Cancelled" },
};

const PAYMENT_META: Record<string, { color: string; label: string }> = {
  paid: { color: "text-success", label: "Paid" },
  pending: { color: "text-warning", label: "Pending" },
  failed: { color: "text-destructive", label: "Failed" },
};

function OrderDetail() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const user = useAuth((s) => s.user);
  const role = user?.role;

  const [riderDialogOpen, setRiderDialogOpen] = useState(false);
  const [riders, setRiders] = useState<any[]>([]);
  const [selectedRider, setSelectedRider] = useState("");
  const [loadingRiders, setLoadingRiders] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchLinkedRiders = async (manufacturerId: string) => {
    try {
      setLoadingRiders(true);
      const res = await api.get(`/shipments/riders/${manufacturerId}`);
      setRiders(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to fetch riders");
    } finally {
      setLoadingRiders(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (newStatus === "shipped") {
      await fetchLinkedRiders(order.manufacturerId);
      setSelectedRider("");
      setRiderDialogOpen(true);
      return;
    }

    try {
      setUpdating(true);
      await api.patch(`/orders/${id}/status`, { status: newStatus });
      toast.success("Order status updated");
      await fetchOrder();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmShip = async () => {
    if (!selectedRider) {
      toast.error("Please select a rider");
      return;
    }
    try {
      setUpdating(true);
      await api.patch(`/orders/${id}/status`, { status: "shipped", riderId: selectedRider });
      toast.success("Order shipped and rider assigned");
      setRiderDialogOpen(false);
      await fetchOrder();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to ship order");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto space-y-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">
        <Link
          to="/app/orders"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Orders
        </Link>
        <div className="text-center py-20">
          <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <div className="text-sm text-muted-foreground">
            Order not found or you don't have access to this order.
          </div>
        </div>
      </div>
    );
  }

  const statusMeta = STATUS_META[order.status] || STATUS_META.pending;
  const paymentMeta = PAYMENT_META[order.paymentStatus] || PAYMENT_META.pending;
  const StatusIcon = statusMeta.icon;

  const currentStepIndex =
    order.status === "cancelled"
      ? -1
      : STATUS_STEPS.indexOf(order.status as (typeof STATUS_STEPS)[number]);

  const canUpdate = (role === "manufacturer" && order.manufacturerId === user?.entityId) || role === "admin";

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Link
        to="/app/orders"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-3 w-3" /> Back to Orders
      </Link>

      <PageHeader
        title={order.id}
        description={`Order placed on ${new Date(order.date || order.createdAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`}
      >
        <StatusBadge status={order.status} />
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Items" value={order.items.length.toString()} icon={ShoppingCart} />
        <StatCard label="Total" value={`Rs ${order.total.toLocaleString()}`} icon={DollarSign} />
        <StatCard label="Payment" value={paymentMeta.label} icon={CreditCard} />
        <StatCard label="Status" value={statusMeta.label} icon={StatusIcon} />
      </div>

      {canUpdate && (
        <SectionPanel title="Manage Order" description="Update order status and fulfillment" className="mb-3">
          <div className="flex flex-wrap gap-2 py-1">
            {Object.keys(STATUS_META).map((s) => (
              <button
                key={s}
                disabled={updating || order.status === s}
                onClick={() => handleUpdateStatus(s)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all border ${
                  order.status === s
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

      <Dialog open={riderDialogOpen} onOpenChange={setRiderDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Rider for Shipment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 bg-info/10 border border-info/30 rounded-lg text-xs text-muted-foreground">
              Select a delivery partner linked to this manufacturer. The rider will be assigned to handle the shipment.
            </div>
            {loadingRiders ? (
              <div className="space-y-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ) : riders.length > 0 ? (
              <Select value={selectedRider} onValueChange={setSelectedRider}>
                <SelectTrigger className="h-9 bg-surface-2 border-border text-xs">
                  <SelectValue placeholder="Select a rider" />
                </SelectTrigger>
                <SelectContent>
                  {riders.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} ({r.id}) — {r.vehicle} · {r.zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-xs text-destructive text-center py-4 border border-dashed border-destructive/30 rounded-lg">
                No riders linked to this manufacturer. Link a delivery partner first in Settings.
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-9 text-xs"
                onClick={() => setRiderDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-9 text-xs bg-primary"
                disabled={!selectedRider || updating}
                onClick={handleConfirmShip}
              >
                {updating ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Shipping...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Truck className="h-3.5 w-3.5" /> Confirm & Ship
                  </div>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {order.status === "cancelled" && order.paymentStatus === "paid" && (
        <SectionPanel title="Payment Refund" description="This order was paid but is now cancelled" className="mb-3">
          <div className="flex items-center justify-between py-2">
            <div className="text-xs text-muted-foreground">
              Please contact the manufacturer to request your refund.
            </div>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-[11px] h-8"
              onClick={() => {
                const subject = encodeURIComponent(`Refund Request for Order ${order.id}`);
                const body = encodeURIComponent(`Hello,\n\nI am requesting a refund for order ${order.id} which has been cancelled.\n\nTotal Amount: Rs ${order.total}\n\nThank you.`);
                window.location.href = `mailto:${order.manufacturerEmail}?subject=${subject}&body=${body}`;
              }}
            >
              <CreditCard className="h-3.5 w-3.5 mr-1.5" /> Request Refund
            </Button>
          </div>
        </SectionPanel>
      )}

      {order.status !== "cancelled" ? (
        <SectionPanel
          title="Order Progress"
          description="Current fulfillment stage"
          className="mb-3"
        >
          <div className="flex items-center gap-0 py-4">
            {STATUS_STEPS.map((step, i) => {
              const stepMeta = STATUS_META[step];
              const StepIcon = stepMeta.icon;
              const isCompleted = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;

              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`h-9 w-9 rounded-full border-2 grid place-items-center transition-colors ${
                        isCurrent
                          ? "border-primary bg-primary/15"
                          : isCompleted
                            ? "border-success bg-success/15"
                            : "border-border bg-surface-2"
                      }`}
                    >
                      <StepIcon
                        className={`h-4 w-4 ${
                          isCurrent
                            ? "text-primary"
                            : isCompleted
                              ? "text-success"
                              : "text-muted-foreground/50"
                        }`}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-medium ${
                        isCurrent
                          ? "text-primary"
                          : isCompleted
                            ? "text-foreground"
                            : "text-muted-foreground/60"
                      }`}
                    >
                      {stepMeta.label}
                    </span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 mt-[-18px] rounded-full ${
                        i < currentStepIndex ? "bg-success" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </SectionPanel>
      ) : (
        <SectionPanel title="Order Cancelled" className="mb-3">
          <div className="flex items-center gap-3 py-3">
            <div className="h-9 w-9 rounded-full border-2 border-destructive bg-destructive/10 grid place-items-center">
              <XCircle className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <div className="text-sm font-medium text-destructive">
                This order has been cancelled
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Cancelled on {new Date(order.date || order.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </SectionPanel>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <SectionPanel title="Order Details" description="All order attributes">
          <div className="space-y-3">
            {[
              { label: "Order ID", value: order.id, mono: true },
              { label: "Manufacturer ID", value: order.manufacturerId, mono: true },
              { label: "Pharmacy ID", value: order.pharmacyId, mono: true },
              { label: "Total", value: `Rs ${order.total.toLocaleString()}` },
              { label: "Status", value: order.status },
              { label: "Payment Status", value: order.paymentStatus },
              { label: "Date", value: new Date(order.date || order.createdAt).toLocaleString() },
              { label: "Expected Delivery", value: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : "Pending Calculation" },
              { label: "Delivered At", value: order.deliveredAt ? new Date(order.deliveredAt).toLocaleString() : "Not Delivered Yet" },
              { 
                label: "Delivery Performance", 
                value: <StatusBadge status={order.deliveryStatus || 'pending'} /> 
              },
              { label: "Stripe ID", value: order.stripePaymentIntentId, mono: true },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
              >
                <span className="text-[11px] text-muted-foreground">{row.label}</span>
                <span className={`text-xs font-medium ${row.mono ? "font-mono text-[11px]" : ""}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel title="Order Items" description="Products in this order">
          <div className="space-y-2">
            {order.items.map((it: any) => (
              <div key={it.medicineId} className="flex items-center justify-between p-3 rounded-md border border-border bg-surface-2">
                <div>
                  <div className="text-sm font-medium">{it.name}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{it.medicineId}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium">Qty: {it.qty}</div>
                  <div className="text-[11px] text-muted-foreground tabular-nums">Rs {it.price.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}
