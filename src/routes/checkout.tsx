import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/store/cart";
import { formatPKR } from "@/lib/products";
import { useSettings, waLink, shippingForCity } from "@/lib/settings";
import { useCurrentStore } from "@/lib/store-context";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";


export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — KitVerse" }] }),
  component: Checkout,
});

const payments = [
  { id: "cod", label: "Cash on Delivery", desc: "Pay when you receive your order" },
  { id: "easypaisa", label: "EasyPaisa", desc: "Mobile wallet payment" },
  { id: "jazzcash", label: "JazzCash", desc: "Mobile wallet payment" },
] as const;

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { settings } = useSettings();
  const { storeId } = useCurrentStore();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", phone: "", city: "", address: "", postal: "" });
  const [payment, setPayment] = useState<typeof payments[number]["id"]>("cod");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sub = subtotal();
  const cityShipping = shippingForCity(form.city, settings);
  const shipping = sub >= settings.free_shipping_above ? 0 : cityShipping;
  const total = sub + shipping;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.city || !form.address) return;
    if (!storeId) { toast.error("Store not loaded yet"); return; }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("place_order" as any, {
        p_store_id: storeId,
        p_customer_name: form.name,
        p_phone: form.phone,
        p_city: form.city,
        p_address: form.address,
        p_postal_code: form.postal || null,
        p_payment_method: payment,
        p_items: items.map((i) => ({ product_id: i.productId, name: i.name, size: i.size, quantity: i.quantity, price: i.price })),
        p_subtotal: sub,
        p_shipping: shipping,
        p_total: total,
      });
      if (error) throw error;
      const id = (data as string) || "";

      const short = id.slice(0, 8).toUpperCase();
      clear();
      qc.invalidateQueries({ queryKey: ["products"] });
      setOrderId(short);

      // WhatsApp confirmation
      const msg = `Thank you ${form.name}! Your KitVerse order #${short} has been confirmed. We will deliver soon. Total: ${formatPKR(total)}`;
      window.open(waLink(form.phone, msg), "_blank", "noopener,noreferrer");
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
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
                  <img src={i.image} alt="" onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400&h=500&fit=crop"; }} className="h-12 w-10 rounded object-cover" />
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
            <Button type="submit" size="lg" disabled={submitting} className="w-full mt-5 bg-primary text-primary-foreground hover:bg-primary/90">
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Placing...</> : "Place Order"}
            </Button>
          </Card>
        </form>
      </div>

      <Dialog open={!!orderId} onOpenChange={(o) => { if (!o) navigate({ to: "/" }); }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display text-2xl flex items-center gap-2"><CheckCircle2 className="text-primary" /> Order Placed!</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Thank you! Your order has been placed successfully.</p>
          <div className="p-4 bg-secondary rounded-lg">
            <div className="text-xs text-muted-foreground">Order ID</div>
            <div className="font-display text-2xl text-primary">JPK-{orderId}</div>
          </div>
          <p className="text-sm text-muted-foreground">A WhatsApp confirmation has opened — send it to receive updates.</p>
          <Button onClick={() => navigate({ to: "/" })} className="bg-primary text-primary-foreground">Continue Shopping</Button>
        </DialogContent>
      </Dialog>
    </SiteLayout>
  );
}
