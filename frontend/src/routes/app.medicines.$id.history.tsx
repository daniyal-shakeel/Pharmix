import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, SectionPanel, StatusBadge } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { ArrowLeft, History, Package, User, Clock, ArrowRight } from "lucide-react";
import api from "@/api/base";
import { toast } from "sonner";
import { useAuth } from "@/store";

export const Route = createFileRoute("/app/medicines/$id/history")({
  component: StockHistoryPage,
});

function StockHistoryPage() {
  const { id } = Route.useParams();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuth((s) => s.user);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await api.get("/stock-history", { params: { medicineId: id } });
        setHistory(res.data);
      } catch (error: any) {
        toast.error(error.response?.data?.error || "Failed to load stock history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [id]);

  return (
    <div className="p-6 max-w-[1000px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link to="/app/medicines/$id" params={{ id }} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to Product
        </Link>
      </div>

      <PageHeader 
        title="Stock History" 
        description={`Audit log for medicine ${id}`}
      />

      <SectionPanel title="Transaction Log" description="All manual and order-based inventory changes">
        <div className="space-y-3">
          {loading ? (
            <div className="py-20 text-center text-muted-foreground animate-pulse">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground border border-dashed rounded-lg border-border">
              <History className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <div className="text-sm">No history records found for this product.</div>
            </div>
          ) : (
            <div className="overflow-hidden border border-border rounded-lg bg-surface">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-surface-2 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Change</th>
                    <th className="px-4 py-3 text-left font-medium">Changed By</th>
                    <th className="px-4 py-3 text-left font-medium">Reference</th>
                    <th className="px-4 py-3 text-right font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.map((log) => {
                    const diff = log.newQty - log.oldQty;
                    const isPositive = diff > 0;
                    
                    return (
                      <tr key={log.id} className="hover:bg-surface-2/50 transition-colors">
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-[9px] h-4 uppercase ${log.type === 'manual' ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' : 'bg-purple-500/10 text-purple-500 border-purple-500/30'}`}>
                            {log.type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{log.oldQty}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="font-semibold">{log.newQty}</span>
                            <span className={`text-[10px] ml-1 px-1 rounded ${isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                              {isPositive ? '+' : ''}{diff}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium">{log.changedBy}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{log.role}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[10px] text-muted-foreground">{log.referenceId || "—"}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SectionPanel>
    </div>
  );
}

function Badge({ children, variant, className }: any) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full font-medium ${className}`}>
      {children}
    </span>
  );
}
