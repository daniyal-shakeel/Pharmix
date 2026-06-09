import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui-kit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, Plus, Pill, ShieldAlert, X } from "lucide-react";
import { useAuth, useCart } from "@/store";
import { toast } from "sonner";
import api from "@/api/base";
import type { Medicine } from "@/types";

type MedicinesSearch = { q?: string };
export const Route = createFileRoute("/app/medicines/")({
  validateSearch: (search: Record<string, unknown>): MedicinesSearch => {
    return { q: search.q as string | undefined };
  },
  component: MedicinesCatalog,
});

const EMPTY_FORM = {
  name: "",
  category: "",
  batch: "",
  price: "",
  stock: "",
  expiry: "",
  rx: false,
  description: "",
  manufacturerId: "",
};

function MedicinesCatalog() {
  const search = Route.useSearch();
  const [q, setQ] = useState(search.q || "");
  const [cat, setCat] = useState<string | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [manufacturers, setManufacturers] = useState<{ id: string; name: string }[]>([]);

  const add = useCart((s) => s.add);
  const busyItems = useCart((s) => s.busyItems);
  const user = useAuth((s) => s.user);
  const role = user?.role;
  const canCreate = role === "admin" || role === "manufacturer";

  const fetchMedicines = async (catFilter?: string | null) => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (catFilter) params.category = catFilter;
      const res = await api.get("/medicines", { params });
      setMedicines(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to load medicines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines(cat);
  }, [cat]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/medicines/categories");
        setCategories(res.data);
      } catch {
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (role === "admin" && showCreate) {
      const fetchMfrs = async () => {
        try {
          const res = await api.get("/partners");
          const mfrs = res.data
            .filter((p: any) => p.type === "Manufacturer")
            .map((p: any) => ({ id: p.id, name: p.name }));
          setManufacturers(mfrs);
        } catch {
          setManufacturers([]);
        }
      };
      fetchMfrs();
    }
  }, [role, showCreate]);

  const filtered = medicines.filter((m) => {
    const term = q.toLowerCase();
    return (
      m.id?.toLowerCase().includes(term) ||
      m.name?.toLowerCase().includes(term) ||
      m.manufacturer?.toLowerCase().includes(term) ||
      m.manufacturerId?.toLowerCase().includes(term) ||
      m.category?.toLowerCase().includes(term) ||
      m.batch?.toLowerCase().includes(term) ||
      m.description?.toLowerCase().includes(term)
    );
  });

  const [showEdit, setShowEdit] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [updating, setUpdating] = useState(false);

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error("Medicine name is required");
    if (!form.category.trim()) return toast.error("Category is required");
    if (!form.batch.trim()) return toast.error("Batch number is required");
    if (!form.price || Number(form.price) < 0) return toast.error("Valid price is required");
    if (form.stock === "" || Number(form.stock) < 0) return toast.error("Valid stock is required");
    if (!form.expiry) return toast.error("Expiry date is required");
    if (role === "admin" && !form.manufacturerId) return toast.error("Select a manufacturer");

    try {
      setCreating(true);
      await api.post("/medicines", {
        name: form.name.trim(),
        category: form.category.trim(),
        batch: form.batch.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        expiry: form.expiry,
        rx: form.rx,
        description: form.description.trim(),
        manufacturerId: role === "admin" ? form.manufacturerId : undefined,
      });
      toast.success("Medicine created successfully");
      setShowCreate(false);
      setForm(EMPTY_FORM);
      fetchMedicines(cat);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create medicine");
    } finally {
      setCreating(false);
    }
  };

  const handleEditClick = (m: Medicine) => {
    setEditingMedicine(m);
    setForm({
      name: m.name,
      category: m.category,
      batch: m.batch || "",
      price: m.price.toString(),
      stock: "0",
      expiry: m.expiry.split('T')[0],
      rx: m.rx || false,
      description: m.description || "",
      manufacturerId: m.manufacturerId,
    });
    setShowEdit(true);
  };

  const handleUpdate = async () => {
    if (!editingMedicine) return;
    if (!form.name.trim()) return toast.error("Medicine name is required");
    if (!form.category.trim()) return toast.error("Category is required");
    if (!form.batch.trim()) return toast.error("Batch number is required");
    if (!form.price || Number(form.price) < 0) return toast.error("Valid price is required");
    if (form.stock === "" || Number(form.stock) < 0) return toast.error("Valid stock is required");
    if (!form.expiry) return toast.error("Expiry date is required");

    try {
      setUpdating(true);
      await api.put(`/medicines/${editingMedicine.id}`, {
        name: form.name.trim(),
        category: form.category.trim(),
        batch: form.batch.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        expiry: form.expiry,
        rx: form.rx,
        description: form.description.trim(),
      });
      toast.success("Medicine updated successfully");
      setShowEdit(false);
      setEditingMedicine(null);
      setForm(EMPTY_FORM);
      fetchMedicines(cat);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update medicine");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader title="Medicine Catalog" description={loading ? "Loading..." : `${filtered.length} products available`}>
        {canCreate && (
          <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90" onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add medicine
          </Button>
        )}
      </PageHeader>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or manufacturer..."
            className="pl-8 h-9 bg-surface border-border text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCat(null)}
            className={`px-2.5 h-7 rounded-md border text-[11px] ${!cat ? "bg-primary/15 border-primary/40 text-primary" : "bg-surface border-border text-muted-foreground hover:text-foreground"}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-2.5 h-7 rounded-md border text-[11px] ${cat === c ? "bg-primary/15 border-primary/40 text-primary" : "bg-surface border-border text-muted-foreground hover:text-foreground"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="surface rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-5 w-12" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-8" /><Skeleton className="h-8" /><Skeleton className="h-8" />
              </div>
              <div className="pt-3 border-t border-border flex justify-between">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-7 w-12" />
              </div>
            </div>
          ))
        ) : (
          filtered.map((m) => (
            <Link
              to="/app/medicines/$id"
              params={{ id: m.id }}
              key={m.id}
              className="surface rounded-xl p-4 hover:border-border-strong transition-colors group block"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 grid place-items-center">
                  <Pill className="h-4 w-4 text-primary" />
                </div>
                {m.rx && (
                  <Badge
                    variant="outline"
                    className="text-[10px] border-warning/40 bg-warning/10 text-warning gap-1"
                  >
                    <ShieldAlert className="h-2.5 w-2.5" /> Rx
                  </Badge>
                )}
              </div>
              <h3 className="text-sm font-medium leading-tight">{m.name}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {m.manufacturer} · {m.category}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
                <div>
                  <div className="text-muted-foreground">Batch</div>
                  <div className="font-mono mt-0.5">{m.batch || "Hidden"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Stock</div>
                  <div className={`mt-0.5 ${m.stock < 50 ? "text-warning" : ""}`}>{m.stock}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Expiry</div>
                  <div className="mt-0.5">{m.expiry.slice(0, 7)}</div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <div className="text-base font-semibold tabular-nums">Rs {m.price.toFixed(2)}</div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-7 text-[11px] bg-primary hover:bg-primary/90 relative z-10"
                    disabled={busyItems.includes(m.id)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toast.promise(add(m.id, 1), {
                        loading: "Adding to cart...",
                        success: "Added to cart",
                        error: "Failed to add to cart"
                      });
                    }}
                  >
                    {busyItems.includes(m.id) ? "..." : "Add"}
                  </Button>
                  {(role === "admin" || (role === "manufacturer" && m.manufacturerId === user?.entityId)) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] border-border hover:bg-accent relative z-10"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEditClick(m);
                      }}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 text-sm text-muted-foreground">
          No medicines match your filters.
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              Add New Medicine
            </DialogTitle>
            <DialogDescription>Fill in the details to add a medicine to the catalog.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Medicine name"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Category *</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Analgesic"
                  className="h-9 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Batch *</Label>
                <Input
                  value={form.batch}
                  onChange={(e) => setForm({ ...form, batch: e.target.value })}
                  placeholder="e.g. B2024010"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Expiry *</Label>
                <Input
                  type="date"
                  value={form.expiry}
                  onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Price (Rs) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Stock *</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  placeholder="0"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {role === "admin" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Manufacturer *</Label>
                <select
                  value={form.manufacturerId}
                  onChange={(e) => setForm({ ...form, manufacturerId: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select manufacturer...</option>
                  {manufacturers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description"
                className="h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rx-check"
                checked={form.rx}
                onChange={(e) => setForm({ ...form, rx: e.target.checked })}
                className="rounded border-border"
              />
              <Label htmlFor="rx-check" className="text-xs cursor-pointer">Prescription required (Rx)</Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }} disabled={creating}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={creating} className="bg-primary hover:bg-primary/90">
              {creating ? "Creating..." : "Create Medicine"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              Edit Medicine
            </DialogTitle>
            <DialogDescription>Update the details for this medicine. Note: Entered stock will be added to current inventory.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Medicine name"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Category *</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Analgesic"
                  className="h-9 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Batch *</Label>
                <Input
                  value={form.batch}
                  onChange={(e) => setForm({ ...form, batch: e.target.value })}
                  placeholder="e.g. B2024010"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Expiry *</Label>
                <Input
                  type="date"
                  value={form.expiry}
                  onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Price (Rs) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-primary">Stock to Add *</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  placeholder="0"
                  className="h-9 text-xs border-primary/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description"
                className="h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rx-edit-check"
                checked={form.rx}
                onChange={(e) => setForm({ ...form, rx: e.target.checked })}
                className="rounded border-border"
              />
              <Label htmlFor="rx-edit-check" className="text-xs cursor-pointer">Prescription required (Rx)</Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => { setShowEdit(false); setEditingMedicine(null); setForm(EMPTY_FORM); }} disabled={updating}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleUpdate} disabled={updating} className="bg-primary hover:bg-primary/90">
              {updating ? "Updating..." : "Update Medicine"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
