import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, LogOut, ExternalLink, Pencil, Store as StoreIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, signOut } from "@/lib/auth";
import type { StoreRow } from "@/lib/store-context";
import { DEFAULT_STORE_SLUG } from "@/lib/store-context";
import { formatPKR } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/superadmin")({
  head: () => ({ meta: [{ title: "Superadmin — Multi-Store Control" }] }),
  component: SuperadminBody,
});

function useAllStores() {
  return useQuery({
    queryKey: ["all-stores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("stores" as any).select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return (data as unknown as StoreRow[]) ?? [];
    },
  });
}

function useAllOrders() {
  return useQuery({
    queryKey: ["all-orders-super"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders" as any).select("id, store_id, total, status, created_at");
      if (error) throw error;
      return (data as any[]) ?? [];
    },
  });
}

function SuperadminBody() {
  const navigate = useNavigate();
  const { user, isSuperadmin, loading } = useAuth();

  if (loading) return <div className="min-h-screen grid place-items-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user || !isSuperadmin) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-4">
        <Card className="p-8 max-w-md text-center bg-card border-border">
          <h1 className="font-display text-2xl mb-2">Not authorized</h1>
          <p className="text-sm text-muted-foreground mb-4">This area is restricted to platform superadmins.</p>
          <Link to="/"><Button variant="outline">Back home</Button></Link>
        </Card>
      </div>
    );
  }

  const logout = async () => { await signOut(); navigate({ to: "/auth" }); };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground font-display">S</div>
          <div>
            <div className="font-display text-xl leading-none">Superadmin</div>
            <div className="text-xs text-muted-foreground">Multi-store control panel</div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden md:inline">{user.email}</span>
            <Button variant="ghost" onClick={logout}><LogOut className="h-4 w-4 mr-2" />Logout</Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8 space-y-8">
        <Analytics />
        <StoresSection />
      </main>
    </div>
  );
}

