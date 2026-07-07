import { useEffect } from "react";
import { useSettings } from "@/lib/settings";

function contrastOn(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return "#0F1420";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#0F1420" : "#FFFFFF";
}

/** Applies live branding (title + brand colors) from admin settings. Client-only. */
export function Branding() {
  const { settings } = useSettings();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const primary = settings.primary_color || "#00FF87";
    const secondary = settings.secondary_color || "#0F1420";
    const primaryFg = contrastOn(primary);

    root.style.setProperty("--primary", primary);
    root.style.setProperty("--primary-foreground", primaryFg);
    root.style.setProperty("--ring", primary);
    root.style.setProperty("--accent", primary);
    root.style.setProperty("--accent-foreground", primaryFg);
    root.style.setProperty("--sidebar-primary", primary);
    root.style.setProperty("--sidebar-primary-foreground", primaryFg);
    root.style.setProperty("--sidebar-ring", primary);
    root.style.setProperty("--brand-secondary", secondary);

    if (settings.store_name) {
      const name = settings.store_name;
      // Preserve any existing suffix after em-dash if present
      const current = document.title;
      const idx = current.indexOf(" — ");
      document.title = idx >= 0 ? `${name}${current.slice(idx)}` : name;
    }
  }, [settings.primary_color, settings.secondary_color, settings.store_name]);

  return null;
}
