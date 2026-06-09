import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, SectionPanel, StatusBadge } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Download, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/api/base";
import { toast } from "sonner";

type OrdersSearch = { q?: string };
export const Route = createFileRoute("/app/orders/")({
  validateSearch: (search: Record<string, unknown>): OrdersSearch => {
    return { q: search.q as string | undefined };
  },
  component: OrdersIndex,
});

function OrdersIndex() {
  const search = Route.useSearch();
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await api.get("/orders");
        setAllOrders(res.data);
      } catch (error: any) {
        toast.error(error.response?.data?.error || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);
  
  const orders = search.q 
    ? allOrders.filter(o => 
        o.id.toLowerCase().includes(search.q!.toLowerCase()) || 
        o.pharmacyId.toLowerCase().includes(search.q!.toLowerCase()) ||
        o.manufacturerId.toLowerCase().includes(search.q!.toLowerCase())
      )
    : allOrders;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader title="Orders" description={loading ? "Loading..." : `${orders.length} total orders`}>
        <Button variant="outline" size="sm" className="h-8 text-xs border-border bg-surface">
          <Filter className="h-3.5 w-3.5 mr-1" /> Filter
        </Button>
        <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90">
          <Download className="h-3.5 w-3.5 mr-1" /> Export
        </Button>
      </PageHeader>
      <SectionPanel>
        <div className="overflow-x-auto -mx-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="text-left font-medium px-4 py-2">Order ID</th>
                <th className="text-left font-medium px-4 py-2">Pharmacy</th>
                <th className="text-left font-medium px-4 py-2">Items</th>
                <th className="text-left font-medium px-4 py-2">Total</th>
                <th className="text-left font-medium px-4 py-2">Status</th>
                <th className="text-left font-medium px-4 py-2">Delivery</th>
                <th className="text-left font-medium px-4 py-2">Payment</th>
                <th className="text-left font-medium px-4 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-4 py-2.5"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-2.5"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-2.5"><Skeleton className="h-4 w-8" /></td>
                    <td className="px-4 py-2.5"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-2.5"><Skeleton className="h-6 w-16 rounded-full" /></td>
                    <td className="px-4 py-2.5"><Skeleton className="h-6 w-16 rounded-full" /></td>
                    <td className="px-4 py-2.5"><Skeleton className="h-6 w-16 rounded-full" /></td>
                    <td className="px-4 py-2.5"><Skeleton className="h-4 w-20" /></td>
                  </tr>
                ))
              ) : (
                orders.map((o) => (
                  <Link key={o.id} to="/app/orders/$id" params={{ id: o.id }} className="contents">
                    <tr className="border-b border-border last:border-0 hover:bg-surface-2/50 cursor-pointer transition-colors">
                      <td className="px-4 py-2.5 font-mono text-[11px] text-primary">{o.id}</td>
                      <td className="px-4 py-2.5 font-mono text-[10px]">{o.pharmacyId}</td>
                      <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{o.items.length}</td>
                      <td className="px-4 py-2.5 tabular-nums">Rs {o.total.toFixed(2)}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={o.deliveryStatus || 'pending'} />
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={o.paymentStatus} />
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {new Date(o.date || o.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  </Link>
                ))
              )}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    No orders to display
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionPanel>
    </div>
  );
}
