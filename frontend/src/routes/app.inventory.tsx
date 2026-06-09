import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, SectionPanel, StatCard } from "@/components/ui-kit";
import { Boxes, AlertTriangle, CalendarClock, Warehouse } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/store";
import { toast } from "sonner";
import api from "@/api/base";
import type { Medicine } from "@/types";

export const Route = createFileRoute("/app/inventory")({ component: Inventory });

function InventoryContent({ 
  medicines, 
  stats, 
  loading, 
  role, 
  title: overrideTitle, 
  description: overrideDescription 
}: { 
  medicines: any[]; 
  stats?: any; 
  loading: boolean; 
  role: string | undefined;
  title?: string;
  description?: string;
}) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl w-full" />
      </div>
    );
  }

  let title = overrideTitle || "Stock levels";
  let description = overrideDescription || "All warehouse SKUs";

  if (!overrideTitle) {
    if (role === "manufacturer") {
      title = "Your Stock";
      description = "Your Medicines Inventory";
    } else if (role === "pharmacy") {
      title = "Linked Manufacturers Stock";
      description = "Linked manufacturers inventory";
    }
  }

  const computedStats = stats || {
    totalSkus: medicines.length,
    totalUnits: medicines.reduce((acc, m) => acc + m.stock, 0),
    lowStock: medicines.filter(m => m.stock < 50).length,
    expiringSoon: medicines.filter(m => {
      if (!m.expiry) return false;
      const expDate = new Date(m.expiry);
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
      return expDate <= ninetyDaysFromNow;
    }).length
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total SKUs" value={computedStats.totalSkus.toString()} delta={computedStats.skusDelta} icon={Boxes} />
        <StatCard
          label="Total units"
          value={computedStats.totalUnits.toLocaleString()}
          delta={computedStats.unitsDelta}
          icon={Warehouse}
        />
        <StatCard
          label="Low stock"
          value={computedStats.lowStock.toString()}
          delta={computedStats.lowStockDelta !== "N/A" ? computedStats.lowStockDelta : undefined}
          icon={AlertTriangle}
        />
        <StatCard label="Expiring < 90d" value={computedStats.expiringSoon.toString()} icon={CalendarClock} />
      </div>

      <SectionPanel title={title} description={description}>
        <div className="space-y-2.5">
          {medicines.map((m) => {
            const pct = Math.min(100, (m.stock / 240) * 100);
            const low = m.stock < 50;
            return (
              <div key={m.id || m.medicineId} className="flex items-center gap-3">
                <div className="w-48 truncate text-xs font-medium">{m.name}</div>
                <div className="flex-1">
                  <Progress value={pct} className="h-1.5 bg-surface-2" />
                </div>
                <div className="w-16 text-right text-xs tabular-nums text-muted-foreground">
                  {m.stock} u
                </div>
                <div className="w-20 text-right">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${low ? "border-warning/40 bg-warning/10 text-warning" : "border-success/30 bg-success/10 text-success"}`}
                  >
                    {low ? "Low" : "Healthy"}
                  </span>
                </div>
              </div>
            );
          })}
          {medicines.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-4">No inventory data available</div>
          )}
        </div>
      </SectionPanel>
    </>
  );
}

function Inventory() {
  const user = useAuth((s) => s.user);
  const isPharmacy = user?.role === "pharmacy";

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [pharmacyStock, setPharmacyStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const [medRes, statsRes] = await Promise.all([
          api.get("/medicines"),
          api.get("/medicines/inventory-stats")
        ]);
        setMedicines(medRes.data);
        setStats(statsRes.data);

        if (isPharmacy) {
          setLocalLoading(true);
          const localRes = await api.get("/medicines/pharmacy-inventory");
          setPharmacyStock(localRes.data);
        }
      } catch (error: any) {
        toast.error(error.response?.data?.error || "Failed to load inventory");
      } finally {
        setLoading(false);
        setLocalLoading(false);
      }
    };
    fetchInventory();
  }, [isPharmacy]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader title="Inventory" description="Warehouse stock & expiry monitoring" />
      
      {isPharmacy ? (
        <Tabs defaultValue="pharmacy" className="w-full mt-4">
          <TabsList className="mb-6 h-10 bg-surface border border-border rounded-lg p-1">
            <TabsTrigger value="pharmacy" className="text-xs px-4 rounded-md">Pharmacy Stock</TabsTrigger>
            <TabsTrigger value="manufacturers" className="text-xs px-4 rounded-md">Manufacturers Stock</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pharmacy" className="mt-0">
            <InventoryContent 
              medicines={pharmacyStock} 
              loading={localLoading} 
              role={user?.role} 
              title="Your Local Inventory"
              description="Medicines currently in your warehouse"
            />
          </TabsContent>
          
          <TabsContent value="manufacturers" className="mt-0">
            <InventoryContent medicines={medicines} stats={stats} loading={loading} role={user?.role} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="mt-4">
          <InventoryContent medicines={medicines} stats={stats} loading={loading} role={user?.role} />
        </div>
      )}
    </div>
  );
}
