import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { LayoutDashboard, Package, ShoppingBag, Users, Settings, LogOut, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdmin, type Order } from "@/store/admin";
import { formatPKR, type Product } from "@/lib/products";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — JerseyPK" }] }),
  component: Admin,
});

function Login() {
  const login = useAdmin((s) => s.login);
  const [pw, setPw] = useState("");
  return (
    <div className="min-h-screen grid place-items-center bg-background p-4">
      <Card className="p-8 w-full max-w-md bg-card border-border">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground font-display text-xl">J</div>
          <span className="font-display text-3xl">Jersey<span className="text-primary">PK</span> Admin</span>
        </div>
        <form onSubmit={(e)=>{e.preventDefault(); if(!login(pw)) toast.error("Wrong password");}} className="space-y-4">
          <div><Label>Password</Label><Input type="password" value={pw} onChange={(e)=>setPw(e.target.value)} placeholder="Enter admin password" /></div>
          <Button type="submit" className="w-full bg-primary text-primary-foreground">Sign In</Button>
          <p className="text-xs text-center text-muted-foreground">Default: <code>admin123</code></p>
        </form>
      </Card>
    </div>
  );
}

type Tab = "dashboard" | "products" | "orders" | "customers" | "settings";

function Admin() {
  const authed = useAdmin((s) => s.authed);
  const logout = useAdmin((s) => s.logout);
  const [tab, setTab] = useState<Tab>("dashboard");

  if (!authed) return <Login />;

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: Package },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "customers", label: "Customers", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

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
        {tab === "customers" && <Customers />}
        {tab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}

