import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, SectionPanel, StatCard, StatusBadge } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { CreditCard, DollarSign, TrendingUp, Download, Receipt, Loader2 } from "lucide-react";
import api from "@/api/base";
import { toast } from "sonner";
import type { Payment } from "@/types";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/app/payments/")({ component: PaymentsIndex });

function PaymentsIndex() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/payments");
      setPayments(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const totalProcessed = payments.reduce((a, b) => a + b.amount, 0);
  const successfulPayments = payments.filter((p) => p.status === "succeeded");
  const pendingTotal = payments
    .filter((p) => p.status === "pending")
    .reduce((a, b) => a + b.amount, 0);

  const downloadPDF = (payment?: Payment) => {
    const doc = new jsPDF() as any;
    
    // Header
    doc.setFontSize(20);
    doc.text("Pharmix - Payment Receipt", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    if (payment) {
      // Single Payment PDF - High Fidelity Template (Matches Detail Page)
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

      // Stakeholder Details
      const startY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(12);
      doc.text("Stakeholder Details", 14, startY);

      const entitiesData = [
        ["Pharmacy", (payment as any).pharmacy?.name || "N/A", payment.pharmacyId],
        ["Manufacturer", (payment as any).manufacturer?.name || "N/A", payment.manufacturerId]
      ];

      autoTable(doc, {
        startY: startY + 5,
        head: [["Role", "Entity Name", "Entity ID"]],
        body: entitiesData,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] }
      });

      // Order Items
      if ((payment as any).order && (payment as any).order.items) {
        const itemsY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("Order Items", 14, itemsY);

        const itemsData = (payment as any).order.items.map((it: any) => [
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
          foot: [
            ["", "", "Shipping Fee", `Rs ${((payment as any).order.shippingFee || 0).toLocaleString()}`], 
            ["", "", "Total", `Rs ${((payment as any).order.total || payment.amount).toLocaleString()}`]
          ],
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
    } else {
      // All Payments Report
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Transaction History Report", 14, 45);
      
      const tableData = payments.map(p => [
        p.id,
        p.orderId,
        `Rs ${p.amount.toLocaleString()}`,
        p.paymentMethod.toUpperCase(),
        p.status.toUpperCase(),
        new Date(p.createdAt).toLocaleDateString()
      ]);

      autoTable(doc, {
        startY: 50,
        head: [["Txn ID", "Order", "Amount", "Method", "Status", "Date"]],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] }
      });
      
      doc.save("Pharmix_Payments_Report.pdf");
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader title="Payments" description="Transactions, invoices & payout history" />
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Total processed"
          value={`Rs ${totalProcessed.toLocaleString()}`}
          icon={DollarSign}
        />
        <StatCard
          label="Success Rate"
          value={
            payments.length > 0 ? `${((successfulPayments.length / payments.length) * 100).toFixed(1)}%` : "—"
          }
          icon={TrendingUp}
        />
        <StatCard label="Refunds" value="Rs 0" icon={CreditCard} />
        <StatCard label="Pending" value={`Rs ${pendingTotal.toLocaleString()}`} icon={Receipt} />
      </div>

      <SectionPanel
        title="Transactions"
        description="Real-time payment history"
        action={
          <Button 
            size="sm" 
            variant="outline" 
            className="h-7 text-xs border-border bg-surface"
            disabled={payments.length === 0}
            onClick={() => downloadPDF()}
          >
            <Download className="h-3 w-3 mr-1" /> Export All
          </Button>
        }
      >
        <div className="overflow-x-auto -mx-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2 opacity-20" />
              <div className="text-sm">Fetching transaction history...</div>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="text-left font-medium px-4 py-2">Txn ID</th>
                  <th className="text-left font-medium px-4 py-2">Order</th>
                  <th className="text-left font-medium px-4 py-2">Amount</th>
                  <th className="text-left font-medium px-4 py-2">Method</th>
                  <th className="text-left font-medium px-4 py-2">Status</th>
                  <th className="text-left font-medium px-4 py-2">Date</th>
                  <th className="text-right font-medium px-4 py-2">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-2/50 transition-colors group">
                    <td className="px-4 py-2.5 font-mono text-[11px]">
                      <Link 
                        to="/app/payments/$id" 
                        params={{ id: p.id }}
                        className="text-primary hover:underline"
                      >
                        {p.id}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px]">{p.orderId}</td>
                    <td className="px-4 py-2.5 tabular-nums font-medium">Rs {p.amount.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-muted-foreground capitalize">
                      {p.paymentMethod}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={p.status === 'succeeded' ? 'paid' : p.status} />
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[11px] hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={() => downloadPDF(p)}
                      >
                        <Download className="h-3 w-3 mr-1" /> PDF
                      </Button>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center">
                        <CreditCard className="h-8 w-8 mb-2 opacity-10" />
                        <div>No transactions found</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </SectionPanel>
    </div>
  );
}
