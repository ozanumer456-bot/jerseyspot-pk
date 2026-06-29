import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Twitter, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-card/40">
      <div className="container mx-auto px-4 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground font-display text-lg">J</div>
            <span className="font-display text-2xl">Jersey<span className="text-primary">PK</span></span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Pakistan's favourite jersey store. Premium quality and cash on delivery, available across Pakistan.</p>
        </div>
        <div>
          <h4 className="font-display text-lg mb-3">Shop</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/shop" className="hover:text-primary">All Jerseys</Link></li>
            <li><Link to="/shop" className="hover:text-primary">Club Jerseys</Link></li>
            <li><Link to="/shop" className="hover:text-primary">National Team</Link></li>
            <li><Link to="/shop" className="hover:text-primary">Retro</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-lg mb-3">Help</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-primary">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
            <li>Shipping Info</li>
            <li>Returns</li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-lg mb-3">Connect</h4>
          <div className="flex gap-3">
            <a className="grid h-9 w-9 place-items-center rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition" href="#"><Facebook className="h-4 w-4" /></a>
            <a className="grid h-9 w-9 place-items-center rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition" href="#"><Instagram className="h-4 w-4" /></a>
            <a className="grid h-9 w-9 place-items-center rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition" href="#"><Twitter className="h-4 w-4" /></a>
            <a className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground hover:opacity-90 transition" href="https://wa.me/923260035627?text=Hi%2C%20I%20want%20to%20order%20a%20jersey"><MessageCircle className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} JerseyPK. All rights reserved.</div>
    </footer>
  );
}
