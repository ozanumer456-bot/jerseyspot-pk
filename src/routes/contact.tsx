import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — JerseyPK" }, { name: "description", content: "Get in touch with JerseyPK customer support." }] }),
  component: Contact,
});

function Contact() {
  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <h1 className="font-display text-5xl mb-8">Contact Us</h1>
        <div className="grid md:grid-cols-[1fr_1.5fr] gap-8">
          <div className="space-y-4">
            {[{i:Phone,l:"Call us",v:"+92 326 0035627"},{i:MessageCircle,l:"WhatsApp",v:"+92 326 0035627"},{i:Mail,l:"Email",v:"support@jerseypk.com"},{i:MapPin,l:"Address",v:"Karachi, Pakistan"}].map(({i:Icon,l,v})=>(
              <Card key={l} className="p-4 flex items-center gap-3 bg-card border-border">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary"><Icon className="h-5 w-5" /></div>
                <div><div className="text-xs text-muted-foreground">{l}</div><div className="font-semibold">{v}</div></div>
              </Card>
            ))}
          </div>
          <Card className="p-6 bg-card border-border">
            <form onSubmit={(e)=>{e.preventDefault(); toast.success("Message sent! We'll get back to you soon.");}} className="space-y-4">
              <div><Label>Name</Label><Input required /></div>
              <div><Label>Email</Label><Input required type="email" /></div>
              <div><Label>Message</Label><Textarea required rows={5} /></div>
              <Button type="submit" className="bg-primary text-primary-foreground w-full">Send Message</Button>
            </form>
          </Card>
        </div>
      </div>
    </SiteLayout>
  );
}
