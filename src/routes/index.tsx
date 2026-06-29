import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Truck, Shield, RefreshCw, Flame, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/lib/products";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JerseyPK — Pakistan's Favourite Jersey Store" },
      { name: "description", content: "Shop premium football jerseys with cash on delivery across Pakistan." },
    ],
  }),
  component: Home,
});

function nextMidnight() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

function Countdown() {
  const [diff, setDiff] = useState<number>(0);
  useEffect(() => {
    const tick = () => setDiff(Math.max(0, nextMidnight() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const h = String(Math.floor(diff / 3.6e6)).padStart(2, "0");
  const m = String(Math.floor((diff % 3.6e6) / 6e4)).padStart(2, "0");
  const s = String(Math.floor((diff % 6e4) / 1e3)).padStart(2, "0");
  return (
    <div className="flex gap-2 font-display text-3xl">
      {[h, m, s].map((v, i) => (
        <div key={i} className="grid place-items-center min-w-16 bg-background/40 backdrop-blur rounded-lg px-3 py-2 border border-primary/40">
          <span>{v}</span>
          <span className="text-[10px] font-sans text-muted-foreground tracking-wider">{["HRS","MIN","SEC"][i]}</span>
        </div>
      ))}
    </div>
  );
}


const categories = [
  { name: "Club Jerseys", img: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600&h=400&fit=crop", to: "Club" },
  { name: "National Team", img: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&h=400&fit=crop", to: "National" },
  { name: "Retro/Vintage", img: "https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=600&h=400&fit=crop", to: "Retro" },
  { name: "Training Kits", img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop", to: "Training" },
];

const testimonials = [
  { name: "Ali Raza", city: "Karachi", text: "The quality is outstanding! My Real Madrid jersey looks completely original, and delivery was very fast.", rating: 5 },
  { name: "Hamza Khan", city: "Lahore", text: "Best jersey store in Pakistan. With cash on delivery there is zero hassle.", rating: 5 },
  { name: "Bilal Ahmed", city: "Islamabad", text: "Ordered the Pakistan team jersey and it fit perfectly. Highly recommended!", rating: 5 },
];

function Home() {
  const { data: all = [] } = useProducts();
  const featured = all.slice(0, 8);
  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src="https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1920&h=1080&fit=crop" alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} className="h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        </div>
        <div className="container mx-auto px-4 py-20 md:py-32 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <Badge className="bg-primary/15 text-primary border border-primary/40 mb-4">⚡ Free Delivery Above Rs. 2,000</Badge>
            <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">
              Pakistan's <span className="text-gradient-green">Favourite</span><br />Jersey Store
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-lg">
              Premium football jerseys — every club and national team kit, delivered to your doorstep with Cash on Delivery.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-green">
                  Shop Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/shop">
                <Button size="lg" variant="outline" className="border-border">View Collection</Button>
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
              {[{i:Truck,t:"Free Shipping"},{i:Shield,t:"Genuine Quality"},{i:RefreshCw,t:"Easy Returns"}].map(({i:Icon,t}) => (
                <div key={t} className="text-center">
                  <Icon className="h-6 w-6 mx-auto text-primary" />
                  <div className="mt-1 text-xs text-muted-foreground">{t}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <img src="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&h=800&fit=crop" alt="Jersey" onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600&h=800&fit=crop"; }} className="relative rounded-2xl object-cover w-full h-[520px] border border-border" />
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-4xl">Shop by Category</h2>
            <p className="text-muted-foreground mt-1">Find your team, find your fit</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((c) => (
            <Link key={c.name} to="/shop" className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-border hover:border-primary transition">
              <img src={c.img} alt={c.name} onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600&h=400&fit=crop"; }} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
              <div className="absolute bottom-0 p-4">
                <h3 className="font-display text-2xl text-white">{c.name}</h3>
                <span className="text-sm text-primary group-hover:underline">Explore →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-4xl">Featured Jerseys</h2>
            <p className="text-muted-foreground mt-1">Top picks for this season</p>
          </div>
          <Link to="/shop" className="text-primary hover:underline text-sm font-semibold">View all →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {featured.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* FLASH SALE */}
      <section className="container mx-auto px-4 py-16">
        <Card className="relative overflow-hidden border-primary/40 bg-gradient-to-br from-primary/20 via-background to-background p-8 md:p-12">
          <Flame className="absolute -top-4 -right-4 h-48 w-48 text-primary/10" />
          <Badge className="bg-destructive">🔥 FLASH SALE</Badge>
          <h2 className="font-display text-4xl md:text-5xl mt-3">Up to 30% OFF — Limited Time!</h2>
          <p className="text-muted-foreground mt-2 max-w-xl">Hurry! Selected jerseys at slashed prices. Sale ends soon.</p>
          <div className="mt-6"><Countdown /></div>
          <Link to="/shop"><Button size="lg" className="mt-6 bg-primary text-primary-foreground">Grab Deals <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </Card>
      </section>

      {/* TESTIMONIALS */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-4xl">What Customers Say</h2>
          <p className="text-muted-foreground mt-1">Trusted by football fans across Pakistan</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <Card key={t.name} className="p-6 bg-card border-border hover:border-primary/60 transition">
              <div className="flex gap-1 mb-3">{Array.from({length:t.rating}).map((_,i)=><Star key={i} className="h-4 w-4 fill-primary text-primary" />)}</div>
              <p className="text-muted-foreground italic">"{t.text}"</p>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.city}</div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
