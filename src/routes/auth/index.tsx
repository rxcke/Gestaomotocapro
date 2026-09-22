import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { AmbientBackground, GlassCard } from "@/components/glass";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authErrorMessage, clearSafeReturnPath, peekSafeReturnPath } from "@/lib/auth-errors";
import { getEntryDestination } from "@/lib/entry-flow.functions";
import { formatBrazilianMobile, normalizeBrazilianMobile } from "@/lib/phone";

export const Route = createFileRoute("/auth/")({
  head: () => ({ meta: [
    { title: "Entrar no Gestão Motoboy" },
    { name: "description", content: "Acesse ou crie sua conta no Gestão Motoboy." },
    { property: "og:title", content: "Entrar no Gestão Motoboy" },
    { property: "og:description", content: "Acesse ou crie sua conta no Gestão Motoboy." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [phone, setPhone] = useState("");
  const resolveEntry = useServerFn(getEntryDestination);

  const continueIntoApp = useCallback(async () => {
    const intendedPath = peekSafeReturnPath();
    const destination = await resolveEntry({ data: { intendedPath } });
    clearSafeReturnPath();
    await navigate({ href: destination, replace: true });
  }, [navigate, resolveEntry]);

  useEffect(() => {
    const requestedMode = new URLSearchParams(window.location.search).get("mode");
    if (requestedMode === "signup" || requestedMode === "forgot" || requestedMode === "signin") setMode(requestedMode);
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void continueIntoApp();
    });
  }, [continueIntoApp]);

  const changeMode = (next: Mode) => {
    setMode(next);
    setSent(null);
    setConfirmationEmail("");
  };

  const handle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    const name = String(form.get("name") ?? "").trim();
    const normalizedPhone = normalizeBrazilianMobile(phone);

    if (email.length > 320) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    if (mode === "signup" && (name.length < 2 || name.length > 100)) {
      toast.error("Informe seu nome com 2 a 100 caracteres.");
      return;
    }
    if (mode === "signup" && !normalizedPhone) {
      toast.error("Informe um celular brasileiro válido com DDD.");
      return;
    }
    if (mode !== "forgot" && (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password))) {
      toast.error("Use pelo menos 8 caracteres, com letra e número.");
      return;
    }
    if (mode === "signup" && password !== confirmation) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setSent("Enviamos um link de recuperação para o seu e-mail.");
        return;
      }
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback`, data: { name, phone: normalizedPhone } },
        });
        if (error) throw error;
        if (!data.session) {
          setConfirmationEmail(email);
          setSent("Conta criada! Confirme seu e-mail para entrar.");
          return;
        }
        toast.success("Conta criada com sucesso.");
        await continueIntoApp();
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await continueIntoApp();
    } catch (error) {
      toast.error(authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth/callback`,
        extraParams: { prompt: "select_account" },
      });
      if (result.error) {
        toast.error("O acesso pelo Google foi cancelado ou não pôde ser concluído.");
        return;
      }
      if (result.redirected) return;
      await continueIntoApp();
    } finally {
      setGoogleLoading(false);
    }
  };

  const resendConfirmation = async () => {
    if (!confirmationEmail || loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email: confirmationEmail, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
      if (error) throw error;
      toast.success("Novo e-mail de confirmação enviado.");
    } catch (error) {
      toast.error(authErrorMessage(error, "Não foi possível reenviar a confirmação."));
    } finally {
      setLoading(false);
    }
  };

  return <div className="relative flex min-h-dvh items-center justify-center bg-canvas px-5 py-10 text-foreground">
    <AmbientBackground />
    <div className="relative w-full max-w-md">
      <div className="mb-6 flex justify-center"><Link to="/"><Logo /></Link></div>
      <GlassCard>
        <h1 className="font-display text-2xl font-bold">{mode === "signin" ? "Entrar" : mode === "signup" ? "Criar conta" : "Recuperar senha"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{mode === "forgot" ? "Informe seu e-mail para receber o link de redefinição." : "Seu dinheiro. Sua moto. Seu resultado."}</p>
        {sent ? <div className="glass-soft mt-5 p-4 text-sm text-positive"><p>{sent}</p>{confirmationEmail ? <Button type="button" variant="outline" className="mt-4 w-full" disabled={loading} onClick={resendConfirmation}>{loading ? "Enviando..." : "Reenviar confirmação"}</Button> : null}</div> : <form className="mt-5 space-y-4" onSubmit={handle}>
          {mode === "signup" ? <><div className="space-y-1.5"><Label htmlFor="name">Nome completo *</Label><Input id="name" name="name" required minLength={2} maxLength={100} autoComplete="name" className="h-12 text-base" placeholder="Seu nome completo" /></div><div className="space-y-1.5"><Label htmlFor="phone">WhatsApp / Celular *</Label><Input id="phone" name="phone" type="tel" required inputMode="tel" autoComplete="tel-national" className="h-12 text-base" placeholder="(31) 99999-9999" value={phone} onChange={(event)=>setPhone(formatBrazilianMobile(event.target.value))} maxLength={15} /></div></> : null}
          <div className="space-y-1.5"><Label htmlFor="email">E-mail{mode === "signup" ? " *" : ""}</Label><Input id="email" name="email" type="email" required maxLength={320} autoComplete="email" className="h-12 text-base" /></div>
          {mode !== "forgot" ? <div className="space-y-1.5"><Label htmlFor="password">Senha{mode === "signup" ? " *" : ""}</Label><Input id="password" name="password" type="password" required minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} className="h-12 text-base" /></div> : null}
          {mode === "signup" ? <div className="space-y-1.5"><Label htmlFor="confirmation">Confirmar senha *</Label><Input id="confirmation" name="confirmation" type="password" required minLength={8} autoComplete="new-password" className="h-12 text-base" /></div> : null}
          <Button type="submit" className="h-12 w-full text-base" disabled={loading || googleLoading}>{loading ? "Aguarde..." : mode === "signin" ? "Entrar" : mode === "signup" ? "Começar agora" : "Enviar link"}</Button>
        </form>}
        {mode !== "forgot" ? <><div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" /></div><Button variant="outline" className="h-12 w-full text-base" onClick={google} disabled={googleLoading || loading}>{googleLoading ? "Abrindo Google..." : "Continuar com Google"}</Button></> : null}
        <div className="mt-6 space-y-2 text-center text-sm">{mode === "signin" ? <><button type="button" className="text-muted-foreground underline-offset-4 hover:underline" onClick={() => changeMode("forgot")}>Esqueci minha senha</button><p className="text-muted-foreground">Não tem conta? <button type="button" className="font-semibold text-foreground underline-offset-4 hover:underline" onClick={() => changeMode("signup")}>Criar agora</button></p></> : <button type="button" className="text-muted-foreground underline-offset-4 hover:underline" onClick={() => changeMode("signin")}>Voltar para o login</button>}</div>
      </GlassCard>
    </div>
  </div>;
}
