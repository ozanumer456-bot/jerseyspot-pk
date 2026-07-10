import { Link } from "@tanstack/react-router";
import { Search, ShoppingCart, Menu, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/store/cart";
import { useSettings } from "@/lib/settings";
import { useStorePath, useStoreSlug, DEFAULT_STORE_SLUG } from "@/lib/store-context";

export function Navbar() {
  const count = useCart((s) => s.count());
  const { settings } = useSettings();
  const sp = useStorePath();
  const slug = useStoreSlug();
  const [mounted, setMounted] = useState(false);
  const [q, setQ] = useState("");
  useEffect(() => { setMounted(true); }, []);

  const links = [
    { to: sp("/"), label: "Home" },
    { to: sp("/shop"), label: "Shop" },
    { to: sp("/about"), label: "About" },
    { to: sp("/contact"), label: "Contact" },
  ];
  const adminHref = slug === DEFAULT_STORE_SLUG ? "/admin" : `/store/${slug}/admin`;
  const shopSearch = (query: string) => `${sp("/shop")}?q=${encodeURIComponent(query)}`;

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        <Link to={sp("/") as any} className="flex items-center gap-2 shrink-0">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground font-display text-lg">{settings.logo_letter || "K"}</div>
          <span className="font-display text-2xl tracking-wide">{settings.store_name}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 ml-6">
          {links.map((l) => (
            <Link key={l.label} to={l.to as any} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        <form
          className="hidden md:flex flex-1 max-w-md ml-auto relative"
          onSubmit={(e) => { e.preventDefault(); if (q) window.location.href = shopSearch(q); }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search jerseys, teams..." className="pl-9 bg-secondary/50 border-border" />
        </form>

        <div className="flex items-center gap-2 md:ml-2 ml-auto">
          <Link to={adminHref as any}>
            <Button variant="ghost" size="icon" title="Admin"><Shield className="h-5 w-5" /></Button>
          </Link>
          <Link to={sp("/cart") as any} className="relative">
            <Button variant="ghost" size="icon"><ShoppingCart className="h-5 w-5" /></Button>
            {mounted && count > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-primary text-primary-foreground">{count}</Badge>
            )}
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-card">
              <SheetTitle className="font-display text-2xl">Menu</SheetTitle>
              <div className="mt-6 flex flex-col gap-1">
                {links.map((l) => (
                  <Link key={l.label} to={l.to as any} className="rounded-md px-3 py-3 text-base font-medium hover:bg-secondary">{l.label}</Link>
                ))}
                <form
                  className="mt-4 relative"
                  onSubmit={(e) => { e.preventDefault(); if (q) window.location.href = shopSearch(q); }}
                >
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="pl-9" />
                </form>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
