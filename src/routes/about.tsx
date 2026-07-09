import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — KitVerse" }, { name: "description", content: "About KitVerse — Pakistan's favourite football jersey store." }] }),
...
        <h1 className="font-display text-5xl mb-6">About <span className="text-primary">KitVerse</span></h1>
        <p className="text-muted-foreground text-lg leading-relaxed">KitVerse is Pakistan's premier destination for football jerseys. We bring world-class quality kits to every football fan across the country — from Karachi to Khyber.</p>
        <p className="text-muted-foreground mt-4 leading-relaxed">Established by football fans, for football fans. We stock club jerseys, national team kits, retro classics and training gear. All orders come with Cash on Delivery and a 7-day return guarantee.</p>
        <div className="grid sm:grid-cols-3 gap-6 mt-10">
          {[{n:"10K+",l:"Happy Customers"},{n:"500+",l:"Jerseys Delivered Daily"},{n:"100%",l:"Genuine Quality"}].map((s)=>(
            <div key={s.l} className="text-center p-6 rounded-lg border border-border bg-card">
              <div className="font-display text-4xl text-primary">{s.n}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </SiteLayout>
  ),
});
