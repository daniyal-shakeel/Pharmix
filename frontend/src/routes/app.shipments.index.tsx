import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, SectionPanel, StatusBadge } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Truck, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/api/base";
import { toast } from "sonner";

type ShipmentsSearch = { q?: string };
export const Route = createFileRoute("/app/shipments/")({
  validateSearch: (search: Record<string, unknown>): ShipmentsSearch => {
    return { q: search.q as string | undefined };
  },
  component: ShipmentsIndex,
});

function ShipmentsIndex() {
  const search = Route.useSearch();
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

  const filtered = search.q
    ? shipments.filter(
        (s) =>
          s.id.includes(search.q!) ||
          s.orderId.includes(search.q!) ||
          s.manufacturerId === search.q ||
          s.riderId === search.q
      )
    : shipments;

  if (loading) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader title="Shipments" description="In-flight & completed shipments">
        <Link to="/app/tracking">
          <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90">
            <MapPin className="h-3.5 w-3.5 mr-1" /> Live map
          </Button>
        </Link>
      </PageHeader>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtered.map((s) => (
          <Link
            key={s.id}
            to="/app/shipments/$id"
            params={{ id: s.id }}
            className="surface rounded-xl p-4 hover:border-border-strong transition-colors cursor-pointer block"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 grid place-items-center">
                  <Truck className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium text-primary">{s.id}</div>
                  <div className="text-[11px] text-muted-foreground">
                    Order {s.orderId} · {s.riderName}
                  </div>
                </div>
              </div>
              <StatusBadge status={s.status} />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <span className="truncate">{s.origin}</span>
              <div className="flex-1 border-t border-dashed border-border" />
              <span className="truncate">{s.destination}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">{s.manufacturerName}</span>
              <span className="text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-20 text-sm text-muted-foreground">
            No shipments to display
          </div>
        )}
      </div>
    </div>
  );
}
