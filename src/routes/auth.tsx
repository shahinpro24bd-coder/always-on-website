import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamBrand } from "@/components/team-brand";
import { ArrowRight, LockKeyhole } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TEAM SHAHIN" },
      {
        name: "description",
        content: "Sign in to TEAM SHAHIN to access your private lead workspace.",
      },
      { property: "og:title", content: "Sign in — TEAM SHAHIN" },
      { property: "og:description", content: "Access your TEAM SHAHIN lead workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/leads" });
    });
  }, [navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/leads" });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account toiri hoyeche! Ekhon login korun.");
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/leads" });
  };

  return (
    <main className="auth-page min-h-screen px-5 py-8">
      <header className="mx-auto max-w-7xl"><TeamBrand /></header>
      <div className="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center py-12">
        <div className="mb-8">
          <div className="mb-5 flex size-12 items-center justify-center rounded-md border bg-card text-primary"><LockKeyhole className="size-6" /></div>
          <p className="mb-2 text-xs font-semibold uppercase text-primary">TEAM SHAHIN / Workspace</p>
          <h1 className="text-3xl font-semibold">Welcome back.</h1>
          <p className="mt-3 text-sm text-muted-foreground">Apnar account-e login korun.</p>
        </div>
      <Card className="w-full border shadow-[var(--shadow-panel)]">
        <CardHeader className="sr-only">
          <CardTitle>TEAM SHAHIN sign in</CardTitle>
          <CardDescription>Apnar account-e login korun.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            {(["login", "signup"] as const).map((tab) => (
              <TabsContent key={tab} value={tab}>
                <form onSubmit={tab === "login" ? signIn : signUp} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor={`${tab}-email`}>Email</Label>
                    <Input
                      id={`${tab}-email`}
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${tab}-password`}>Password</Label>
                    <Input
                      id={`${tab}-password`}
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Please wait…" : tab === "login" ? "Login" : "Create account"}
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </form>
              </TabsContent>
            ))}
          </Tabs>
          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={google}>
            Continue with Google
          </Button>
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-xs text-muted-foreground">TEAM SHAHIN · Private workspace</p>
      </div>
    </main>
  );
}
