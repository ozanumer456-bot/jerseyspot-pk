import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Heart, ShoppingCart, Truck, Shield, RefreshCw, Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatPKR, useProduct, useProducts } from "@/lib/products";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { onImgError } from "@/lib/img-fallback";
import { useStorePath } from "@/lib/store-context";

export const Route = createFileRoute("/product/$id")({
  component: () => {
    const { id } = Route.useParams();
    return <ProductBody id={id} />;
  },
});

export function ProductBody({ id }: { id: string }) {
  const { data: product, isLoading } = useProduct(id);
  const { data: all = [] } = useProducts();
  const navigate = useNavigate();
  const add = useCart((s) => s.add);
  const wish = useWishlist();
  const [size, setSize] = useState<string>("");
  const [qty, setQty] = useState(1);

  if (isLoading) {
    return <SiteLayout><div className="container mx-auto px-4 py-20 text-center"><Loader2 className="inline animate-spin h-6 w-6 text-primary" /></div></SiteLayout>;
  }
  if (!product) {
    return <SiteLayout><div className="container mx-auto px-4 py-20 text-center"><h1 className="font-display text-3xl">Product not found</h1><Link to="/shop" className="text-primary underline mt-4 inline-block">Back to shop</Link></div></SiteLayout>;
  }

  const activeSize = size || product.sizes[0] || "M";
  const price = product.salePrice ?? product.price;
  const outOfStock = product.stock <= 0;
  const related = all.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);

  const handleAdd = (buyNow = false) => {
    if (outOfStock) return;
    add({ productId: product.id, name: product.name, image: product.image, price, size: activeSize, quantity: qty });
    toast.success(`${product.name} (${activeSize}) × ${qty} added`);
    if (buyNow) navigate({ to: "/cart" });
  };

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-primary">Home</Link> / <Link to="/shop" className="hover:text-primary">Shop</Link> / <span>{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <div className="aspect-[4/5] rounded-xl overflow-hidden bg-secondary border border-border">
              <img src={product.image} alt={product.name} onError={onImgError} className="h-full w-full object-cover" />
            </div>
          </div>

          <div>
            <Badge className="bg-primary/15 text-primary border border-primary/40">{product.team}</Badge>
            <h1 className="font-display text-4xl mt-2">{product.name}</h1>
            <div className="flex items-baseline gap-3 mt-4">
              <span className="font-display text-4xl text-primary">{formatPKR(price)}</span>
              {product.salePrice && <span className="text-lg line-through text-muted-foreground">{formatPKR(product.price)}</span>}
            </div>
            {outOfStock ? (
              <Badge className="mt-3 bg-destructive text-destructive-foreground">OUT OF STOCK</Badge>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">In stock: {product.stock}</p>
            )}
            <p className="mt-4 text-muted-foreground">{product.description}</p>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Select Size</span>
                <Dialog>
                  <DialogTrigger className="text-xs text-primary underline">Size Guide</DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Size Guide</DialogTitle></DialogHeader>
                    <table className="w-full text-sm mt-2">
                      <thead><tr className="text-left border-b border-border"><th className="py-2">Size</th><th>Chest (in)</th><th>Length (in)</th></tr></thead>
                      <tbody>
                        {[["S","36-38","27"],["M","38-40","28"],["L","40-42","29"],["XL","42-44","30"],["XXL","44-46","31"]].map((r)=>(
                          <tr key={r[0]} className="border-b border-border"><td className="py-2 font-semibold">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button key={s} onClick={() => setSize(s)} className={`h-11 min-w-12 px-4 rounded-md border font-semibold transition ${activeSize===s?"bg-primary text-primary-foreground border-primary":"border-border hover:border-primary"}`}>{s}</button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center border border-border rounded-md">
                <button className="h-11 w-11 hover:bg-secondary" onClick={() => setQty(Math.max(1, qty-1))}>−</button>
                <span className="w-12 text-center font-semibold">{qty}</span>
                <button className="h-11 w-11 hover:bg-secondary" onClick={() => setQty(qty+1)}>+</button>
              </div>
              <Button size="lg" disabled={outOfStock} onClick={() => handleAdd(false)} className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 disabled:opacity-50"><ShoppingCart className="h-4 w-4 mr-2" />{outOfStock ? "Out of Stock" : "Add to Cart"}</Button>
              <Button size="lg" variant="outline" onClick={() => wish.toggle(product.id)}><Heart className={`h-4 w-4 ${wish.has(product.id)?"fill-primary text-primary":""}`} /></Button>
            </div>
            <Button size="lg" disabled={outOfStock} onClick={() => handleAdd(true)} variant="outline" className="w-full mt-3 border-primary text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-50">Buy Now</Button>

            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border text-center text-xs text-muted-foreground">
              <div><Truck className="h-5 w-5 mx-auto text-primary mb-1" />Free shipping above Rs. 2,000</div>
              <div><Shield className="h-5 w-5 mx-auto text-primary mb-1" />Genuine quality</div>
              <div><RefreshCw className="h-5 w-5 mx-auto text-primary mb-1" />7-day returns</div>
            </div>

            <Tabs defaultValue="desc" className="mt-8">
              <TabsList className="bg-secondary">
                <TabsTrigger value="desc">Description</TabsTrigger>
                <TabsTrigger value="size">Size Guide</TabsTrigger>
                <TabsTrigger value="ship">Shipping</TabsTrigger>
              </TabsList>
              <TabsContent value="desc" className="text-sm text-muted-foreground mt-4">{product.description} Premium fabric, breathable mesh, official-style team crest and sponsor prints.</TabsContent>
              <TabsContent value="size" className="text-sm text-muted-foreground mt-4">Please check size chart before ordering. Slim fit — size up for relaxed fit.</TabsContent>
              <TabsContent value="ship" className="text-sm text-muted-foreground mt-4">Delivery within 2-4 working days across Pakistan. COD available. Free shipping on orders above Rs. 2,000.</TabsContent>
            </Tabs>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="font-display text-3xl mb-6">Related Jerseys</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
