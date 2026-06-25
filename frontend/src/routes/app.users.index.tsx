import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/store";
import { PageHeader, SectionPanel, StatusBadge } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ChevronRight, Boxes, Pill, Truck, Star, Copy, ShieldAlert, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/base";
import type { Manufacturer, Pharmacy, DeliveryPartner } from "@/types";

export const Route = createFileRoute("/app/users/")({ component: UsersIndex });

function UsersIndex() {
  const user = useAuth((s) => s.user);
  const isAdmin = user?.role === "admin";

  const [data, setData] = useState<{
    manufacturers: Manufacturer[];
    pharmacies: Pharmacy[];
    deliveryPartners: DeliveryPartner[];
  }>({
    manufacturers: [],
    pharmacies: [],
    deliveryPartners: [],
  });
  const [loading, setLoading] = useState(true);

  const { manufacturers, pharmacies, deliveryPartners } = data;
  const totalUsers = manufacturers.length + pharmacies.length + deliveryPartners.length;

  const [open, setOpen] = useState(false);
  const [newRole, setNewRole] = useState<"admin" | "manufacturer" | "pharmacy" | "delivery">(
    "manufacturer",
  );
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newEntityIds, setNewEntityIds] = useState<string[]>([]);
  const [availableEntities, setAvailableEntities] = useState<any[]>([]);
  const [entitiesLoading, setEntitiesLoading] = useState(false);

  const [credentials, setCredentials] = useState<{
    email: string;
    pass: string;
    role: string;
    entities?: string[];
  } | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users");
      setData(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableEntities = async (role: string) => {
    if (role === "admin") {
      setAvailableEntities([]);
      return;
    }
    try {
      setEntitiesLoading(true);
      const res = await api.get(`/users/entities/${role}`);
      setAvailableEntities(res.data);
    } catch (error: any) {
      toast.error("Failed to load linked entities");
    } finally {
      setEntitiesLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (open && newRole !== "admin") {
      fetchAvailableEntities(newRole);
    }
  }, [newRole, open]);

  const getEntityLabel = () => {
    switch (newRole) {
      case "manufacturer":
        return "Linked Delivery Partner";
      case "pharmacy":
        return "Linked Manufacturer";
      case "delivery":
        return "Linked Manufacturer";
      default:
        return "Linked Entity";
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await api.post("/users", {
        email: newEmail,
        role: newRole,
        name: newName,
        linkedEntities: newEntityIds,
      });

      const { credentials } = res.data;
      
      setCredentials({
        email: credentials.email,
        pass: credentials.password,
        role: newRole,
        entities: newEntityIds,
      });
      toast.success("User created successfully");
      fetchUsers(); 
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create user");
    }
  };

  const copyCredentials = () => {
    if (credentials) {
      navigator.clipboard.writeText(`Email: ${credentials.email}\nPassword: ${credentials.pass}`);
      toast.success("Credentials copied to clipboard");
    }
  };

  const resetForm = () => {
    setNewRole("manufacturer");
    setNewName("");
    setNewEmail("");
    setNewEntityIds([]);
    setCredentials(null);
    setAvailableEntities([]);
  };

  const UserSkeleton = () => (
    <div className="space-y-1.5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );

  if (!isAdmin) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center">
        <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground mt-2 max-w-sm">
          Only administrators can access the user management dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="User Management"
        description={loading ? "Loading users..." : `${totalUsers} users across your network`}
      >
        <Dialog
          open={open}
          onOpenChange={(val) => {
            setOpen(val);
            if (!val) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90">
              <Plus className="h-3.5 w-3.5 mr-1" /> Invite user
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create new user</DialogTitle>
            </DialogHeader>
            {!credentials ? (
              <form onSubmit={handleCreateUser} className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Role</Label>
                  <Select
                    value={newRole}
                    onValueChange={(val) => {
                      setNewRole(val as any);
                      setNewEntityIds([]);
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manufacturer">Manufacturer</SelectItem>
                      <SelectItem value="pharmacy">Pharmacy</SelectItem>
                      <SelectItem value="delivery">Delivery Partner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newRole !== "admin" && (
                  <div className="space-y-2">
                    <Label className="text-xs">{getEntityLabel()}(s)</Label>
                    <Select
                      value=""
                      onValueChange={(val) => {
                        if (!newEntityIds.includes(val)) {
                          setNewEntityIds([...newEntityIds, val]);
                        }
                      }}
                      disabled={entitiesLoading}
                    >
                      <SelectTrigger className="h-9">
                        {entitiesLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span className="text-xs">Loading entities...</span>
                          </div>
                        ) : (
                          <SelectValue placeholder={`Add ${getEntityLabel().toLowerCase()}...`} />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {availableEntities
                          .filter((e) => !newEntityIds.includes(e.id))
                          .map((ent) => (
                            <SelectItem key={ent.id} value={ent.id}>
                              {ent.name} ({ent.id})
                            </SelectItem>
                          ))}
                        {availableEntities.length === 0 && !entitiesLoading && (
                          <div className="p-2 text-[10px] text-center text-muted-foreground">
                            No active {getEntityLabel().toLowerCase()}s found.
                          </div>
                        )}
                      </SelectContent>
                    </Select>

                    {newEntityIds.length > 0 && (
                      <div className="mt-2 max-h-[160px] overflow-y-auto space-y-2 pr-1">
                        {newEntityIds.map((id) => {
                          const ent = availableEntities.find((e) => e.id === id);
                          if (!ent) return null;
                          const isRider = "rating" in ent;
                          return (
                            <div
                              key={id}
                              className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-surface-2"
                            >
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium truncate">{ent.name}</span>
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    {ent.id}
                                  </span>
                                </div>
                                {isRider && (
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                      <Star className="h-3 w-3 text-warning fill-warning" />{" "}
                                      {(ent as any).rating}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                                onClick={() =>
                                  setNewEntityIds(newEntityIds.filter((e) => e !== id))
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs">Full Name</Label>
                  <Input
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-9"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input
                    required
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="h-9"
                    placeholder="john@example.com"
                  />
                </div>

                <DialogFooter className="mt-4">
                  <Button type="submit" className="w-full h-9 bg-primary">
                    Generate Credentials
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <div className="space-y-4 py-2">
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-warning shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-warning">Important Notice</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      These credentials were generated securely at the backend. Please share them with
                      the user securely.
                    </div>
                  </div>
                </div>
                <div className="bg-surface-2 rounded-lg p-4 border border-border space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{credentials.email}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Password:</span>
                    <span className="font-medium text-primary">{credentials.pass}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Role:</span>
                    <span className="font-medium capitalize">{credentials.role}</span>
                  </div>
                  {credentials.entities && credentials.entities.length > 0 && (
                    <div className="flex justify-between border-t border-border pt-2 mt-2">
                      <span className="text-muted-foreground">Linked Entities:</span>
                      <span
                        className="font-medium text-right max-w-[150px] truncate"
                        title={credentials.entities.join(", ")}
                      >
                        {credentials.entities.join(", ")}
                      </span>
                    </div>
                  )}
                </div>
                <Button onClick={copyCredentials} variant="outline" className="w-full h-9 gap-2">
                  <Copy className="h-4 w-4" /> Copy Credentials
                </Button>
                <Button onClick={() => resetForm()} className="w-full h-9 bg-primary">
                  Done
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* ── Manufacturers ── */}
      <SectionPanel
        title="Manufacturers"
        description={`${manufacturers.length} registered manufacturers`}
        action={
          <Badge variant="outline" className="text-[10px] border-border bg-surface-2 gap-1">
            <Boxes className="h-2.5 w-2.5" /> {manufacturers.length}
          </Badge>
        }
        className="mb-3"
      >
        {loading ? (
          <UserSkeleton />
        ) : (
          <div className="space-y-1.5">
            {manufacturers.map((m) => (
              <Link
                key={m.id}
                to="/app/users/manufacturer/$id"
                params={{ id: m.id }}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface-2 hover:border-border-strong transition-colors group cursor-pointer"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-medium">
                    {m.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{m.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {m.email} · {m.region}
                  </div>
                </div>
                <StatusBadge status={m.status as any} />
                <div className="text-[11px] text-muted-foreground tabular-nums">
                  {m.totalSkus} SKUs
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </SectionPanel>

      {/* ── Pharmacies ── */}
      <SectionPanel
        title="Pharmacies"
        description={`${pharmacies.length} registered pharmacies`}
        action={
          <Badge variant="outline" className="text-[10px] border-border bg-surface-2 gap-1">
            <Pill className="h-2.5 w-2.5" /> {pharmacies.length}
          </Badge>
        }
        className="mb-3"
      >
        {loading ? (
          <UserSkeleton />
        ) : (
          <div className="space-y-1.5">
            {pharmacies.map((p) => (
              <Link
                key={p.id}
                to="/app/users/pharmacy/$id"
                params={{ id: p.id }}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface-2 hover:border-border-strong transition-colors group cursor-pointer"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-medium">
                    {p.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {p.email} · {p.region}
                  </div>
                </div>
                <StatusBadge status={p.status as any} />
                <div className="text-[11px] text-muted-foreground tabular-nums">
                  {p.totalSkus} SKUs
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </SectionPanel>

      {/* ── Delivery Partners ── */}
      <SectionPanel
        title="Delivery Partners"
        description={`${deliveryPartners.length} active delivery partners`}
        action={
          <Badge variant="outline" className="text-[10px] border-border bg-surface-2 gap-1">
            <Truck className="h-2.5 w-2.5" /> {deliveryPartners.length}
          </Badge>
        }
      >
        {loading ? (
          <UserSkeleton />
        ) : (
          <div className="space-y-1.5">
            {deliveryPartners.map((d) => (
              <Link
                key={d.id}
                to="/app/users/delivery/$id"
                params={{ id: d.id }}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface-2 hover:border-border-strong transition-colors group cursor-pointer"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-medium">
                    {d.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{d.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {d.email} · {d.zone}
                  </div>
                </div>
                <StatusBadge status={d.status as any} />
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Star className="h-2.5 w-2.5 text-warning" /> {d.rating}
                </div>
                <div className="text-[11px] text-muted-foreground tabular-nums">
                  {d.totalDeliveries} trips
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </SectionPanel>
    </div>
  );
}
