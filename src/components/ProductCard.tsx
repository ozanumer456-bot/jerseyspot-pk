import { Link } from "@tanstack/react-router";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPKR, type Product } from "@/lib/products";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { onImgError } from "@/lib/img-fallback";
import { useStoreSlug, DEFAULT_STORE_SLUG } from "@/lib/store-context";

export function ProductCard({ p }: { p: Product }) {
  const add = useCart((s) => s.add);
  const wish = useWishlist();
  const slug = useStoreSlug();
  const onSale = !!(p.salePrice && p.salePrice < p.price);
  const outOfStock = p.stock <= 0;
  const liked = wish.ids.includes(p.id);
  const productLink: any =
    slug === DEFAULT_STORE_SLUG
      ? { to: "/product/$id", params: { id: p.id } }
      : { to: "/store/$slug/product/$id", params: { slug, id: p.id } };

  return (
    <Card className="group relative overflow-hidden bg-card border-border hover:border-primary/60 transition-all hover:-translate-y-1 hover:glow-green p-0">
      <Link to="/product/$id" params={{ id: p.id }} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
          <img src={p.image} alt={p.name} loading="lazy" onError={onImgError} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {p.isNew && <Badge className="bg-primary text-primary-foreground">NEW</Badge>}
            {onSale && <Badge className="bg-destructive text-destructive-foreground">SALE</Badge>}
            {outOfStock && <Badge className="bg-secondary text-foreground">OUT OF STOCK</Badge>}
          </div>
          <button
            onClick={(e) => { e.preventDefault(); wish.toggle(p.id); }}
            className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-background/80 backdrop-blur hover:bg-primary hover:text-primary-foreground transition"
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-primary text-primary" : ""}`} />
          </button>
        </div>
      </Link>
      <div className="p-4 space-y-2">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">{p.team}</div>
        <Link to="/product/$id" params={{ id: p.id }} className="block">
          <h3 className="font-display text-lg leading-tight hover:text-primary transition-colors">{p.name}</h3>
        </Link>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-3.5 w-3.5 ${i < p.rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
          ))}
        </div>
        <div className="flex items-baseline gap-2">
          {onSale ? (
            <>
              <span className="font-display text-xl text-primary">{formatPKR(p.salePrice!)}</span>
              <span className="text-sm line-through text-muted-foreground">{formatPKR(p.price)}</span>
            </>
          ) : (
            <span className="font-display text-xl">{formatPKR(p.price)}</span>
          )}
        </div>
        <Button
          disabled={outOfStock}
          className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold disabled:opacity-50"
          onClick={() => {
            add({ productId: p.id, name: p.name, image: p.image, price: p.salePrice ?? p.price, size: p.sizes[0] });
            toast.success(`${p.name} added to cart`);
          }}
        >
          <ShoppingCart className="h-4 w-4 mr-2" /> {outOfStock ? "Out of Stock" : "Add to Cart"}
        </Button>
      </div>
    </Card>
  );
}