function Analytics() {
  const { data: stores = [] } = useAllStores();
  const { data: orders = [], isLoading } = useAllOrders();

  const stats = useMemo(() => {
    const active = orders.filter((o) => o.status !== "cancelled");
    const revenue = active.reduce((s, o) => s + (o.total || 0), 0);
    const byStore = new Map<string, { revenue: number; count: number }>();
    for (const o of active) {
      const cur = byStore.get(o.store_id) || { revenue: 0, count: 0 };
      cur.revenue += o.total || 0; cur.count += 1;
      byStore.set(o.store_id, cur);
    }
    const board = stores.map((s) => ({
      store: s,
      revenue: byStore.get(s.id)?.revenue || 0,
      count: byStore.get(s.id)?.count || 0,
    })).sort((a, b) => b.revenue - a.revenue);
    return { revenue, orderCount: active.length, storeCount: stores.length, board };
  }, [stores, orders]);

  if (isLoading) return <Card className="p-10 text-center bg-card border-border"><Loader2 className="inline animate-spin h-6 w-6 text-primary" /></Card>;

  return (
    <div>
      <h2 className="font-display text-2xl mb-4">Cross-Store Analytics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { l: "Total Stores", v: stats.storeCount },
          { l: "Total Orders", v: stats.orderCount },
          { l: "Total Revenue", v: formatPKR(stats.revenue) },
          { l: "Avg / Store", v: formatPKR(Math.round(stats.revenue / Math.max(1, stats.storeCount))) },
        ].map((s) => (
          <Card key={s.l} className="p-5 bg-card border-border">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{s.l}</div>
            <div className="font-display text-2xl mt-2 text-primary">{s.v}</div>
          </Card>
        ))}
      </div>
      <Card className="p-5 bg-card border-border">
        <h3 className="font-display text-lg mb-4">Revenue Leaderboard</h3>
        {stats.board.length === 0 ? <p className="text-sm text-muted-foreground">No stores yet.</p> : (
          <div className="space-y-3">
            {stats.board.map((row, i) => {
              const max = stats.board[0].revenue || 1;
              const pct = (row.revenue / max) * 100;
              return (
                <div key={row.store.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold">{i + 1}. {row.store.store_name} <span className="text-muted-foreground font-normal">/{row.store.store_slug}</span></span>
                    <span className="text-primary">{row.count} orders · {formatPKR(row.revenue)}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded overflow-hidden"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function StoresSection() {
  const qc = useQueryClient();
  const { data: stores = [], isLoading } = useAllStores();
  const [editing, setEditing] = useState<StoreRow | null>(null);
  const [openCreate, setOpenCreate] = useState(false);

  const toggleStatus = async (s: StoreRow) => {
    const next = s.status === "active" ? "inactive" : "active";
    const { error } = await supabase.from("stores" as any).update({ status: next }).eq("id", s.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`${s.store_name} is now ${next}`);
    qc.invalidateQueries({ queryKey: ["all-stores"] });
    qc.invalidateQueries({ queryKey: ["store", s.store_slug] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl">Stores</h2>
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild><Button className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" />Create Store</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create New Store</DialogTitle></DialogHeader>
            <CreateStoreForm onClose={() => setOpenCreate(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <Card className="p-10 text-center bg-card border-border"><Loader2 className="inline animate-spin h-6 w-6 text-primary" /></Card> : (
        <Card className="bg-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left">
                <tr>
                  <th className="p-3">Store</th>
                  <th className="p-3">Slug</th>
                  <th className="p-3">Owner</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Impersonate</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {stores.map((s) => {
                  const adminHref = s.store_slug === DEFAULT_STORE_SLUG ? "/admin" : `/store/${s.store_slug}/admin`;
                  const publicHref = s.store_slug === DEFAULT_STORE_SLUG ? "/" : `/store/${s.store_slug}`;
                  return (
                    <tr key={s.id} className="border-t border-border">
                      <td className="p-3 font-semibold flex items-center gap-2">
                        <div className="grid h-8 w-8 place-items-center rounded bg-primary/15 text-primary font-display">{s.logo_letter || "S"}</div>
                        {s.store_name}
                      </td>
                      <td className="p-3 font-mono text-xs">/{s.store_slug}</td>
                      <td className="p-3 text-xs">{s.owner_email || <span className="text-muted-foreground">—</span>}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Switch checked={s.status === "active"} onCheckedChange={() => toggleStatus(s)} />
                          <Badge className={s.status === "active" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}>{s.status}</Badge>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <a href={publicHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><StoreIcon className="h-3.5 w-3.5" />Storefront</a>
                          <a href={adminHref} className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><ExternalLink className="h-3.5 w-3.5" />Admin</a>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => setEditing(s)}><Pencil className="h-4 w-4" /></Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Store Branding</DialogTitle></DialogHeader>
          {editing && <EditStoreForm store={editing} onClose={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateStoreForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    store_name: "", store_slug: "", owner_email: "",
    tagline: "Premium quality, delivered.", logo_letter: "S",
    primary_color: "#00FF87", secondary_color: "#0F1420",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const slug = f.store_slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
      if (!slug) throw new Error("Slug is required");
      const { error } = await supabase.from("stores" as any).insert({
        store_slug: slug,
        store_name: f.store_name,
        owner_email: f.owner_email || null,
        tagline: f.tagline,
        logo_letter: (f.logo_letter || "S").slice(0, 1).toUpperCase(),
        primary_color: f.primary_color,
        secondary_color: f.secondary_color,
        status: "active",
      });
      if (error) throw error;
      toast.success("Store created");
      qc.invalidateQueries({ queryKey: ["all-stores"] });
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create store");
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div><Label>Store Name</Label><Input required value={f.store_name} onChange={(e) => setF({ ...f, store_name: e.target.value })} /></div>
      <div><Label>URL Slug</Label><Input required value={f.store_slug} onChange={(e) => setF({ ...f, store_slug: e.target.value })} placeholder="my-store" /><p className="text-xs text-muted-foreground mt-1">Storefront will live at /store/{f.store_slug || "…"}</p></div>
      <div><Label>Owner Email</Label><Input type="email" value={f.owner_email} onChange={(e) => setF({ ...f, owner_email: e.target.value })} placeholder="owner@example.com" /><p className="text-xs text-muted-foreground mt-1">This user will get admin access after they sign up + verify email.</p></div>
      <div><Label>Tagline</Label><Input value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Logo Letter</Label><Input maxLength={1} value={f.logo_letter} onChange={(e) => setF({ ...f, logo_letter: e.target.value.slice(0, 1).toUpperCase() })} /></div>
        <div><Label>Primary</Label><input type="color" value={f.primary_color} onChange={(e) => setF({ ...f, primary_color: e.target.value })} className="h-10 w-full rounded border border-border bg-background" /></div>
        <div><Label>Secondary</Label><input type="color" value={f.secondary_color} onChange={(e) => setF({ ...f, secondary_color: e.target.value })} className="h-10 w-full rounded border border-border bg-background" /></div>
      </div>
      <DialogFooter><Button type="submit" disabled={busy} className="bg-primary text-primary-foreground">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Store"}</Button></DialogFooter>
    </form>
  );
}

function EditStoreForm({ store, onClose }: { store: StoreRow; onClose: () => void }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState<StoreRow>(store);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.from("stores" as any).update({
        store_name: f.store_name,
        tagline: f.tagline,
        logo_letter: (f.logo_letter || "S").slice(0, 1).toUpperCase(),
        primary_color: f.primary_color,
        secondary_color: f.secondary_color,
        hero_headline: f.hero_headline,
        hero_subheading: f.hero_subheading,
        hero_image_url: f.hero_image_url,
        whatsapp_number: f.whatsapp_number,
        email: f.email,
        instagram_url: f.instagram_url,
        facebook_url: f.facebook_url,
        karachi_shipping: f.karachi_shipping,
        other_city_shipping: f.other_city_shipping,
        free_shipping_above: f.free_shipping_above,
        owner_email: f.owner_email,
      }).eq("id", f.id);
      if (error) throw error;
      toast.success("Store updated");
      qc.invalidateQueries({ queryKey: ["all-stores"] });
      qc.invalidateQueries({ queryKey: ["store", f.store_slug] });
      onClose();
    } catch (err: any) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={save} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Store Name</Label><Input value={f.store_name} onChange={(e) => setF({ ...f, store_name: e.target.value })} /></div>
        <div><Label>Owner Email</Label><Input type="email" value={f.owner_email || ""} onChange={(e) => setF({ ...f, owner_email: e.target.value })} /></div>
      </div>
      <div><Label>Tagline</Label><Input value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Logo Letter</Label><Input maxLength={1} value={f.logo_letter} onChange={(e) => setF({ ...f, logo_letter: e.target.value.slice(0, 1).toUpperCase() })} /></div>
        <div><Label>Primary</Label><input type="color" value={f.primary_color} onChange={(e) => setF({ ...f, primary_color: e.target.value })} className="h-10 w-full rounded border border-border bg-background" /></div>
        <div><Label>Secondary</Label><input type="color" value={f.secondary_color} onChange={(e) => setF({ ...f, secondary_color: e.target.value })} className="h-10 w-full rounded border border-border bg-background" /></div>
      </div>
      <div><Label>Hero Headline</Label><Input value={f.hero_headline} onChange={(e) => setF({ ...f, hero_headline: e.target.value })} /></div>
      <div><Label>Hero Subheading</Label><Input value={f.hero_subheading} onChange={(e) => setF({ ...f, hero_subheading: e.target.value })} /></div>
      <div><Label>Hero Image URL</Label><Input value={f.hero_image_url} onChange={(e) => setF({ ...f, hero_image_url: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>WhatsApp</Label><Input value={f.whatsapp_number} onChange={(e) => setF({ ...f, whatsapp_number: e.target.value })} /></div>
        <div><Label>Email</Label><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div><Label>Instagram URL</Label><Input value={f.instagram_url} onChange={(e) => setF({ ...f, instagram_url: e.target.value })} /></div>
        <div><Label>Facebook URL</Label><Input value={f.facebook_url} onChange={(e) => setF({ ...f, facebook_url: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Karachi Ship</Label><Input type="number" value={f.karachi_shipping} onChange={(e) => setF({ ...f, karachi_shipping: +e.target.value })} /></div>
        <div><Label>Other Ship</Label><Input type="number" value={f.other_city_shipping} onChange={(e) => setF({ ...f, other_city_shipping: +e.target.value })} /></div>
        <div><Label>Free Above</Label><Input type="number" value={f.free_shipping_above} onChange={(e) => setF({ ...f, free_shipping_above: +e.target.value })} /></div>
      </div>
      <DialogFooter><Button type="submit" disabled={busy} className="bg-primary text-primary-foreground">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}</Button></DialogFooter>
    </form>
  );
}
