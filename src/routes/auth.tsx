import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { AmbientBackground, GlassCard } from "@/components/glass";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar no MotoFinance" },
      { name: "description", content: "Acesse sua conta e acompanhe o resultado da sua moto." },
      { property: "og:title", content: "Entrar no MotoFinance" },
      { property: "og:description", content: "Acesse sua conta e acompanhe o resultado da sua moto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app", replace: true });
    });
  }, [navigate]);

  const handle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password") ?? "");
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent("Enviamos um link de recuperação para o seu e-mail.");
        return;
      }
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { name: String(form.get("name") ?? "") },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSent("Conta criada! Confirme seu e-mail para entrar.");
          return;
        }
        toast.success("Conta criada com sucesso.");
        navigate({ to: "/app", replace: true });
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/app", replace: true });
    } catch (error) {
      toast.error((error as Error).message || "Não foi possível continuar.");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Não foi possível entrar com o Google.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/app", replace: true });
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-canvas px-5 py-10 text-foreground">
      <AmbientBackground />
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link to="/">
            <Logo />
          </Link>
        </div>
        <GlassCard>
          <h1 className="font-display text-2xl font-bold">
            {mode === "signin" ? "Entrar" : mode === "signup" ? "Criar conta" : "Recuperar senha"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "forgot"
              ? "Informe seu e-mail para receber o link de redefinição."
              : "Seu dinheiro. Sua moto. Seu resultado."}
          </p>

          {sent ? (
            <div className="glass-soft mt-5 p-4 text-sm text-positive">{sent}</div>
          ) : (
            <form className="mt-5 space-y-4" onSubmit={handle}>
              {mode === "signup" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" name="name" required className="h-12 text-base" placeholder="Seu nome" />
                </div>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" required className="h-12 text-base" />
              </div>
              {mode !== "forgot" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    className="h-12 text-base"
                  />
                </div>
              ) : null}
              <Button type="submit" className="h-12 w-full text-base" disabled={loading}>
                {loading
                  ? "Aguarde..."
                  : mode === "signin"
                    ? "Entrar"
                    : mode === "signup"
                      ? "Começar agora"
                      : "Enviar link"}
              </Button>
            </form>
          )}

          {mode !== "forgot" ? (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
              </div>
              <Button variant="outline" className="h-12 w-full text-base" onClick={google}>
                Continuar com Google
              </Button>
            </>
          ) : null}

          <div className="mt-6 space-y-2 text-center text-sm">
            {mode === "signin" ? (
              <>
                <button
                  type="button"
                  className="text-muted-foreground underline-offset-4 hover:underline"
                  onClick={() => {
                    setMode("forgot");
                    setSent(null);
                  }}
                >
                  Esqueci minha senha
                </button>
                <p className="text-muted-foreground">
                  Não tem conta?{" "}
                  <button
                    type="button"
                    className="font-semibold text-foreground underline-offset-4 hover:underline"
                    onClick={() => {
                      setMode("signup");
                      setSent(null);
                    }}
                  >
                    Criar agora
                  </button>
                </p>
              </>
            ) : (
              <button
                type="button"
                className="text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => {
                  setMode("signin");
                  setSent(null);
                }}
              >
                Voltar para o login
              </button>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
