import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { DEFAULT_STORE_SLUG } from "@/lib/store-context";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, isAdmin, isSuperadmin, adminStores, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    if (isSuperadmin) {
      navigate({ to: "/superadmin" });
      return;
    }
    if (isAdmin && adminStores.length > 0) {
      const first = adminStores[0];
      const target = first.store_slug === DEFAULT_STORE_SLUG ? "/admin" : `/store/${first.store_slug}/admin`;
      navigate({ to: target as any });
    }
  }, [user, isAdmin, isSuperadmin, adminStores, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        toast.success("Signed in");
      } else {
        const { error } = await supabase.auth.signUp({
          email, password: pw,
          options: { emailRedirectTo: window.location.origin + "/auth" },
        });
        if (error) throw error;
        toast.success("Check your email to verify, then sign in.");
        setMode("signin");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4">
      <Card className="p-8 w-full max-w-md bg-card border-border">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground font-display text-xl">K</div>
          <span className="font-display text-3xl">Sign in</span>
        </div>

        <div className="flex gap-1 p-1 bg-secondary rounded-md mb-4">
          <button type="button" onClick={() => setMode("signin")} className={`flex-1 py-2 rounded text-sm font-semibold ${mode === "signin" ? "bg-primary text-primary-foreground" : ""}`}>Sign In</button>
          <button type="button" onClick={() => setMode("signup")} className={`flex-1 py-2 rounded text-sm font-semibold ${mode === "signup" ? "bg-primary text-primary-foreground" : ""}`}>Sign Up</button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
          <div><Label>Password</Label><Input type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" /></div>
          <Button type="submit" disabled={busy} className="w-full bg-primary text-primary-foreground">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (mode === "signin" ? "Sign In" : "Create Account")}
          </Button>
          {user && !isAdmin && !isSuperadmin && (
            <p className="text-xs text-center text-destructive">Signed in, but this account has no admin access on any store.</p>
          )}
          <p className="text-xs text-center text-muted-foreground">
            <Link to="/" className="underline hover:text-primary">← Back to store</Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
