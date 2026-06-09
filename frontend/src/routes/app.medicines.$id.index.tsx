import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { StatCard } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pill, Building2, Package, Tag, ShieldAlert, CalendarClock, History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useCart, useAuth } from "@/store";
import { toast } from "sonner";
import api from "@/api/base";
import type { Medicine } from "@/types";

export const Route = createFileRoute("/app/medicines/$id/")({
  component: MedicineDetail,
});

function MedicineDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const add = useCart((s) => s.add);
  const busyItems = useCart((s) => s.busyItems);
  const user = useAuth((s) => s.user);

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        const res = await api.get(`/medicines/${id}`);
        setMedicine(res.data);
      } catch (error: any) {
        toast.error(error.response?.data?.error || "Failed to load medicine details");
        router.history.back();
      } finally {
        setLoading(false);
      }
    };
    fetchMedicine();
  }, [id, router]);

  if (loading) {
    return (
      <div className="p-6 max-w-[1000px] mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!medicine) return null;

  return (
    <div className="p-6 max-w-[1000px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.history.back()}
          className="-ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {(user?.role === 'admin' || (user?.role === 'manufacturer' && medicine.manufacturerId === user?.entityId)) && (
          <Link to="/app/medicines/$id/history" params={{ id: medicine.id }}>
            <Button size="sm" variant="outline" className="h-8 text-xs border-border hover:bg-accent gap-1.5">
              <History className="h-3.5 w-3.5" /> View Stock History
            </Button>
          </Link>
        )}
      </div>

      <div className="surface rounded-xl p-6 md:p-8 mb-6 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
        <div className="h-32 w-32 md:h-40 md:w-40 shrink-0 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center relative z-10">
          <Pill className="h-12 w-12 text-primary mb-2" />
          <div className="text-xs font-mono text-primary/70">{medicine.id}</div>
        </div>

        <div className="flex-1 relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{medicine.name}</h1>
            {medicine.rx && (
              <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning gap-1">
                <ShieldAlert className="h-3 w-3" /> Rx Required
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              {medicine.category}
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              {medicine.manufacturer}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground max-w-2xl mb-8">
            {medicine.description || "No description provided for this medicine."}
          </p>

          <div className="flex items-end gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Unit Price</div>
              <div className="text-3xl font-semibold tabular-nums text-foreground">
                Rs {medicine.price?.toFixed(2)}
              </div>
            </div>
            
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 px-8"
              disabled={busyItems.includes(medicine.id)}
              onClick={() => {
                toast.promise(add(medicine.id, 1), {
                  loading: "Adding to cart...",
                  success: "Added to cart",
                  error: "Failed to add to cart"
                });
              }}
            >
              {busyItems.includes(medicine.id) ? "Adding..." : "Add to Cart"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Available Stock"
          value={medicine.stock?.toString() || "0"}
          icon={Package}
          delta={medicine.stock < 50 ? "Low Stock" : "Healthy"}
        />
        <StatCard
          label="Expiry Date"
          value={medicine.expiry ? new Date(medicine.expiry).toLocaleDateString() : "N/A"}
          icon={CalendarClock}
        />
        {medicine.batch ? (
          <StatCard
            label="Batch Number"
            value={medicine.batch}
            icon={Pill}
          />
        ) : (
          <StatCard
            label="Batch Number"
            value="Hidden"
            icon={Pill}
          />
        )}
      </div>
    </div>
  );
}
