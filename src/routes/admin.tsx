import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LayoutDashboard, Package, ShoppingBag, Users, Settings, LogOut, Plus, Pencil, Trash2, Loader2, FileText, BarChart3, Eye, Download, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, signOut } from "@/lib/auth";
import { formatPKR, type Product, mapProduct, type DbProduct } from "@/lib/products";
import { useSettings, type Settings as Stg } from "@/lib/settings";
import { downloadInvoice, openInvoicePreview, invoiceWhatsAppLink, invoiceNumber, type InvoiceOrder } from "@/lib/invoice";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — JerseyPK" }] }),
  component: Admin,
});

type Order = {
  id: string;
  customer_name: string;
  phone: string;
  city: string;
  address: string;
  postal_code: string | null;
  payment_method: string;
  items: { product_id: string; name: string; size: string; quantity: number; price: number }[];
  subtotal: number;
  shipping: number;
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  created_at: string;
};

type Tab = "dashboard" | "products" | "orders" | "invoices" | "reports" | "customers" | "settings";

function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate({ to: "/admin/login" });
  }, [loading, user, isAdmin, navigate]);

  if (loading || !user || !isAdmin) {
    return <div className="min-h-screen grid place-items-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: Package },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "invoices", label: "Invoices", icon: FileText },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "customers", label: "Customers", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const logout = async () => {
    await signOut();
    navigate({ to: "/admin/login" });
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-sidebar p-4">
        <div className="flex items-center gap-2 mb-8">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground font-display">J</div>
          <span className="font-display text-xl">Admin</span>
        </div>
        <nav className="space-y-1 flex-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${tab===t.id?"bg-primary text-primary-foreground":"hover:bg-sidebar-accent"}`}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </nav>
        <div className="text-xs text-muted-foreground mb-2 px-2 truncate">{user.email}</div>
        <Button variant="ghost" onClick={logout} className="justify-start"><LogOut className="h-4 w-4 mr-2" />Logout</Button>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-x-auto">
        <div className="md:hidden flex gap-1 mb-6 overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-3 py-2 rounded text-xs whitespace-nowrap ${tab===t.id?"bg-primary text-primary-foreground":"bg-secondary"}`}>{t.label}</button>
          ))}
          <Button variant="ghost" size="sm" onClick={logout}><LogOut className="h-4 w-4" /></Button>
        </div>

        {tab === "dashboard" && <Dashboard />}
        {tab === "products" && <Products />}
        {tab === "orders" && <Orders />}
        {tab === "invoices" && <Invoices />}
        {tab === "reports" && <Reports />}
        {tab === "customers" && <Customers />}
        {tab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}

function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as Order[]) ?? [];
    },
  });
}

function useAdminProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return ((data as unknown as DbProduct[]) ?? []).map(mapProduct);
    },
  });
}

function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as { id: string; name: string; phone: string; city: string; total_orders: number; total_spent: number }[]) ?? [];
    },
  });
}

