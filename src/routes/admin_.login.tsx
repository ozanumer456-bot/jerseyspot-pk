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

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin Login — JerseyPK" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && isAdmin) navigate({ to: "/admin" });
  }, [user, isAdmin, loading, navigate]);

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
          email,
          password: pw,
          options: { emailRedirectTo: window.location.origin + "/admin/login" },
        });
        if (error) throw error;
        toast.success("Check your email to verify, then sign in.");
        setMode("signin");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4">
      <Card className="p-8 w-full max-w-md bg-card border-border">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground font-display text-xl">J</div>
          <span className="font-display text-3xl">Jersey<span className="text-primary">PK</span> Admin</span>
        </div>

        <div className="flex gap-1 p-1 bg-secondary rounded-md mb-4">
          <button type="button" onClick={() => setMode("signin")} className={`flex-1 py-2 rounded text-sm font-semibold ${mode==="signin"?"bg-primary text-primary-foreground":""}`}>Sign In</button>
          <button type="button" onClick={() => setMode("signup")} className={`flex-1 py-2 rounded text-sm font-semibold ${mode==="signup"?"bg-primary text-primary-foreground":""}`}>Sign Up</button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div><Label>Email</Label><Input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" /></div>
          <div><Label>Password</Label><Input type="password" required minLength={6} value={pw} onChange={(e)=>setPw(e.target.value)} placeholder="••••••••" /></div>
          <Button type="submit" disabled={busy} className="w-full bg-primary text-primary-foreground">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (mode === "signin" ? "Sign In" : "Create Account")}
          </Button>
          {user && !isAdmin && (
            <p className="text-xs text-center text-destructive">Signed in but this account is not an admin. Only the allow-listed email gets admin access.</p>
          )}
          <p className="text-xs text-center text-muted-foreground">
            <Link to="/" className="underline hover:text-primary">← Back to store</Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
