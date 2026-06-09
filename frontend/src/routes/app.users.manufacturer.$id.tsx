import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, SectionPanel, StatCard, StatusBadge } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Boxes, Mail, Phone, MapPin, Building2, ExternalLink, ShieldAlert, Copy, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import api from "@/api/base";
import { toast } from "sonner";
import { useAuth } from "@/store";
import type { Manufacturer } from "@/types";

export const Route = createFileRoute("/app/users/manufacturer/$id")({
  component: ManufacturerDetail,
});

function ManufacturerDetail() {
  const { id } = Route.useParams();
  const user = useAuth((s) => s.user);
  const isAdmin = user?.role === "admin";

  const [mfr, setMfr] = useState<Manufacturer | null>(null);
  const [loading, setLoading] = useState(true);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [newCredentials, setNewCredentials] = useState<string | null>(null);

  const handleResetPassword = async () => {
    try {
      setResetting(true);
      const res = await api.post("/users/reset-password", { userId: id });
      setNewCredentials(res.data.newPassword);
      toast.success("Password reset successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  const copyNewCredentials = () => {
    if (newCredentials) {
      navigator.clipboard.writeText(newCredentials);
      toast.success("Password copied to clipboard");
    }
  };

  useEffect(() => {
    if (!resetOpen) {
      setNewCredentials(null);
    }
  }, [resetOpen]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/partners/manufacturer/${id}`);
        const d = res.data;
        setMfr({
          id: d.id,
          name: d.name,
          region: d.region || "N/A",
          email: d.email || "N/A",
          phone: d.phone || "N/A",
          address: d.address || "N/A",
          status: d.status,
          joinedDate: d.joinedDate || "N/A",
          totalSkus: d.skus || 0,
          description: d.description || "No description available.",
          linkedDeliveryPartners: [],
        });
      } catch (error: any) {
        toast.error(error.response?.data?.error || "Failed to load manufacturer");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-4 gap-3">
          <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  if (!mfr) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">Manufacturer not found.</div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link
          to="/app/users"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Users
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Partner ID:</span>
          <span className="text-[10px] font-mono bg-surface-2 px-2 py-0.5 rounded border border-border">
            {mfr.id}
          </span>
        </div>
      </div>

      <PageHeader title={mfr.name} description={mfr.description}>
        <StatusBadge status={mfr.status} />
      </PageHeader>

      {/* Info bar */}
      <div className="flex flex-wrap gap-4 mb-6 text-xs text-muted-foreground bg-surface rounded-xl p-4 border border-border">
        <span className="flex items-center gap-1.5">
          <Building2 className="h-3 w-3" /> {mfr.region}
        </span>
        <span className="flex items-center gap-1.5">
          <Mail className="h-3 w-3" /> {mfr.email}
        </span>
        <span className="flex items-center gap-1.5">
          <Phone className="h-3 w-3" /> {mfr.phone}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3" /> {mfr.address}
        </span>
        <span>Joined {new Date(mfr.joinedDate).toLocaleDateString()}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total SKUs" value={mfr.totalSkus.toString()} icon={Boxes} />
      </div>

      {/* Navigation to related data */}
      {isAdmin && (
        <SectionPanel title="Security" description="Account and access management">
          <div className="flex items-center justify-between p-4 bg-surface-2 rounded-xl border border-border">
            <div>
              <div className="text-sm font-medium">Reset User Password</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Generates a new secure password and updates the account instantly.
              </div>
            </div>
            <Dialog open={resetOpen} onOpenChange={setResetOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/5 hover:text-primary transition-all">
                  <ShieldAlert className="h-3.5 w-3.5 mr-1.5" /> Reset Password
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Reset Password</DialogTitle>
                </DialogHeader>
                {!newCredentials ? (
                  <div className="py-4 space-y-4">
                    <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-start gap-3">
                      <ShieldAlert className="h-5 w-5 text-warning shrink-0" />
                      <div className="text-xs text-muted-foreground">
                        This will instantly change the user's password. They will be logged out of all active sessions.
                      </div>
                    </div>
                    <Button 
                      onClick={handleResetPassword} 
                      disabled={resetting}
                      className="w-full h-9 bg-primary"
                    >
                      {resetting ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...
                        </div>
                      ) : "Confirm Reset"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 py-2">
                    <div className="bg-success/10 border border-success/30 rounded-lg p-3 flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-success/20 grid place-items-center shrink-0">
                        <div className="h-2 w-2 rounded-full bg-success" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-success">Password Updated</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          New credentials have been generated. Copy and share them manually.
                        </div>
                      </div>
                    </div>
                    <div className="bg-surface-2 rounded-lg p-4 border border-border space-y-3 font-mono text-xs">
                      <div className="flex justify-between border-b border-border pb-2">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{mfr.email}</span>
                      </div>
                      <div className="flex justify-between border-b border-border pb-2">
                        <span className="text-muted-foreground">New Password:</span>
                        <span className="font-medium text-primary">{newCredentials}</span>
                      </div>
                    </div>
                    <Button onClick={copyNewCredentials} variant="outline" className="w-full h-9 gap-2">
                      <Copy className="h-4 w-4" /> Copy Password
                    </Button>
                    <Button onClick={() => setResetOpen(false)} className="w-full h-9 bg-primary">
                      Done
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </SectionPanel>
      )}

      <SectionPanel title="Related Records" description="View detailed records for this manufacturer">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/app/medicines" search={{ q: mfr.id }}>
            <Button variant="outline" className="w-full justify-start gap-3 h-16 group hover:border-primary/50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                <Boxes className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="font-medium text-sm group-hover:text-primary transition-colors">View Medicines</span>
                <span className="text-[10px] text-muted-foreground truncate w-full text-left">Filter catalog by this manufacturer</span>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
            </Button>
          </Link>
          
          <Link to="/app/shipments" search={{ q: mfr.id }}>
            <Button variant="outline" className="w-full justify-start gap-3 h-16 group hover:border-primary/50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                <Boxes className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="font-medium text-sm group-hover:text-primary transition-colors">View Shipments</span>
                <span className="text-[10px] text-muted-foreground truncate w-full text-left">Filter shipments by this manufacturer</span>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
            </Button>
          </Link>
        </div>
      </SectionPanel>
    </div>
  );
}
