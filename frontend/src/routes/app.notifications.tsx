import { createFileRoute, Link } from "@tanstack/react-router";
import { useNotifications } from "@/store";
import { PageHeader, SectionPanel } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  CheckCheck, 
  ShoppingBag, 
  Truck, 
  CreditCard, 
  ShieldCheck, 
  Clock,
  ExternalLink,
  Info
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useEffect } from "react";

export const Route = createFileRoute("/app/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { notifications, fetchNotifications, markAsOpened, markAllAsOpened } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingBag className="h-4 w-4" />;
      case 'shipment': return <Truck className="h-4 w-4" />;
      case 'payment': return <CreditCard className="h-4 w-4" />;
      case 'approval': return <ShieldCheck className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'order': return "text-blue-500 bg-blue-500/10";
      case 'shipment': return "text-orange-500 bg-orange-500/10";
      case 'payment': return "text-emerald-500 bg-emerald-500/10";
      case 'approval': return "text-primary bg-primary/10";
      default: return "text-muted-foreground bg-muted-foreground/10";
    }
  };

  const getLink = (notification: any) => {
    const { type, metadata } = notification;
    if (!metadata) return null;
    
    if (type === 'order' && metadata.orderId) return `/app/orders/${metadata.orderId}`;
    if (type === 'shipment' && metadata.shipmentId) return `/app/shipments/${metadata.shipmentId}`;
    if (type === 'approval' && metadata.shipmentId) return `/app/shipments/${metadata.shipmentId}`;
    
    return null;
  };

  return (
    <div className="p-6 max-w-[1000px] mx-auto">
      <PageHeader 
        title="Notifications" 
        description="Stay updated with real-time activity across your network"
      >
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 text-xs gap-2"
          onClick={() => markAllAsOpened()}
          disabled={notifications.every(n => n.isOpened)}
        >
          <CheckCheck className="h-3.5 w-3.5" />
          Mark all as read
        </Button>
      </PageHeader>

      <SectionPanel title="Recent Activity" description="System alerts and status updates">
        <div className="space-y-1">
          {notifications.length > 0 ? (
            notifications.map((n) => {
              const link = getLink(n);
              return (
                <div 
                  key={n.id}
                  className={`group flex items-start gap-4 p-4 rounded-xl border transition-all ${
                    n.isOpened 
                      ? "bg-transparent border-border/40 opacity-70" 
                      : "bg-surface-2 border-primary/20 shadow-sm"
                  }`}
                  onMouseEnter={() => !n.isOpened && markAsOpened(n.id)}
                >
                  <div className={`mt-0.5 h-9 w-9 rounded-full grid place-items-center shrink-0 ${getTypeColor(n.type)}`}>
                    {getIcon(n.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-sm font-semibold truncate ${!n.isOpened ? "text-foreground" : "text-muted-foreground"}`}>
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {n.message}
                    </p>
                    
                    {link && (
                      <Link 
                        to={link as any}
                        className="inline-flex items-center gap-1.5 mt-3 text-[11px] font-medium text-primary hover:underline transition-all"
                      >
                        View Details
                        <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    )}
                  </div>

                  {!n.isOpened && (
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-surface-2 grid place-items-center mb-4">
                <Bell className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <h3 className="text-sm font-medium">All caught up!</h3>
              <p className="text-xs text-muted-foreground mt-1">
                You don't have any new notifications at the moment.
              </p>
            </div>
          )}
        </div>
      </SectionPanel>
    </div>
  );
}