function Dashboard() {
  const { data: orders = [] } = useOrders();
  const { data: products = [] } = useAdminProducts();
  const { data: customers = [] } = useCustomers();
  const today = new Date(); today.setHours(0,0,0,0);
  const todayOrders = orders.filter((o) => new Date(o.created_at) >= today).length;
  const revenue = orders.filter((o) => o.status !== "cancelled").reduce((s,o)=>s+o.total, 0);
  const stats = [
    { l: "Revenue", v: formatPKR(revenue) },
    { l: "Total Orders", v: orders.length },
    { l: "Orders Today", v: todayOrders },
    { l: "Total Products", v: products.length },
    { l: "Customers", v: customers.length },
  ];
  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <Card key={s.l} className="p-5 bg-card border-border">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{s.l}</div>
            <div className="font-display text-3xl mt-2 text-primary">{s.v}</div>
          </Card>
        ))}
      </div>
      <Card className="mt-6 p-5 bg-card border-border">
        <h2 className="font-display text-xl mb-4">Recent Orders</h2>
        {orders.length === 0 ? <p className="text-sm text-muted-foreground">No orders yet.</p> : (
          <div className="space-y-2">
            {orders.slice(0,5).map((o)=>(
              <div key={o.id} className="flex items-center justify-between p-3 rounded border border-border">
                <div><div className="font-semibold font-mono text-xs">JPK-{o.id.slice(0,8).toUpperCase()}</div><div className="text-xs text-muted-foreground">{o.customer_name} · {o.city}</div></div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-secondary text-foreground capitalize">{o.status}</Badge>
                  <div className="text-primary font-semibold">{formatPKR(o.total)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

type ProductFormState = {
  id?: string;
  name: string; team: string; category: string; type: string;
  price: number; sale_price: number | null;
  sizes: string[]; image_url: string; stock: number;
  is_new: boolean; is_sale: boolean; description: string; rating: number;
};

function ProductForm({ initial, onClose }: { initial?: Product; onClose: () => void }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [p, setP] = useState<ProductFormState>(initial ? {
    id: initial.id, name: initial.name, team: initial.team, category: initial.category, type: initial.type,
    price: initial.price, sale_price: initial.salePrice ?? null,
    sizes: initial.sizes, image_url: initial.image, stock: initial.stock,
    is_new: !!initial.isNew, is_sale: !!initial.isSale, description: initial.description, rating: initial.rating,
  } : {
    name: "", team: "", category: "Club", type: "Home",
    price: 0, sale_price: null, sizes: ["S","M","L","XL"], image_url: "", stock: 0,
    is_new: false, is_sale: false, description: "", rating: 4,
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        name: p.name, team: p.team, category: p.category, type: p.type,
        price: p.price, sale_price: p.sale_price, sizes: p.sizes,
        image_url: p.image_url, stock: p.stock, is_new: p.is_new, is_sale: p.is_sale,
        description: p.description, rating: p.rating,
      };
      if (p.id) {
        const { error } = await supabase.from("products" as any).update(payload).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products" as any).insert(payload);
        if (error) throw error;
      }
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["products"] });
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-3">
      <div><Label>Name</Label><Input required value={p.name} onChange={(e)=>setP({...p, name:e.target.value})} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Team</Label><Input required value={p.team} onChange={(e)=>setP({...p, team:e.target.value})} /></div>
        <div><Label>Category</Label>
          <Select value={p.category} onValueChange={(v)=>setP({...p, category:v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["Club","National","Retro","Training"].map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Type</Label>
          <Select value={p.type} onValueChange={(v)=>setP({...p, type:v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["Home","Away","Third"].map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Stock</Label><Input type="number" value={p.stock} onChange={(e)=>setP({...p, stock:+e.target.value})} /></div>
        <div><Label>Price (PKR)</Label><Input type="number" required value={p.price} onChange={(e)=>setP({...p, price:+e.target.value})} /></div>
        <div><Label>Sale Price (optional)</Label><Input type="number" value={p.sale_price ?? ""} onChange={(e)=>setP({...p, sale_price:e.target.value?+e.target.value:null})} /></div>
      </div>
      <div><Label>Image URL</Label><Input value={p.image_url} onChange={(e)=>setP({...p, image_url:e.target.value})} placeholder="https://..." /></div>
      <div><Label>Sizes (comma separated)</Label><Input value={p.sizes.join(",")} onChange={(e)=>setP({...p, sizes:e.target.value.split(",").map(s=>s.trim()).filter(Boolean)})} /></div>
      <div><Label>Description</Label><Input value={p.description} onChange={(e)=>setP({...p, description:e.target.value})} /></div>
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={p.is_new} onChange={(e)=>setP({...p, is_new:e.target.checked})} /> New</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={p.is_sale} onChange={(e)=>setP({...p, is_sale:e.target.checked})} /> Sale</label>
      </div>
      <DialogFooter><Button type="submit" disabled={busy} className="bg-primary text-primary-foreground">{busy?<Loader2 className="h-4 w-4 animate-spin" />:"Save Product"}</Button></DialogFooter>
    </form>
  );
}

function Products() {
  const { data: products = [], isLoading } = useAdminProducts();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  const del = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products" as any).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl">Products</h1>
        <Dialog open={open} onOpenChange={(o)=>{setOpen(o); if(!o) setEditing(null);}}>
          <DialogTrigger asChild><Button onClick={()=>{setEditing(null);setOpen(true);}} className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" />Add Product</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing?"Edit":"Add"} Product</DialogTitle></DialogHeader>
            <ProductForm initial={editing ?? undefined} onClose={()=>{setOpen(false); setEditing(null);}} />
          </DialogContent>
        </Dialog>
      </div>
      <Card className="bg-card border-border overflow-hidden">
        {isLoading ? <div className="p-10 text-center"><Loader2 className="inline animate-spin h-6 w-6 text-primary" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left">
                <tr><th className="p-3">Image</th><th className="p-3">Name</th><th className="p-3">Team</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3"></th></tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="p-3"><img src={p.image} alt="" onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400&h=500&fit=crop"; }} className="h-12 w-10 rounded object-cover" /></td>
                    <td className="p-3 font-semibold">{p.name}</td>
                    <td className="p-3 text-muted-foreground">{p.team}</td>
                    <td className="p-3 text-primary">{formatPKR(p.salePrice ?? p.price)}</td>
                    <td className="p-3">{p.stock === 0 ? <span className="text-destructive">Out</span> : p.stock}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <Button variant="ghost" size="icon" onClick={()=>{setEditing(p); setOpen(true);}}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={()=>del(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function statusColor(s: Order["status"]) {
  return s==="pending"?"bg-yellow-500/20 text-yellow-300":s==="confirmed"?"bg-blue-500/20 text-blue-300":s==="shipped"?"bg-purple-500/20 text-purple-300":s==="delivered"?"bg-primary/20 text-primary":"bg-destructive/20 text-destructive";
}

function OrderActions({ o }: { o: Order }) {
  const { settings } = useSettings();
  const inv: InvoiceOrder = o as any;
  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" title="View invoice" onClick={() => openInvoicePreview(inv, settings)}><Eye className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" title="Download PDF" onClick={() => downloadInvoice(inv, settings)}><Download className="h-4 w-4" /></Button>
      <a href={invoiceWhatsAppLink(inv, settings)} target="_blank" rel="noreferrer" title="Send via WhatsApp" className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-secondary"><MessageCircle className="h-4 w-4 text-primary" /></a>
    </div>
  );
}

function Orders() {
  const { data: orders = [], isLoading } = useOrders();
  const qc = useQueryClient();

  const updateStatus = async (id: string, status: Order["status"]) => {
    const { error } = await supabase.from("orders" as any).update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["orders"] });
    toast.success("Status updated");
  };

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Orders</h1>
      {isLoading ? <Card className="p-10 text-center bg-card border-border"><Loader2 className="inline animate-spin h-6 w-6 text-primary" /></Card> :
       orders.length===0 ? <Card className="p-10 text-center text-muted-foreground bg-card border-border">No orders yet.</Card> : (
        <Card className="bg-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left">
                <tr><th className="p-3">Order ID</th><th className="p-3">Customer</th><th className="p-3">Phone</th><th className="p-3">City</th><th className="p-3">Items</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Invoice</th></tr>
              </thead>
              <tbody>
                {orders.map((o)=>(
                  <tr key={o.id} className="border-t border-border">
                    <td className="p-3 font-mono text-xs">{invoiceNumber(o.id)}</td>
                    <td className="p-3 font-semibold">{o.customer_name}</td>
                    <td className="p-3">{o.phone}</td>
                    <td className="p-3">{o.city}</td>
                    <td className="p-3">{(o.items || []).reduce((s,i)=>s+i.quantity,0)}</td>
                    <td className="p-3 text-primary">{formatPKR(o.total)}</td>
                    <td className="p-3">
                      <Select value={o.status} onValueChange={(v)=>updateStatus(o.id, v as Order["status"])}>
                        <SelectTrigger className={`w-36 ${statusColor(o.status)}`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["pending","confirmed","shipped","delivered","cancelled"].map((s)=><SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3"><OrderActions o={o} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function Invoices() {
  const { data: orders = [], isLoading } = useOrders();
  const { settings } = useSettings();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const t = new Date(o.created_at).getTime();
      if (from && t < new Date(from).getTime()) return false;
      if (to && t > new Date(to).getTime() + 86400000) return false;
      if (q) {
        const needle = q.toLowerCase();
        if (!o.customer_name.toLowerCase().includes(needle) && !invoiceNumber(o.id).toLowerCase().includes(needle) && !o.id.toLowerCase().includes(needle)) return false;
      }
      return true;
    });
  }, [orders, from, to, q]);

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Invoices</h1>
      <Card className="p-4 mb-4 bg-card border-border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div><Label className="text-xs">Search</Label><Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Customer or invoice ID" /></div>
          <div><Label className="text-xs">From</Label><Input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} /></div>
          <div><Label className="text-xs">To</Label><Input type="date" value={to} onChange={(e)=>setTo(e.target.value)} /></div>
          <div className="flex items-end"><Button variant="secondary" onClick={()=>{setFrom("");setTo("");setQ("");}}>Reset</Button></div>
        </div>
      </Card>
      {isLoading ? <Card className="p-10 text-center bg-card border-border"><Loader2 className="inline animate-spin h-6 w-6 text-primary" /></Card> :
       filtered.length===0 ? <Card className="p-10 text-center text-muted-foreground bg-card border-border">No invoices found.</Card> : (
        <Card className="bg-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left">
                <tr><th className="p-3">Invoice</th><th className="p-3">Date</th><th className="p-3">Customer</th><th className="p-3">City</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((o)=>(
                  <tr key={o.id} className="border-t border-border">
                    <td className="p-3 font-mono text-xs">{invoiceNumber(o.id)}</td>
                    <td className="p-3">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="p-3 font-semibold">{o.customer_name}</td>
                    <td className="p-3">{o.city}</td>
                    <td className="p-3 text-primary">{formatPKR(o.total)}</td>
                    <td className="p-3"><Badge className={statusColor(o.status)}>{o.status}</Badge></td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" title="View" onClick={() => openInvoicePreview(o as any, settings)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Download PDF" onClick={() => downloadInvoice(o as any, settings)}><Download className="h-4 w-4" /></Button>
                        <a href={invoiceWhatsAppLink(o as any, settings)} target="_blank" rel="noreferrer" title="WhatsApp" className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-secondary"><MessageCircle className="h-4 w-4 text-primary" /></a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function exportOrdersCSV(orders: Order[]) {
  const header = ["Invoice", "Date", "Customer", "Phone", "City", "Address", "Payment", "Status", "Items", "Subtotal", "Shipping", "Total"];
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = orders.map((o) => [
    invoiceNumber(o.id),
    new Date(o.created_at).toISOString(),
    o.customer_name, o.phone, o.city, o.address, o.payment_method, o.status,
    (o.items || []).map((i) => `${i.name} (${i.size || "-"}) x${i.quantity}`).join(" | "),
    o.subtotal, o.shipping, o.total,
  ].map(esc).join(","));
  const csv = [header.map(esc).join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `orders-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function Reports() {
  const { data: orders = [], isLoading } = useOrders();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const active = orders.filter((o) => o.status !== "cancelled");
  const revenueAll = active.reduce((s, o) => s + o.total, 0);
  const monthOrders = active.filter((o) => new Date(o.created_at).getTime() >= monthStart);
  const revenueMonth = monthOrders.reduce((s, o) => s + o.total, 0);

  const productSales = new Map<string, { name: string; qty: number; revenue: number }>();
  active.forEach((o) => (o.items || []).forEach((it) => {
    const cur = productSales.get(it.name) || { name: it.name, qty: 0, revenue: 0 };
    cur.qty += it.quantity;
    cur.revenue += it.price * it.quantity;
    productSales.set(it.name, cur);
  }));
  const top5 = [...productSales.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

  const karachiRev = active.filter((o) => o.city.trim().toLowerCase() === "karachi").reduce((s, o) => s + o.total, 0);
  const otherRev = revenueAll - karachiRev;
  const cityTotal = karachiRev + otherRev || 1;

  // Last 30 days daily counts
  const days: { label: string; count: number; revenue: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now); d.setHours(0,0,0,0); d.setDate(d.getDate() - i);
    const next = new Date(d); next.setDate(d.getDate() + 1);
    const dayOrders = active.filter((o) => {
      const t = new Date(o.created_at).getTime();
      return t >= d.getTime() && t < next.getTime();
    });
    days.push({
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count: dayOrders.length,
      revenue: dayOrders.reduce((s, o) => s + o.total, 0),
    });
  }
  const maxCount = Math.max(1, ...days.map((d) => d.count));

  if (isLoading) return <Card className="p-10 text-center bg-card border-border"><Loader2 className="inline animate-spin h-6 w-6 text-primary" /></Card>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-3xl">Reports</h1>
        <Button onClick={() => exportOrdersCSV(orders)} className="bg-primary text-primary-foreground"><Download className="h-4 w-4 mr-1" />Export Orders CSV</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { l: "Revenue (This Month)", v: formatPKR(revenueMonth) },
          { l: "Revenue (All Time)", v: formatPKR(revenueAll) },
          { l: "Orders This Month", v: monthOrders.length },
          { l: "Orders (All Time)", v: active.length },
        ].map((s) => (
          <Card key={s.l} className="p-5 bg-card border-border">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{s.l}</div>
            <div className="font-display text-2xl mt-2 text-primary">{s.v}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-5 bg-card border-border">
          <h2 className="font-display text-xl mb-4">Top 5 Best-Selling Products</h2>
          {top5.length === 0 ? <p className="text-sm text-muted-foreground">No sales yet.</p> : (
            <div className="space-y-3">
              {top5.map((p, i) => {
                const pct = (p.qty / top5[0].qty) * 100;
                return (
                  <div key={p.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold">{i + 1}. {p.name}</span>
                      <span className="text-primary">{p.qty} sold · {formatPKR(p.revenue)}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded overflow-hidden"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-5 bg-card border-border">
          <h2 className="font-display text-xl mb-4">Revenue by City</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1"><span>Karachi</span><span className="text-primary">{formatPKR(karachiRev)}</span></div>
              <div className="h-3 bg-secondary rounded overflow-hidden"><div className="h-full bg-primary" style={{ width: `${(karachiRev / cityTotal) * 100}%` }} /></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1"><span>Other Cities</span><span className="text-primary">{formatPKR(otherRev)}</span></div>
              <div className="h-3 bg-secondary rounded overflow-hidden"><div className="h-full bg-primary/60" style={{ width: `${(otherRev / cityTotal) * 100}%` }} /></div>
            </div>
            <div className="pt-2 text-xs text-muted-foreground">Total: {formatPKR(cityTotal === 1 ? 0 : cityTotal)}</div>
          </div>
        </Card>
      </div>

      <Card className="p-5 bg-card border-border">
        <h2 className="font-display text-xl mb-4">Daily Orders — Last 30 Days</h2>
        <div className="flex items-end gap-1 h-40">
          {days.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center group relative">
              <div className="w-full bg-primary/80 hover:bg-primary rounded-t transition-all" style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: d.count > 0 ? "4px" : "1px" }} title={`${d.label}: ${d.count} orders · ${formatPKR(d.revenue)}`} />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
          <span>{days[0].label}</span>
          <span>{days[Math.floor(days.length / 2)].label}</span>
          <span>{days[days.length - 1].label}</span>
        </div>
      </Card>
    </div>
  );
}

function Customers() {
  const { data: customers = [], isLoading } = useCustomers();
  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Customers</h1>
      {isLoading ? <Card className="p-10 text-center bg-card border-border"><Loader2 className="inline animate-spin h-6 w-6 text-primary" /></Card> :
       customers.length===0 ? <Card className="p-10 text-center text-muted-foreground bg-card border-border">No customers yet.</Card> : (
        <Card className="bg-card border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left">
              <tr><th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">City</th><th className="p-3">Orders</th><th className="p-3">Spent</th></tr>
            </thead>
            <tbody>
              {customers.map((c)=>(
                <tr key={c.id} className="border-t border-border">
                  <td className="p-3 font-semibold">{c.name}</td>
                  <td className="p-3">{c.phone}</td>
                  <td className="p-3">{c.city}</td>
                  <td className="p-3"><Badge className="bg-primary/15 text-primary">{c.total_orders}</Badge></td>
                  <td className="p-3 text-primary">{formatPKR(c.total_spent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function SettingsTab() {
  const { settings, isLoading } = useSettings();
  const qc = useQueryClient();
  const [form, setForm] = useState<Stg>(settings);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setForm(settings); }, [settings]);

  const save = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.from("settings" as any).update({
        store_name: form.store_name,
        tagline: form.tagline,
        primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        logo_letter: (form.logo_letter || "K").slice(0, 1),
        hero_headline: form.hero_headline,
        hero_subheading: form.hero_subheading,
        hero_image_url: form.hero_image_url,
        whatsapp_number: form.whatsapp_number,
        email: form.email,
        instagram_url: form.instagram_url,
        facebook_url: form.facebook_url,
        free_shipping_above: form.free_shipping_above,
        shipping_cost: form.shipping_cost,
        karachi_shipping: form.karachi_shipping,
        other_city_shipping: form.other_city_shipping,
      }).eq("id", form.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved — changes are live");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) return <Card className="p-10 text-center bg-card border-border"><Loader2 className="inline animate-spin h-6 w-6 text-primary" /></Card>;

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card className="p-6 bg-card border-border">
      <h2 className="font-display text-xl mb-4 text-primary">{title}</h2>
      <div className="space-y-4">{children}</div>
    </Card>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl">Store Customization</h1>
          <p className="text-sm text-muted-foreground mt-1">White-label your store — every change goes live instantly across the site.</p>
        </div>
        <Button onClick={save} disabled={busy} className="bg-primary text-primary-foreground">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save All Changes"}</Button>
      </div>

      <div className="grid gap-6 max-w-3xl">
        <Section title="Branding">
          <div><Label>Store Name</Label><Input value={form.store_name} onChange={(e)=>setForm({...form, store_name:e.target.value})} placeholder="KitVerse" /></div>
          <div><Label>Store Tagline</Label><Input value={form.tagline} onChange={(e)=>setForm({...form, tagline:e.target.value})} placeholder="Shown in the footer" /></div>
          <div><Label>Logo Letter (single character)</Label><Input maxLength={1} value={form.logo_letter} onChange={(e)=>setForm({...form, logo_letter:e.target.value.slice(0,1).toUpperCase()})} className="w-24 text-center font-display text-xl" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Primary Color</Label>
              <div className="flex gap-2 items-center">
                <input type="color" value={form.primary_color} onChange={(e)=>setForm({...form, primary_color:e.target.value})} className="h-10 w-14 rounded border border-border bg-background cursor-pointer" />
                <Input value={form.primary_color} onChange={(e)=>setForm({...form, primary_color:e.target.value})} placeholder="#00FF87" />
              </div>
            </div>
            <div>
              <Label>Secondary Color</Label>
              <div className="flex gap-2 items-center">
                <input type="color" value={form.secondary_color} onChange={(e)=>setForm({...form, secondary_color:e.target.value})} className="h-10 w-14 rounded border border-border bg-background cursor-pointer" />
                <Input value={form.secondary_color} onChange={(e)=>setForm({...form, secondary_color:e.target.value})} placeholder="#0F1420" />
              </div>
            </div>
          </div>
        </Section>

        <Section title="Hero Section">
          <div><Label>Hero Headline</Label><Input value={form.hero_headline} onChange={(e)=>setForm({...form, hero_headline:e.target.value})} /></div>
          <div><Label>Hero Subheading</Label><Input value={form.hero_subheading} onChange={(e)=>setForm({...form, hero_subheading:e.target.value})} /></div>
          <div><Label>Hero Image URL</Label><Input value={form.hero_image_url} onChange={(e)=>setForm({...form, hero_image_url:e.target.value})} placeholder="https://..." /></div>
        </Section>

        <Section title="Contact">
          <div><Label>WhatsApp Number</Label><Input value={form.whatsapp_number} onChange={(e)=>setForm({...form, whatsapp_number:e.target.value})} placeholder="+923XXXXXXXXX" /></div>
          <div><Label>Email Address</Label><Input type="email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} placeholder="support@yourstore.com" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Instagram URL</Label><Input value={form.instagram_url} onChange={(e)=>setForm({...form, instagram_url:e.target.value})} placeholder="https://instagram.com/..." /></div>
            <div><Label>Facebook URL</Label><Input value={form.facebook_url} onChange={(e)=>setForm({...form, facebook_url:e.target.value})} placeholder="https://facebook.com/..." /></div>
          </div>
        </Section>

        <Section title="Shipping">
          <div><Label>Free Shipping Above (PKR)</Label><Input type="number" value={form.free_shipping_above} onChange={(e)=>setForm({...form, free_shipping_above:+e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Karachi Shipping (PKR)</Label><Input type="number" value={form.karachi_shipping} onChange={(e)=>setForm({...form, karachi_shipping:+e.target.value})} /></div>
            <div><Label>Other Cities Shipping (PKR)</Label><Input type="number" value={form.other_city_shipping} onChange={(e)=>setForm({...form, other_city_shipping:+e.target.value})} /></div>
          </div>
        </Section>

        <div className="flex justify-end">
          <Button onClick={save} disabled={busy} size="lg" className="bg-primary text-primary-foreground">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save All Changes"}</Button>
        </div>
      </div>
    </div>
  );
}

