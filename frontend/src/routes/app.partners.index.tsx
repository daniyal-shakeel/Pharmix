import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, StatusBadge } from "@/components/ui-kit";
import { Building2, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import api from "@/api/base";
import { toast } from "sonner";

export const Route = createFileRoute("/app/partners/")({ component: PartnersListing });

interface Partner {
  id: string;
  name: string;
  type: string;
  slug: string;
  region: string;
  skus: number;
  status: "active" | "inactive" | "pending";
}

function PartnersListing() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const res = await api.get("/partners");
        setPartners(res.data);
      } catch (error: any) {
        toast.error(error.response?.data?.error || "Failed to load partners");
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, []);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Partners"
        description={loading ? "Loading partners..." : `${partners.length} active partners across the network`}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="surface rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <div className="pt-3 border-t border-border flex justify-between">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 w-8" />
              </div>
            </div>
          ))
        ) : (
          partners.map((p) => (
            <div key={`${p.type}-${p.id}`} className="surface rounded-xl p-4 hover:border-border-strong transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 grid place-items-center">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div className="text-sm font-medium">{p.name || "Unknown Entity"}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {p.type || "N/A"} · {p.region || "N/A"}
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">
                  {p.type === "Delivery Partner" ? "Deliveries" : "SKUs"}
                </span>
                <span className="font-medium tabular-nums">{(p.skus || 0).toLocaleString()}</span>
              </div>
              <div className="mt-4">
                <Link 
                  to="/app/partners/$type/$id" 
                  params={{ type: p.slug, id: p.id }}
                >
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full h-8 text-[11px] font-medium gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Details
                  </Button>
                </Link>
              </div>
            </div>
          ))
        )}
        {!loading && partners.length === 0 && (
          <div className="col-span-3 text-center py-20 text-sm text-muted-foreground">
            No partners to display
          </div>
        )}
      </div>
    </div>
  );
}
