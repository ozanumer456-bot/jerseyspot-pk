import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/store/cart";
import { formatPKR } from "@/lib/products";
import { useSettings } from "@/lib/settings";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your Cart — KitVerse" }] }),
  component: CartBody,
});

export function CartBody() {
  const { items, updateQty, remove, subtotal } = useCart();
  const { settings } = useSettings();
  const sub = subtotal();
  const estShipping = settings.other_city_shipping;
  const shipping = sub === 0 || sub >= settings.free_shipping_above ? 0 : estShipping;
  const total = sub + shipping;

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="font-display text-4xl md:text-5xl mb-8">Your Cart</h1>
        {items.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">Your cart is empty.</p>
            <Link to="/shop"><Button className="mt-4 bg-primary text-primary-foreground">Shop Jerseys</Button></Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_360px] gap-8">
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={item.id} className="p-4 grid grid-cols-[80px_1fr_auto] gap-4 items-center bg-card border-border">
                  <img src={item.image} alt={item.name} onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400&h=500&fit=crop"; }} className="h-24 w-20 rounded object-cover" />
                  <div className="min-w-0">
                    <div className="font-display text-lg truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground">Size: {item.size}</div>
                    <div className="text-primary font-semibold mt-1">{formatPKR(item.price)}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-border rounded">
                        <button className="h-8 w-8 hover:bg-secondary" onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
                        <span className="w-10 text-center text-sm">{item.quantity}</span>
                        <button className="h-8 w-8 hover:bg-secondary" onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => remove(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                  <div className="font-display text-lg text-right">{formatPKR(item.price * item.quantity)}</div>
                </Card>
              ))}
            </div>

            <Card className="p-6 h-fit sticky top-24 bg-card border-border">
              <h2 className="font-display text-2xl mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPKR(sub)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping (est.)</span><span>{shipping===0 ? <span className="text-primary">FREE</span> : formatPKR(shipping)}</span></div>
                {shipping > 0 && <div className="text-xs text-muted-foreground">Final shipping calculated by city at checkout. Add {formatPKR(settings.free_shipping_above - sub)} more for free shipping.</div>}
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between font-display text-xl"><span>Total</span><span className="text-primary">{formatPKR(total)}</span></div>
              <Link to="/checkout"><Button size="lg" className="w-full mt-5 bg-primary text-primary-foreground hover:bg-primary/90">Checkout <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            </Card>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