function Dashboard() {
  const orders = useAdmin((s) => s.orders);
  const products = useAdmin((s) => s.products);
  const today = new Date().setHours(0,0,0,0);
  const todayOrders = orders.filter((o) => o.createdAt >= today).length;
  const revenue = orders.reduce((s,o)=>s+o.total, 0);
  const stats = [
    { l: "Total Sales", v: orders.length },
    { l: "Orders Today", v: todayOrders },
    { l: "Revenue", v: formatPKR(revenue) },
    { l: "Total Products", v: products.length },
  ];
  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div><div className="font-semibold">{o.id}</div><div className="text-xs text-muted-foreground">{o.customer.name} · {o.customer.city}</div></div>
                <div className="text-primary font-semibold">{formatPKR(o.total)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ProductForm({ initial, onSave, onClose }: { initial?: Product; onSave: (p: Product) => void; onClose: () => void }) {
  const [p, setP] = useState<Product>(initial ?? { id: "p"+Date.now(), name: "", team: "", category: "Club", type: "Home", price: 0, image: "", sizes: ["S","M","L","XL"], stock: 0, description: "", rating: 4 });
  return (
    <form onSubmit={(e)=>{e.preventDefault(); onSave(p); onClose(); toast.success("Saved");}} className="space-y-3">
      <div><Label>Name</Label><Input required value={p.name} onChange={(e)=>setP({...p, name:e.target.value})} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Team</Label><Input required value={p.team} onChange={(e)=>setP({...p, team:e.target.value})} /></div>
        <div><Label>Stock</Label><Input type="number" value={p.stock} onChange={(e)=>setP({...p, stock:+e.target.value})} /></div>
        <div><Label>Price (PKR)</Label><Input type="number" required value={p.price} onChange={(e)=>setP({...p, price:+e.target.value})} /></div>
        <div><Label>Sale Price (optional)</Label><Input type="number" value={p.salePrice ?? ""} onChange={(e)=>setP({...p, salePrice:e.target.value?+e.target.value:undefined})} /></div>
      </div>
      <div><Label>Image URL</Label><Input value={p.image} onChange={(e)=>setP({...p, image:e.target.value})} placeholder="https://..." /></div>
      <div><Label>Sizes (comma separated)</Label><Input value={p.sizes.join(",")} onChange={(e)=>setP({...p, sizes:e.target.value.split(",").map(s=>s.trim())})} /></div>
      <div><Label>Description</Label><Input value={p.description} onChange={(e)=>setP({...p, description:e.target.value})} /></div>
      <DialogFooter><Button type="submit" className="bg-primary text-primary-foreground">Save Product</Button></DialogFooter>
    </form>
  );
}

function Products() {
  const { products, addProduct, updateProduct, deleteProduct } = useAdmin();
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl">Products</h1>
        <Dialog open={open} onOpenChange={(o)=>{setOpen(o); if(!o) setEditing(null);}}>
          <DialogTrigger asChild><Button onClick={()=>{setEditing(null);setOpen(true);}} className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" />Add Product</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing?"Edit":"Add"} Product</DialogTitle></DialogHeader>
            <ProductForm initial={editing ?? undefined} onClose={()=>{setOpen(false); setEditing(null);}} onSave={(p)=>{ editing ? updateProduct(p.id, p) : addProduct(p); }} />
          </DialogContent>
        </Dialog>
      </div>
      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left">
              <tr><th className="p-3">Image</th><th className="p-3">Name</th><th className="p-3">Team</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3"><img src={p.image} alt="" className="h-12 w-10 rounded object-cover" /></td>
                  <td className="p-3 font-semibold">{p.name}</td>
                  <td className="p-3 text-muted-foreground">{p.team}</td>
                  <td className="p-3 text-primary">{formatPKR(p.salePrice ?? p.price)}</td>
                  <td className="p-3">{p.stock}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" onClick={()=>{setEditing(p); setOpen(true);}}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={()=>{deleteProduct(p.id); toast.success("Deleted");}}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function statusColor(s: Order["status"]) {
  return s==="Pending"?"bg-yellow-500/20 text-yellow-300":s==="Confirmed"?"bg-blue-500/20 text-blue-300":s==="Shipped"?"bg-purple-500/20 text-purple-300":"bg-primary/20 text-primary";
}

function Orders() {
  const { orders, updateOrderStatus } = useAdmin();
  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Orders</h1>
      {orders.length===0 ? <Card className="p-10 text-center text-muted-foreground bg-card border-border">No orders yet.</Card> : (
        <Card className="bg-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left">
                <tr><th className="p-3">Order ID</th><th className="p-3">Customer</th><th className="p-3">Phone</th><th className="p-3">City</th><th className="p-3">Items</th><th className="p-3">Total</th><th className="p-3">Status</th></tr>
              </thead>
              <tbody>
                {orders.map((o)=>(
                  <tr key={o.id} className="border-t border-border">
                    <td className="p-3 font-mono text-xs">{o.id}</td>
                    <td className="p-3 font-semibold">{o.customer.name}</td>
                    <td className="p-3">{o.customer.phone}</td>
                    <td className="p-3">{o.customer.city}</td>
                    <td className="p-3">{o.items.reduce((s,i)=>s+i.quantity,0)}</td>
                    <td className="p-3 text-primary">{formatPKR(o.total)}</td>
                    <td className="p-3">
                      <Select value={o.status} onValueChange={(v)=>updateOrderStatus(o.id, v as Order["status"])}>
                        <SelectTrigger className={`w-36 ${statusColor(o.status)}`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Pending","Confirmed","Shipped","Delivered"].map((s)=><SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
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

function Customers() {
  const orders = useAdmin((s)=>s.orders);
  const customers = Array.from(new Map(orders.map((o)=>[o.customer.phone, o.customer])).values());
  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Customers</h1>
      {customers.length===0 ? <Card className="p-10 text-center text-muted-foreground bg-card border-border">No customers yet.</Card> : (
        <Card className="bg-card border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left">
              <tr><th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">City</th><th className="p-3">Orders</th></tr>
            </thead>
            <tbody>
              {customers.map((c)=>(
                <tr key={c.phone} className="border-t border-border">
                  <td className="p-3 font-semibold">{c.name}</td>
                  <td className="p-3">{c.phone}</td>
                  <td className="p-3">{c.city}</td>
                  <td className="p-3"><Badge className="bg-primary/15 text-primary">{orders.filter(o=>o.customer.phone===c.phone).length}</Badge></td>
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
  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Settings</h1>
      <Card className="p-6 bg-card border-border max-w-xl">
        <div className="space-y-4">
          <div><Label>Store Name</Label><Input defaultValue="JerseyPK" /></div>
          <div><Label>WhatsApp Number</Label><Input defaultValue="+92 300 0000000" /></div>
          <div><Label>Free Shipping Above (PKR)</Label><Input type="number" defaultValue={2000} /></div>
          <Button onClick={()=>toast.success("Settings saved")} className="bg-primary text-primary-foreground">Save Settings</Button>
        </div>
      </Card>
    </div>
  );
}
