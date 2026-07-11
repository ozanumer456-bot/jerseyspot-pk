import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, MessageCircle, Mail } from "lucide-react";
import { useSettings, waLink } from "@/lib/settings";
import { useStorePath } from "@/lib/store-context";

export function Footer() {
  const { settings } = useSettings();
  const sp = useStorePath();
  return (
    <footer className="mt-24 border-t border-border bg-card/40">
      <div className="container mx-auto px-4 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground font-display text-lg">{settings.logo_letter || "K"}</div>
            <span className="font-display text-2xl">{settings.store_name}</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{settings.tagline}</p>
        </div>
        <div>
          <h4 className="font-display text-lg mb-3">Shop</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to={sp("/shop") as any} className="hover:text-primary">All Jerseys</Link></li>
            <li><Link to={sp("/shop") as any} search={{ category: "club" } as any} className="hover:text-primary">Club Jerseys</Link></li>
            <li><Link to={sp("/shop") as any} search={{ category: "national" } as any} className="hover:text-primary">National Team</Link></li>
            <li><Link to={sp("/shop") as any} search={{ category: "retro" } as any} className="hover:text-primary">Retro</Link></li>
            <li><Link to={sp("/shop") as any} search={{ category: "training" } as any} className="hover:text-primary">Training</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-lg mb-3">Help</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to={sp("/about") as any} className="hover:text-primary">About Us</Link></li>
            <li><Link to={sp("/contact") as any} className="hover:text-primary">Contact</Link></li>
            <li>Shipping Info</li>
            <li>Returns</li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-lg mb-3">Connect</h4>
          <div className="flex gap-3">
            {settings.facebook_url && (
              <a aria-label="Facebook" target="_blank" rel="noopener noreferrer" className="grid h-9 w-9 place-items-center rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition" href={settings.facebook_url}><Facebook className="h-4 w-4" /></a>
            )}
            {settings.instagram_url && (
              <a aria-label="Instagram" target="_blank" rel="noopener noreferrer" className="grid h-9 w-9 place-items-center rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition" href={settings.instagram_url}><Instagram className="h-4 w-4" /></a>
            )}
            {settings.email && (
              <a aria-label="Email" className="grid h-9 w-9 place-items-center rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition" href={`mailto:${settings.email}`}><Mail className="h-4 w-4" /></a>
            )}
            <a aria-label="WhatsApp" target="_blank" rel="noopener noreferrer" className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground hover:opacity-90 transition" href={waLink(settings.whatsapp_number, `Hi, I want to order from ${settings.store_name}`)}><MessageCircle className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} {settings.store_name}. All rights reserved.</div>
    </footer>
  );
}
