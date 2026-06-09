import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, StatusBadge, SectionPanel } from "@/components/ui-kit";
import { 
  Building2, Mail, Phone, MapPin, Calendar, 
  Box, Truck, Star, Info, ArrowLeft,
  ShieldCheck, Activity, Globe
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import api from "@/api/base";
import { toast } from "sonner";

export const Route = createFileRoute("/app/partners/$type/$id")({
  component: PartnerDetailsPage,
});

interface PartnerDetails {
  id: string;
  name: string;
  type: string;
  region: string;
  skus: number;
  status: "active" | "inactive" | "pending";
  email: string;
  phone: string;
  address: string;
  joinedDate: string;
  description: string;
  vehicle?: string;
  rating?: number;
}

function PartnerDetailsPage() {
  const { type, id } = Route.useParams();
  const [details, setDetails] = useState<PartnerDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/partners/${type}/${id}`);
        setDetails(res.data);
      } catch (error: any) {
        toast.error(error.response?.data?.error || "Failed to load partner details");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [type, id]);

  if (loading) {
    return (
      <div className="p-6 max-w-[1000px] mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!details) {
    return (
      <div className="p-20 text-center">
        <div className="text-muted-foreground mb-4">Partner not found</div>
        <Link to="/app/partners">
          <Button variant="outline" size="sm">Back to Partners</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1000px] mx-auto space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-2">
        <Link to="/app/partners">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Partners
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Partner ID:</span>
          <span className="text-[10px] font-mono bg-surface-2 px-2 py-0.5 rounded border border-border">
            {details.id}
          </span>
        </div>
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface rounded-2xl p-6 border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 grid place-items-center">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{details.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              {details.type}
              <span className="h-1 w-1 rounded-full bg-border" />
              {details.region}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={details.status} className="px-4 py-1.5 text-xs" />
          <div className="text-[11px] text-muted-foreground">
            Active since {details.joinedDate}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Stats & Description */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Metrics Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface rounded-xl p-4 border border-border flex flex-col items-center justify-center text-center">
              <Activity className="h-4 w-4 text-primary mb-2" />
              <div className="text-xl font-semibold tabular-nums">
                {details.type === "Delivery Partner" ? (
                  <span className="flex items-center gap-1">
                    {details.rating} <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  </span>
                ) : (
                  details.skus.toLocaleString()
                )}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                {details.type === "Delivery Partner" ? "Rating" : "Total SKUs"}
              </div>
            </div>
            <div className="bg-surface rounded-xl p-4 border border-border flex flex-col items-center justify-center text-center">
              <ShieldCheck className="h-4 w-4 text-emerald-500 mb-2" />
              <div className="text-xl font-semibold">Verified</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Trust Score</div>
            </div>
            <div className="bg-surface rounded-xl p-4 border border-border flex flex-col items-center justify-center text-center">
              <Globe className="h-4 w-4 text-blue-500 mb-2" />
              <div className="text-xl font-semibold truncate w-full">{details.region}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Primary Zone</div>
            </div>
          </div>

          {/* About Section */}
          <SectionPanel title="About Partner" description="General overview and business description">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {details.description}
            </p>
          </SectionPanel>

          {/* Additional Details (Placeholder for future expansion) */}
          <SectionPanel title="Operational Details" description="Logistics and supply chain metrics">
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="space-y-1">
                <div className="text-muted-foreground text-xs">Primary Vehicle / Capacity</div>
                <div className="font-medium flex items-center gap-2">
                  {details.type === "Delivery Partner" ? <Truck className="h-4 w-4" /> : <Box className="h-4 w-4" />}
                  {details.vehicle || "Standard Infrastructure"}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground text-xs">Contract Type</div>
                <div className="font-medium">Direct B2B Partnership</div>
              </div>
            </div>
          </SectionPanel>

          {/* Related Records */}
          <SectionPanel title="Related Records" description="Explore detailed records associated with this partner">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(details.type === "Manufacturer" || details.type === "Pharmacy") && (
                <Link to="/app/medicines" search={{ q: details.id }}>
                  <Button variant="outline" className="w-full justify-start gap-3 h-14 group hover:border-primary/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                      <Box className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <span className="font-medium text-xs group-hover:text-primary transition-colors">Medicines</span>
                    </div>
                  </Button>
                </Link>
              )}
              {details.type === "Pharmacy" && (
                <Link to="/app/orders" search={{ q: details.id }}>
                  <Button variant="outline" className="w-full justify-start gap-3 h-14 group hover:border-primary/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <span className="font-medium text-xs group-hover:text-primary transition-colors">Orders</span>
                    </div>
                  </Button>
                </Link>
              )}
              <Link to="/app/shipments" search={{ q: details.id }}>
                <Button variant="outline" className="w-full justify-start gap-3 h-14 group hover:border-primary/50 transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                    <Truck className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="font-medium text-xs group-hover:text-primary transition-colors">Shipments</span>
                  </div>
                </Button>
              </Link>
            </div>
          </SectionPanel>
        </div>

        {/* Right Column: Contact & Metadata */}
        <div className="space-y-6">
          <SectionPanel title="Contact Information">
            <div className="space-y-5">
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-surface-2 border border-border grid place-items-center shrink-0">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Email</p>
                  <p className="text-xs font-medium truncate">{details.email}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-surface-2 border border-border grid place-items-center shrink-0">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Phone</p>
                  <p className="text-xs font-medium">{details.phone}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-surface-2 border border-border grid place-items-center shrink-0">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Address</p>
                  <p className="text-xs font-medium leading-relaxed">{details.address}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-surface-2 border border-border grid place-items-center shrink-0">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Partnership Date</p>
                  <p className="text-xs font-medium">{details.joinedDate}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-border">
              <Button className="w-full gap-2 h-9 text-xs" variant="outline">
                <Mail className="h-3.5 w-3.5" />
                Send Message
              </Button>
            </div>
          </SectionPanel>

          {/* Quick Help */}
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-primary font-medium text-xs">
              <Info className="h-3.5 w-3.5" /> Support Notice
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              For any disputes or account issues regarding this partner, please contact the regional administrator.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
