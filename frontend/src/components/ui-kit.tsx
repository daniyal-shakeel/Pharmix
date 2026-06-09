import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tightest text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const positive = delta?.startsWith("+");
  return (
    <div className="surface rounded-xl p-4 hover:border-border-strong transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
      </div>
      <div className="text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {delta && (
        <div className={`mt-1 text-[11px] ${positive ? "text-success" : "text-destructive"}`}>
          {delta} vs last week
        </div>
      )}
    </div>
  );
}



export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const map: Record<string, string> = {
    active: "bg-success/15 text-success border-success/30",
    delivered: "bg-success/15 text-success border-success/30",
    paid: "bg-success/15 text-success border-success/30",
    shipped: "bg-info/15 text-info border-info/30",
    on_the_way: "bg-info/15 text-info border-info/30",
    in_transit: "bg-info/15 text-info border-info/30",
    processing: "bg-primary/15 text-primary border-primary/30",
    pending: "bg-warning/15 text-warning border-warning/30",
    pickup: "bg-warning/15 text-warning border-warning/30",
    inactive: "bg-destructive/15 text-destructive border-destructive/30",
    failed: "bg-destructive/15 text-destructive border-destructive/30",
    cancelled: "bg-destructive/15 text-destructive border-destructive/30",
    "on-time": "bg-success/15 text-success border-success/30",
    late: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-medium uppercase tracking-wide",
        map[status] || "bg-surface-2 text-muted-foreground border-border",
        className
      )}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
      {status.replace("_", " ")}
    </span>
  );
}

export function SectionPanel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`surface rounded-xl ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between p-4 border-b border-border">
          <div>
            {title && <h3 className="text-sm font-medium">{title}</h3>}
            {description && (
              <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
