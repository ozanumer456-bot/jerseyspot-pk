import { MessageCircle } from "lucide-react";
import { useSettings, waLink } from "@/lib/settings";

export function WhatsAppButton() {
  const { settings } = useSettings();
  return (
    <a
      href={waLink(settings.whatsapp_number, "Hi, I want to order a jersey")}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground glow-green hover:scale-110 transition-transform"
      aria-label="WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
