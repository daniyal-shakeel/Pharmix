import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, SectionPanel } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Link2, Unlink, RefreshCcw } from "lucide-react";
import { useAuth, useTheme } from "@/store";
import api from "@/api/base";
import { toast } from "sonner";
import type { Manufacturer, Pharmacy, DeliveryPartner } from "@/types";

export const Route = createFileRoute("/app/settings")({ component: Settings });

function Settings() {
  const user = useAuth((s) => s.user);
  const isAdmin = user?.role === "admin";
  const isManufacturer = user?.role === "manufacturer";
  const isPharmacy = user?.role === "pharmacy";
  const isDelivery = user?.role === "delivery";
  const isEntity = isManufacturer || isPharmacy || isDelivery;

  const { theme, toggle: toggleTheme } = useTheme();

  const [profile, setProfile] = useState<Partial<Manufacturer & Pharmacy & DeliveryPartner>>({});
  const [loading, setLoading] = useState(isEntity);
  const [saving, setSaving] = useState(false);
  const [linkedEntities, setLinkedEntities] = useState<{ id: string; name: string; type: string }[]>([]);

  const [linkSource, setLinkSource] = useState<string>("");
  const [linkTarget, setLinkTarget] = useState<string>("");
  const [linkHistory, setLinkHistory] = useState<any[]>([]);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [allEntities, setAllEntities] = useState<{ id: string; name: string; type: string }[]>([]);

  useEffect(() => {
    if (isEntity) {
      const fetchProfileAndLinks = async () => {
        try {
          let profileEndpoint = "";
          let linksPromise: Promise<any>[] = [];

          if (isManufacturer) {
            profileEndpoint = "/manufacturers/profile";
            linksPromise = [
              api.get("/users/linked-pharmacies").then((r) => r.data.map((i: any) => ({ ...i, type: "Pharmacy" }))),
              api.get("/users/linked-delivery").then((r) => r.data.map((i: any) => ({ ...i, type: "Rider" })))
            ];
          } else if (isPharmacy) {
            profileEndpoint = "/pharmacies/profile";
            linksPromise = [
              api.get("/users/linked-manufacturers").then((r) => r.data.map((i: any) => ({ ...i, type: "Manufacturer" })))
            ];
          } else if (isDelivery) {
            profileEndpoint = "/delivery/profile";
            linksPromise = [
              api.get("/users/linked-manufacturers").then((r) => r.data.map((i: any) => ({ ...i, type: "Manufacturer" })))
            ];
          }

          const [profileRes, ...linksRes] = await Promise.all([
            api.get(profileEndpoint),
            ...linksPromise
          ]);
          
          let profileData = profileRes.data;
          if (isManufacturer && !profileData.deliveryConfig) {
            profileData.deliveryConfig = {
              smallOrderTime: 4320,
              mediumOrderTime: 7200,
              largeOrderTime: 10080,
              smallThreshold: 50,
              mediumThreshold: 200
            };
          }
          setProfile(profileData);
          setLinkedEntities(linksRes.flat());

        } catch (error: any) {
          toast.error(error.response?.data?.error || "Failed to load profile data");
        } finally {
          setLoading(false);
        }
      };
      fetchProfileAndLinks();
    }
  }, [isManufacturer, isPharmacy, isDelivery]);

  useEffect(() => {
    if (isAdmin) {
      const fetchAdminData = async () => {
        try {
          setLinkLoading(true);
          const [historyRes, usersRes] = await Promise.all([
            api.get("/links/history"),
            api.get("/users")
          ]);
          setLinkHistory(historyRes.data);
          const entities: { id: string; name: string; type: string }[] = [];
          (usersRes.data.manufacturers || []).forEach((m: any) => entities.push({ id: m.id, name: m.name, type: "Manufacturer" }));
          (usersRes.data.pharmacies || []).forEach((p: any) => entities.push({ id: p.id, name: p.name, type: "Pharmacy" }));
          (usersRes.data.deliveryPartners || []).forEach((d: any) => entities.push({ id: d.id, name: d.name, type: "Rider" }));
          setAllEntities(entities);
        } catch (error: any) {
          toast.error(error.response?.data?.error || "Failed to load admin data");
        } finally {
          setLinkLoading(false);
        }
      };
      fetchAdminData();
    }
  }, [isAdmin]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEntity) return;

    try {
      setSaving(true);
      let endpoint = "";
      if (isManufacturer) endpoint = "/manufacturers/profile";
      else if (isPharmacy) endpoint = "/pharmacies/profile";
      else if (isDelivery) endpoint = "/delivery/profile";

      const res = await api.put(endpoint, profile);
      toast.success("Profile updated successfully");
      setProfile(res.data.profile);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setProfile((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddLink = async () => {
    if (!linkSource || !linkTarget) {
      toast.error("Please select both source and target entities.");
      return;
    }
    if (linkSource === linkTarget) {
      toast.error("Cannot link an entity to itself.");
      return;
    }
    const alreadyLinked = linkHistory.some(
      (l: any) => l.status === 'active' &&
        ((l.sourceId === linkSource && l.targetId === linkTarget) ||
         (l.sourceId === linkTarget && l.targetId === linkSource))
    );
    if (alreadyLinked) {
      toast.error("These entities are already linked.");
      return;
    }
    try {
      setLinking(true);
      await api.post("/links", { sourceId: linkSource, targetId: linkTarget });
      toast.success("Entities linked successfully.");
      setLinkSource("");
      setLinkTarget("");
      const res = await api.get("/links/history");
      setLinkHistory(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to link entities");
    } finally {
      setLinking(false);
    }
  };

  const handleRemoveLink = async (linkId: string) => {
    try {
      await api.delete(`/links/${linkId}`);
      toast.success("Entities unlinked successfully.");
      const res = await api.get("/links/history");
      setLinkHistory(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to unlink entities");
    }
  };

  const handleRelinkLink = async (linkId: string) => {
    try {
      await api.post("/links/relink", { linkId });
      toast.success("Entities relinked successfully.");
      const res = await api.get("/links/history");
      setLinkHistory(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to relink entities");
    }
  };

  // Group history by source entity
  const groupedHistory = linkHistory.reduce((acc: any, link: any) => {
    const key = link.sourceId;
    if (!acc[key]) acc[key] = { name: link.sourceName, type: link.sourceType, links: [] };
    acc[key].links.push(link);
    return acc;
  }, {});

  const sortedGroups = Object.keys(groupedHistory).sort((a, b) => {
    const latestA = Math.max(...groupedHistory[a].links.map((l: any) => new Date(l.linkedAt).getTime()));
    const latestB = Math.max(...groupedHistory[b].links.map((l: any) => new Date(l.linkedAt).getTime()));
    return latestB - latestA;
  });

  return (
    <div className="p-6 max-w-[900px] mx-auto">
      <PageHeader title="Settings" description="Manage your workspace preferences" />
      <div className="space-y-3">
        <SectionPanel title="Profile">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {isManufacturer ? "Company Name" : isPharmacy ? "Store Name" : isDelivery ? "Full Name" : "Name"}
                  </Label>
                  <Input
                    id="name"
                    value={isEntity ? profile.name : user?.name}
                    onChange={handleInputChange}
                    className="h-9 bg-surface-2 border-border"
                  />
                </div>
                {isEntity && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isDelivery ? "Rider ID" : "Entity ID"}</Label>
                    <Input
                      value={profile.id || ""}
                      disabled
                      className="h-9 bg-surface-2 border-border font-mono opacity-70"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input
                    id="email"
                    value={isEntity ? profile.email : user?.email}
                    disabled
                    className="h-9 bg-surface-2 border-border opacity-70"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Role</Label>
                  <Input
                    value={user?.role}
                    disabled
                    className="h-9 bg-surface-2 border-border capitalize opacity-70"
                  />
                </div>
                {isEntity && (
                  <>
                    {!isDelivery && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Region</Label>
                        <Input
                          id="region"
                          value={profile.region || ""}
                          onChange={handleInputChange}
                          className="h-9 bg-surface-2 border-border"
                          placeholder="e.g. Region A"
                        />
                      </div>
                    )}
                    {isManufacturer && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Standard Shipping Fee (Rs)</Label>
                        <Input
                          id="shippingFee"
                          type="number"
                          value={profile.shippingFee || 0}
                          onChange={handleInputChange}
                          className="h-9 bg-surface-2 border-border"
                          placeholder="500"
                        />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Phone</Label>
                      <Input
                        id="phone"
                        value={profile.phone || ""}
                        onChange={handleInputChange}
                        className="h-9 bg-surface-2 border-border"
                        placeholder="+92-XXX-XXXXXXX"
                      />
                    </div>
                    {isDelivery && (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Vehicle Type</Label>
                          <Input
                            id="vehicle"
                            value={profile.vehicle || ""}
                            onChange={handleInputChange}
                            className="h-9 bg-surface-2 border-border"
                            placeholder="e.g. Bike, Van"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Delivery Zone</Label>
                          <Input
                            id="zone"
                            value={profile.zone || ""}
                            onChange={handleInputChange}
                            className="h-9 bg-surface-2 border-border"
                            placeholder="e.g. North Zone"
                          />
                        </div>
                      </>
                    )}
                    {!isDelivery && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Address</Label>
                        <Input
                          id="address"
                          value={profile.address || ""}
                          onChange={handleInputChange}
                          className="h-9 bg-surface-2 border-border"
                          placeholder="Full business address"
                        />
                      </div>
                    )}
                    {!isDelivery && (
                      <div className="space-y-1.5 col-span-2">
                        <Label className="text-xs">{isManufacturer ? "Company Description" : "Store Description"}</Label>
                        <Input
                          id="description"
                          value={profile.description || ""}
                          onChange={handleInputChange}
                          className="h-9 bg-surface-2 border-border"
                          placeholder={isManufacturer ? "Brief about your manufacturing unit" : "Brief about your pharmacy"}
                        />
                      </div>
                    )}
                  </>
                )}
                {!isEntity && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Workspace</Label>
                    <Input defaultValue="Pharmix Demo" className="h-9 bg-surface-2 border-border" />
                  </div>
                )}
              </div>

              {isManufacturer && (
                <div className="mt-6 pt-5 border-t border-border">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium">Delivery Configuration</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Configure expected delivery times based on total items in an order.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">
                        Thresholds (Total Items)
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Small Order ≤</Label>
                        <Input
                          type="number"
                          value={profile.deliveryConfig?.smallThreshold || 50}
                          onChange={(e) => setProfile(prev => ({
                            ...prev,
                            deliveryConfig: { ...prev.deliveryConfig!, smallThreshold: parseInt(e.target.value) }
                          }))}
                          className="h-9 bg-surface-2 border-border"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Medium Order ≤</Label>
                        <Input
                          type="number"
                          value={profile.deliveryConfig?.mediumThreshold || 200}
                          onChange={(e) => setProfile(prev => ({
                            ...prev,
                            deliveryConfig: { ...prev.deliveryConfig!, mediumThreshold: parseInt(e.target.value) }
                          }))}
                          className="h-9 bg-surface-2 border-border"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">
                        Expected Delivery Time
                      </div>
                      {[
                        { label: "Small Order", id: "smallOrderTime" },
                        { label: "Medium Order", id: "mediumOrderTime" },
                        { label: "Large Order", id: "largeOrderTime" }
                      ].map((field) => (
                        <div key={field.id} className="space-y-1.5">
                          <Label className="text-xs">{field.label}</Label>
                          <Select
                            value={String(profile.deliveryConfig?.[field.id as keyof typeof profile.deliveryConfig] || "")}
                            onValueChange={(val) => setProfile(prev => ({
                              ...prev,
                              deliveryConfig: { ...prev.deliveryConfig!, [field.id]: parseInt(val) }
                            }))}
                          >
                            <SelectTrigger className="h-9 bg-surface-2 border-border text-xs">
                              <SelectValue placeholder="Select delivery time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 Minute (Dev/Test)</SelectItem>
                              <SelectItem value="5">5 Minutes (Dev/Test)</SelectItem>
                              <SelectItem value="10">10 Minutes (Dev/Test)</SelectItem>
                              <SelectItem value="1440">1 Day</SelectItem>
                              <SelectItem value="2880">2 Days</SelectItem>
                              <SelectItem value="4320">3 Days</SelectItem>
                              <SelectItem value="7200">5 Days</SelectItem>
                              <SelectItem value="10080">7 Days</SelectItem>
                              <SelectItem value="14400">10 Days</SelectItem>
                              <SelectItem value="20160">14 Days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {isEntity && (
                <div className="mt-6 pt-5 border-t border-border">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium">Linked Entities</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      To change linked entities, please contact administration.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {linkedEntities.length > 0 ? (
                      linkedEntities.map((entity: any, i) => (
                        <div key={i} className="flex flex-col gap-1.5">
                          <Label className="text-xs text-muted-foreground">Linked {entity.type}</Label>
                          <Input
                            value={`${entity.name} (${entity.id})${entity.shippingFee !== undefined ? ` · Shipping: Rs ${entity.shippingFee}` : ""}`}
                            disabled
                            className="h-9 bg-surface-2 border-border opacity-70"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground py-2 italic">
                        No linked entities found.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isEntity && (
                <div className="mt-6 flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={saving}
                    className="h-8 bg-primary hover:bg-primary/90 text-xs"
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              )}
            </form>
          )}
        </SectionPanel>

        {isAdmin && (
          <SectionPanel title="Entity Relationships" description="Link and unlink entities across the platform">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Source Entity</Label>
                  <Select value={linkSource} onValueChange={setLinkSource}>
                    <SelectTrigger className="h-9 bg-surface-2 border-border text-xs">
                      <SelectValue placeholder="Select source entity" />
                    </SelectTrigger>
                    <SelectContent>
                      {allEntities.filter(e => e.id !== linkTarget).map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name} ({e.id}) — {e.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Target Entity</Label>
                  <Select value={linkTarget} onValueChange={setLinkTarget}>
                    <SelectTrigger className="h-9 bg-surface-2 border-border text-xs">
                      <SelectValue placeholder="Select target entity" />
                    </SelectTrigger>
                    <SelectContent>
                      {allEntities.filter(e => e.id !== linkSource).map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name} ({e.id}) — {e.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                className="h-8 text-xs bg-primary hover:bg-primary/90 gap-1.5"
                disabled={linking}
                onClick={handleAddLink}
              >
                <Link2 className="h-3.5 w-3.5" /> {linking ? "Linking..." : "Link Entities"}
              </Button>

              {linkLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : sortedGroups.length > 0 ? (
                <div className="mt-3 space-y-4">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                    Relationship History ({linkHistory.length})
                  </div>
                  {sortedGroups.map((groupKey) => {
                    const group = groupedHistory[groupKey];
                    return (
                      <div key={groupKey} className="space-y-2">
                        <div className="flex items-center gap-2 px-1">
                          <span className="text-xs font-semibold">{group.name}</span>
                          <span className="text-[9px] text-muted-foreground uppercase tracking-tight bg-surface-3 px-1.5 py-0.5 rounded border border-border">{group.type}</span>
                        </div>
                        <div className="space-y-1.5 ml-1">
                          {group.links.map((link: any) => (
                            <div
                              key={link.id}
                              className={`flex items-center justify-between p-2.5 rounded-lg border bg-surface-2 ${
                                link.status === 'unlinked' ? 'border-destructive/20 opacity-60' : 'border-border'
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <Link2 className="h-3 w-3 text-muted-foreground" />
                                <Badge variant="outline" className="text-[10px] font-mono">
                                  {link.targetName || link.targetId}
                                </Badge>
                                <span className="text-[9px] text-muted-foreground uppercase">{link.targetType}</span>
                                <Badge
                                  variant={link.status === 'active' ? 'default' : 'destructive'}
                                  className="text-[9px] ml-1 h-4 px-1"
                                >
                                  {link.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] text-muted-foreground font-mono">
                                  {new Date(link.linkedAt).toLocaleDateString()}
                                </span>
                                {link.status === 'active' ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleRemoveLink(link.id)}
                                  >
                                    <Unlink className="h-3.5 w-3.5" />
                                  </Button>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                                    onClick={() => handleRelinkLink(link.id)}
                                  >
                                    <RefreshCcw className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[10px] text-muted-foreground text-center py-3 border border-dashed border-border rounded-lg">
                  No entity relationships found.
                </div>
              )}
            </div>
          </SectionPanel>
        )}

        {!isEntity && !isAdmin && (
          <SectionPanel title="Notifications">
            {[
              { l: "Email alerts", d: "Order, shipment & payment updates" },
              { l: "Stock warnings", d: "Notify when SKU drops below threshold" },
              { l: "Expiry alerts", d: "Notify 90 days before batch expiry" },
              { l: "Marketing emails", d: "Product updates & best practices" },
            ].map((s, i) => (
              <div
                key={s.l}
                className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
              >
                <div>
                  <div className="text-xs font-medium">{s.l}</div>
                  <div className="text-[10px] text-muted-foreground">{s.d}</div>
                </div>
                <Switch defaultChecked={i < 3} />
              </div>
            ))}
          </SectionPanel>
        )}

        <SectionPanel title="Appearance">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium">Dark Mode</div>
              <div className="text-[10px] text-muted-foreground">
                Toggle between light and dark themes for the platform.
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {theme}
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={() => toggleTheme()} />
            </div>
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}
