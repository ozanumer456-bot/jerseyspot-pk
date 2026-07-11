import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { SlidersHorizontal, Loader2 } from "lucide-react";
import { SIZES, TYPES, formatPKR, useProducts } from "@/lib/products";

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>) => ({ q: (s.q as string) || "", category: (s.category as string) || "" }),
  head: () => ({ meta: [{ title: "Shop Jerseys — KitVerse" }, { name: "description", content: "Browse all football jerseys, clubs, national teams and retro kits." }] }),
  component: () => {
    const { q, category } = Route.useSearch();
    return <ShopBody q={q} category={category} />;
  },
});

function Filters({ allTeams, teams, setTeams, sizes, setSizes, types, setTypes, price, setPrice }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg mb-3">Team</h3>
        <div className="space-y-2 max-h-60 overflow-auto pr-2">
          {allTeams.map((t: string) => (
            <label key={t} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={teams.includes(t)} onCheckedChange={(c) => setTeams(c ? [...teams, t] : teams.filter((x: string) => x !== t))} />
              <span className="text-sm">{t}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-display text-lg mb-3">Size</h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => {
            const active = sizes.includes(s);
            return (
              <button key={s} onClick={() => setSizes(active ? sizes.filter((x:string)=>x!==s) : [...sizes, s])}
                className={`h-9 min-w-10 px-3 rounded border text-sm font-semibold transition ${active ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}>{s}</button>
            );
          })}
        </div>
      </div>
      <div>
        <h3 className="font-display text-lg mb-3">Jersey Type</h3>
        <div className="space-y-2">
          {TYPES.map((t) => (
            <label key={t} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={types.includes(t)} onCheckedChange={(c) => setTypes(c ? [...types, t] : types.filter((x: string) => x !== t))} />
              <span className="text-sm">{t}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-display text-lg mb-3">Price Range</h3>
        <Slider value={price} onValueChange={setPrice} min={1000} max={5000} step={100} />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{formatPKR(price[0])}</span><span>{formatPKR(price[1])}</span>
        </div>
      </div>
    </div>
  );
}

export function ShopBody({ q = "", category = "" }: { q?: string; category?: string } = {}) {
  const [search, setSearch] = useState(q);
  const [teams, setTeams] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [price, setPrice] = useState<number[]>([1000, 5000]);
  const [sort, setSort] = useState("newest");

  const { data: all = [], isLoading, error } = useProducts();
  const allTeams = useMemo(() => Array.from(new Set(all.map((p) => p.team))).sort(), [all]);

  const products = useMemo(() => {
    let list = all.filter((p) => {
      const pr = p.salePrice ?? p.price;
      if (category && p.category?.toLowerCase() !== category.toLowerCase()) return false;
      if (search && !`${p.name} ${p.team}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (teams.length && !teams.includes(p.team)) return false;
      if (types.length && !types.includes(p.type)) return false;
      if (sizes.length && !sizes.some((s) => p.sizes.includes(s))) return false;
      if (pr < price[0] || pr > price[1]) return false;
      return true;
    });
    if (sort === "low") list = [...list].sort((a,b)=>(a.salePrice??a.price)-(b.salePrice??b.price));
    if (sort === "high") list = [...list].sort((a,b)=>(b.salePrice??b.price)-(a.salePrice??a.price));
    if (sort === "popular") list = [...list].sort((a,b)=>b.rating-a.rating);
    return list;
  }, [all, search, teams, sizes, types, price, sort, category]);

  const filterProps = { allTeams, teams, setTeams, sizes, setSizes, types, setTypes, price, setPrice };

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl">All Jerseys</h1>
          <p className="text-muted-foreground mt-1">{isLoading ? "Loading..." : `${products.length} products available`}</p>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-8">
          <aside className="hidden lg:block">
            <Filters {...filterProps} />
          </aside>
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Input placeholder="Search..." value={search} onChange={(e)=>setSearch(e.target.value)} className="max-w-xs" />
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden"><SlidersHorizontal className="h-4 w-4 mr-2" />Filters</Button>
                </SheetTrigger>
                <SheetContent side="left" className="bg-card overflow-auto">
                  <SheetTitle className="font-display text-2xl mb-4">Filters</SheetTitle>
                  <Filters {...filterProps} />
                </SheetContent>
              </Sheet>
              <div className="ml-auto">
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="low">Price: Low to High</SelectItem>
                    <SelectItem value="high">Price: High to Low</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error ? (
              <div className="py-20 text-center text-destructive">Failed to load products. Check your connection.</div>
            ) : isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4] w-full" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground"><Loader2 className="inline h-4 w-4 mr-2 opacity-0" />No jerseys match your filters.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {products.map((p) => <ProductCard key={p.id} p={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
