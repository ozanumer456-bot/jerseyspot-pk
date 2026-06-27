import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";
import { useCart } from "@/store/cart";
import { useAdmin, type Order } from "@/store/admin";
import { formatPKR } from "@/lib/products";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — JerseyPK" }] }),
  component: Checkout,
});

const payments = [
  { id: "COD", label: "Cash on Delivery", desc: "Pay when you receive your order" },
  { id: "EasyPaisa", label: "EasyPaisa", desc: "Mobile wallet payment" },
  { id: "JazzCash", label: "JazzCash", desc: "Mobile wallet payment" },
] as const;

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const addOrder = useAdmin((s) => s.addOrder);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", city: "", address: "", postal: "" });
  const [payment, setPayment] = useState<Order["payment"]>("COD");
  const [orderId, setOrderId] = useState<string | null>(null);

  const sub = subtotal();
  const shipping = sub >= 2000 ? 0 : 250;
  const total = sub + shipping;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.city || !form.address) return;
    const id = "JPK-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    addOrder({
      id, customer: form, payment, status: "Pending", total, createdAt: Date.now(),
      items: items.map((i) => ({ productId: i.productId, name: i.name, size: i.size, quantity: i.quantity, price: i.price })),
    });
    clear();
    setOrderId(id);
  };

  if (items.length === 0 && !orderId) {
    return <SiteLayout><div className="container mx-auto px-4 py-20 text-center"><p className="text-muted-foreground">Your cart is empty.</p><Link to="/shop"><Button className="mt-4 bg-primary text-primary-foreground">Shop</Button></Link></div></SiteLayout>;
  }

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="font-display text-4xl md:text-5xl mb-8">Checkout</h1>
        <form onSubmit={submit} className="grid lg:grid-cols-[1fr_380px] gap-8">
          <div className="space-y-6">
            <Card className="p-6 bg-card border-border">
              <h2 className="font-display text-xl mb-4">Delivery Details</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><Label>Full Name</Label><Input required value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} /></div>
                <div><Label>Phone Number</Label><Input required type="tel" placeholder="03XX-XXXXXXX" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} /></div>
                <div><Label>City</Label><Input required value={form.city} onChange={(e)=>setForm({...form, city:e.target.value})} /></div>
                <div className="md:col-span-2"><Label>Complete Address</Label><Input required value={form.address} onChange={(e)=>setForm({...form, address:e.target.value})} /></div>
                <div><Label>Postal Code</Label><Input value={form.postal} onChange={(e)=>setForm({...form, postal:e.target.value})} /></div>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border">
              <h2 className="font-display text-xl mb-4">Payment Method</h2>
              <div className="space-y-2">
                {payments.map((p) => (
                  <label key={p.id} className={`flex items-center gap-3 p-4 rounded border cursor-pointer transition ${payment===p.id?"border-primary bg-primary/10":"border-border"}`}>
                    <input type="radio" name="pay" checked={payment===p.id} onChange={()=>setPayment(p.id)} className="accent-[var(--primary)]" />
                    <div className="flex-1"><div className="font-semibold">{p.label}</div><div className="text-xs text-muted-foreground">{p.desc}</div></div>
                  </label>
                ))}
              </div>
            </Card>
          </div>

          <Card className="p-6 h-fit sticky top-24 bg-card border-border">
            <h2 className="font-display text-2xl mb-4">Order Summary</h2>
            <div className="space-y-2 max-h-60 overflow-auto pr-2">
              {items.map((i) => (
                <div key={i.id} className="flex gap-3 text-sm">
                  <img src={i.image} alt="" className="h-12 w-10 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{i.name}</div>
                    <div className="text-xs text-muted-foreground">{i.size} × {i.quantity}</div>
                  </div>
                  <div>{formatPKR(i.price * i.quantity)}</div>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="text-sm flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPKR(sub)}</span></div>
            <div className="text-sm flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{shipping===0?<span className="text-primary">FREE</span>:formatPKR(shipping)}</span></div>
            <Separator className="my-4" />
            <div className="flex justify-between font-display text-xl"><span>Total</span><span className="text-primary">{formatPKR(total)}</span></div>
            <Button type="submit" size="lg" className="w-full mt-5 bg-primary text-primary-foreground hover:bg-primary/90">Place Order</Button>
          </Card>
        </form>
      </div>

      <Dialog open={!!orderId} onOpenChange={(o) => { if (!o) navigate({ to: "/" }); }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display text-2xl flex items-center gap-2"><CheckCircle2 className="text-primary" /> Order Placed!</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Shukria! Your order has been placed successfully.</p>
          <div className="p-4 bg-secondary rounded-lg">
            <div className="text-xs text-muted-foreground">Order ID</div>
            <div className="font-display text-2xl text-primary">{orderId}</div>
          </div>
          <p className="text-sm text-muted-foreground">We'll contact you on your phone number shortly to confirm.</p>
          <Button onClick={() => navigate({ to: "/" })} className="bg-primary text-primary-foreground">Continue Shopping</Button>
        </DialogContent>
      </Dialog>
    </SiteLayout>
  );
}
