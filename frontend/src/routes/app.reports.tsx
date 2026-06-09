import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionPanel } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

export const Route = createFileRoute("/app/reports")({ component: Reports });

const REPORTS = [
  { name: "Monthly Sales Summary", date: "Apr 2026", size: "2.4 MB" },
  { name: "Inventory Audit Report", date: "Apr 2026", size: "1.8 MB" },
  { name: "Compliance & Batch Trace", date: "Q1 2026", size: "5.1 MB" },
  { name: "Delivery SLA Report", date: "Apr 2026", size: "920 KB" },
  { name: "Expiry Risk Report", date: "Apr 2026", size: "1.2 MB" },
  { name: "Pharmacy Performance", date: "Q1 2026", size: "3.6 MB" },
];

function Reports() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader title="Reports" description="Generated reports & exports" />
      <SectionPanel>
        <div className="space-y-2">
          {REPORTS.map((r) => (
            <div
              key={r.name}
              className="flex items-center gap-3 p-3 rounded-md border border-border bg-surface-2 hover:border-border-strong"
            >
              <div className="h-8 w-8 rounded-md bg-primary/10 border border-primary/20 grid place-items-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{r.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {r.date} · {r.size}
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs border-border bg-surface">
                <Download className="h-3 w-3 mr-1" /> Download
              </Button>
            </div>
          ))}
        </div>
      </SectionPanel>
    </div>
  );
}
