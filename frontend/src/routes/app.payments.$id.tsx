import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/store";
import { PageHeader, SectionPanel, StatCard, StatusBadge } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  DollarSign,
  CreditCard,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Loader2,
  Package,
} from "lucide-react";
import api from "@/api/base";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/app/payments/$id")({
  component: PaymentDetail,
});

const PAYMENT_META: Record<
  string,
  { icon: typeof DollarSign; color: string; label: string; bg: string }
> = {
  succeeded: {
    icon: CheckCircle2,
    color: "text-success",
    label: "Succeeded",
    bg: "bg-success/10 border-success/30",
  },
  pending: {
    icon: Clock,
    color: "text-warning",
    label: "Pending",
    bg: "bg-warning/10 border-warning/30",
  },
  failed: {
    icon: XCircle,
    color: "text-destructive",
    label: "Failed",
    bg: "bg-destructive/10 border-destructive/30",
  },
};

function PaymentDetail() {
  const { id } = Route.useParams();
  const user = useAuth((s) => s.user);
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchPayment = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/payments/${id}`);
      setPayment(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to load payment details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayment();
  }, [id]);

  const downloadPDF = () => {
    if (!payment) return;
    
    const doc = new jsPDF() as any;
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Primary color
    doc.text("PHARMIX", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Official Payment Receipt", 105, 26, { align: "center" });
    
    // Horizontal Line
    doc.setDrawColor(220);
    doc.line(14, 32, 196, 32);

    // Basic Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Transaction Summary", 14, 45);
    
    const summaryData = [
      ["Transaction ID", payment.id],
      ["Order Reference", payment.orderId],
      ["Stripe Reference", payment.stripePaymentIntentId],
      ["Amount", `PKR ${payment.amount.toLocaleString()}`],
      ["Status", payment.status.toUpperCase()],
      ["Payment Method", payment.paymentMethod.toUpperCase()],
      ["Date", new Date(payment.createdAt).toLocaleString()]
    ];

    autoTable(doc, {
      startY: 50,
      body: summaryData,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }
    });

    // Pharmacy & Manufacturer Details
    const startY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.text("Stakeholder Details", 14, startY);

    const entitiesData = [
      ["Pharmacy", payment.pharmacy?.name || "N/A", payment.pharmacyId],
      ["Manufacturer", payment.manufacturer?.name || "N/A", payment.manufacturerId]
    ];

    autoTable(doc, {
      startY: startY + 5,
      head: [["Role", "Entity Name", "Entity ID"]],
      body: entitiesData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });

    // Order Items
    if (payment.order && payment.order.items) {
      const itemsY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text("Order Items", 14, itemsY);

      const itemsData = payment.order.items.map((it: any) => [
        it.name,
        it.qty,
        `Rs ${it.price.toLocaleString()}`,
        `Rs ${(it.price * it.qty).toLocaleString()}`
      ]);

      autoTable(doc, {
        startY: itemsY + 5,
        head: [["Product", "Qty", "Unit Price", "Subtotal"]],
        body: itemsData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        foot: [["", "", "Shipping Fee", `Rs ${(payment.order.shippingFee || 0).toLocaleString()}`], ["", "", "Total", `Rs ${payment.order.total.toLocaleString()}`]],
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
      });
    }

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("This is a computer-generated receipt and does not require a physical signature.", 105, finalY, { align: "center" });
    doc.text("© 2026 Pharmix B2B Platform. All rights reserved.", 105, finalY + 5, { align: "center" });

    doc.save(`Pharmix_Receipt_${payment.id}.pdf`);
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

  if (!payment) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">
        <Link to="/app/payments" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-3 w-3" /> Back to Payments
        </Link>
        <div className="text-center py-20 border border-dashed rounded-xl border-border">
          <CreditCard className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
          <div className="text-sm text-muted-foreground">Transaction record not found.</div>
        </div>
      </div>
    );
  }

  const paymentMeta = PAYMENT_META[payment.status] || PAYMENT_META.pending;
  const PaymentIcon = paymentMeta.icon;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link to="/app/payments" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3 w-3" /> Back to Payments
        </Link>
        <Button size="sm" className="h-8 bg-primary gap-1.5 text-xs" onClick={downloadPDF}>
          <Download className="h-3.5 w-3.5" /> Download Receipt
        </Button>
      </div>

      <PageHeader title={payment.id} description={`Transaction for order ${payment.orderId}`}>
        <StatusBadge status={payment.status === 'succeeded' ? 'paid' : payment.status} />
      </PageHeader>

      <div className={`rounded-xl border p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 ${paymentMeta.bg}`}>
        <div className="flex items-center gap-4 min-w-0">
          <div className={`h-12 w-12 rounded-full border-2 grid place-items-center shrink-0 ${paymentMeta.bg}`}>
            <PaymentIcon className={`h-6 w-6 ${paymentMeta.color}`} />
          </div>
          <div className="min-w-0">
            <div className={`text-base font-semibold ${paymentMeta.color}`}>{paymentMeta.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5 font-mono truncate" title={payment.stripePaymentIntentId}>
              Stripe ID: {payment.stripePaymentIntentId}
            </div>
          </div>
        </div>
        <div className="sm:ml-auto text-left sm:text-right border-t sm:border-t-0 border-border/10 pt-3 sm:pt-0 shrink-0">
          <div className="text-2xl font-bold tabular-nums">Rs {payment.amount.toLocaleString()}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
            {new Date(payment.createdAt).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Amount" value={`Rs ${payment.amount.toLocaleString()}`} icon={DollarSign} />
        <StatCard label="Method" value={payment.paymentMethod.toUpperCase()} icon={CreditCard} />
        <StatCard label="Order Ref" value={payment.orderId} icon={Package} />
        <StatCard label="Status" value={payment.status} icon={CheckCircle2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <SectionPanel title="Transaction Meta" description="Detailed payment attributes">
          <div className="space-y-3">
            {[
              { label: "Internal Payment ID", value: payment.id, mono: true },
              { label: "Stripe Intent ID", value: payment.stripePaymentIntentId, mono: true },
              { label: "Order Reference", value: payment.orderId, mono: true },
              { label: "Currency", value: payment.currency.toUpperCase() },
              { label: "Gateway Status", value: payment.status },
              { label: "Captured At", value: new Date(payment.createdAt).toLocaleString() },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-[11px] text-muted-foreground">{row.label}</span>
                <span className={`text-xs font-medium ${row.mono ? "font-mono text-[11px]" : ""}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel title="Stakeholders" description="Parties involved in this transaction">
          <div className="space-y-6">
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase mb-2 tracking-tighter flex items-center gap-1.5">
                <Building2 className="h-3 w-3" /> Paying Party (Pharmacy)
              </div>
              <div className="bg-surface-2 p-3 rounded-lg border border-border">
                <div className="text-sm font-medium">{payment.pharmacy?.name || "N/A"}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{payment.pharmacyId}</div>
                <div className="text-[11px] text-muted-foreground">{payment.pharmacy?.email}</div>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase mb-2 tracking-tighter flex items-center gap-1.5">
                <Building2 className="h-3 w-3" /> Receiving Party (Manufacturer)
              </div>
              <div className="bg-surface-2 p-3 rounded-lg border border-border">
                <div className="text-sm font-medium">{payment.manufacturer?.name || "N/A"}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{payment.manufacturerId}</div>
                <div className="text-[11px] text-muted-foreground">{payment.manufacturer?.email}</div>
              </div>
            </div>
          </div>
        </SectionPanel>
      </div>

      {payment.order && (
        <div className="mt-3">
          <SectionPanel title="Order Items" description={`${payment.order.items.length} products in this transaction`}>
            <div className="space-y-2">
              {payment.order.items.map((it: any) => (
                <div key={it.medicineId} className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{it.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{it.medicineId}</span>
                  </div>
                  <div className="flex items-center gap-8 text-right">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Qty</span>
                      <span className="text-sm font-semibold">{it.qty}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Price</span>
                      <span className="text-sm font-semibold">Rs {it.price.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col min-w-[80px]">
                      <span className="text-[10px] text-primary uppercase tracking-wider font-semibold">Subtotal</span>
                      <span className="text-sm font-bold text-primary">Rs {(it.price * it.qty).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-border space-y-1.5 text-right">
                <div className="text-xs text-muted-foreground">
                  Shipping Fee: <span className="font-medium text-foreground ml-1">Rs {(payment.order.shippingFee || 0).toLocaleString()}</span>
                </div>
                <div className="text-sm font-bold">
                  Order Total: <span className="text-primary ml-1">Rs {payment.order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </SectionPanel>
        </div>
      )}
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded ${className}`} />;
}
