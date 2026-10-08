import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { ArrowRight, MailCheck } from "lucide-react";
import { EntryShell } from "@/components/EntryShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authErrorMessage, clearSafeReturnPath, peekSafeReturnPath } from "@/lib/auth-errors";
import { getEntryDestination } from "@/lib/entry-flow.functions";
import { formatBrazilianMobile, normalizeBrazilianMobile } from "@/lib/phone";
import { trackEvent, trackClick } from "@/lib/tracking";

export const Route = createFileRoute("/auth/")({
  head: () => ({ meta: [
    { title: "Entrar no Gestão Motoca Pro" },
    { name: "description", content: "Acesse ou crie sua conta no Gestão Motoca Pro." },
    { property: "og:title", content: "Entrar no Gestão Motoca Pro" },
    { property: "og:description", content: "Acesse ou crie sua conta no Gestão Motoca Pro." },
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
        if (data.user) trackEvent("Lead");
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

  const heading = sent
    ? { eyebrow: confirmationEmail ? "Conta criada" : "Link enviado", title: confirmationEmail ? "Quase lá." : "Confira seu e-mail.", subtitle: confirmationEmail ? <>Enviamos um link para <strong className="text-foreground">{confirmationEmail}</strong>. Confirme seu e-mail para entrar.</> : sent }
    : mode === "signin"
      ? { eyebrow: "Bem-vindo de volta", title: "Seu corre começa aqui.", subtitle: "Entre para continuar controlando seu dinheiro." }
      : mode === "signup"
        ? { eyebrow: "24 horas grátis · sem cartão", title: "Crie sua conta.", subtitle: "Leva menos de um minuto." }
        : { eyebrow: "Recuperar acesso", title: "Esqueceu sua senha?", subtitle: "Digite seu e-mail e enviaremos um link para criar uma nova senha." };
  const field = "h-14 rounded-2xl border-transparent bg-secondary px-4 text-base focus-visible:border-accent";

  return <EntryShell eyebrow={heading.eyebrow} title={heading.title} subtitle={heading.subtitle} stepKey={`${mode}-${sent ? 1 : 0}`}>
    {sent ? <div className="space-y-4">
      <div className="flex size-16 items-center justify-center rounded-full bg-positive/15 text-positive lp-pop"><MailCheck className="size-8" aria-hidden="true" /></div>
      {confirmationEmail ? <Button type="button" variant="outline" className="h-14 w-full rounded-full text-sm font-bold uppercase tracking-wider" disabled={loading} onClick={resendConfirmation}>{loading ? "Enviando..." : "Reenviar e-mail"}</Button> : null}
      <button type="button" className="min-h-12 w-full text-sm font-semibold text-muted-foreground hover:text-foreground" onClick={() => changeMode("signin")}>Voltar para o login</button>
    </div> : <form className="space-y-4" onSubmit={handle}>
      {mode === "signup" ? <><div className="space-y-1.5"><Label htmlFor="name">Nome completo</Label><Input id="name" name="name" required minLength={2} maxLength={100} autoComplete="name" className={field} placeholder="Seu nome completo" /></div><div className="space-y-1.5"><Label htmlFor="phone">WhatsApp / Celular</Label><Input id="phone" name="phone" type="tel" required inputMode="tel" autoComplete="tel-national" className={field} placeholder="(31) 99999-9999" value={phone} onChange={(event)=>setPhone(formatBrazilianMobile(event.target.value))} maxLength={15} /></div></> : null}
      <div className="space-y-1.5"><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" required maxLength={320} autoComplete="email" className={field} placeholder="voce@email.com" /></div>
      {mode !== "forgot" ? <div className="space-y-1.5"><div className="flex items-center justify-between"><Label htmlFor="password">Senha</Label>{mode === "signin" ? <button type="button" className="text-xs font-semibold text-muted-foreground hover:text-accent" onClick={() => changeMode("forgot")}>Esqueci minha senha</button> : null}</div><Input id="password" name="password" type="password" required minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} className={field} />{mode === "signup" ? <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres, com letra e número.</p> : null}</div> : null}
      {mode === "signup" ? <div className="space-y-1.5"><Label htmlFor="confirmation">Confirmar senha</Label><Input id="confirmation" name="confirmation" type="password" required minLength={8} autoComplete="new-password" className={field} /></div> : null}
      <Button type="submit" className="mt-2 h-14 w-full rounded-full text-sm font-bold uppercase tracking-wider transition-transform hover:-translate-y-0.5" disabled={loading || googleLoading} onClick={() => trackClick(mode === "signup" ? "Criar conta" : "Entrar")}>{loading ? "Aguarde..." : mode === "signin" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"}{loading ? null : <ArrowRight />}</Button>
    </form>}
    {!sent && mode !== "forgot" ? <><div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" /></div><Button variant="ghost" className="h-14 w-full rounded-full border border-border text-sm font-semibold" onClick={google} disabled={googleLoading || loading}><GoogleIcon />{googleLoading ? "Abrindo Google..." : "Continuar com Google"}</Button></> : null}
    {!sent ? <div className="mt-8 text-center text-sm">{mode === "signin" ? <p className="text-muted-foreground">Ainda não tem conta? <button type="button" className="min-h-12 font-bold text-foreground underline-offset-4 hover:text-accent" onClick={() => changeMode("signup")}>Criar minha conta</button></p> : mode === "signup" ? <p className="text-muted-foreground">Já tem conta? <button type="button" className="min-h-12 font-bold text-foreground hover:text-accent" onClick={() => changeMode("signin")}>Entrar</button></p> : <button type="button" className="min-h-12 font-semibold text-muted-foreground hover:text-foreground" onClick={() => changeMode("signin")}>Voltar para o login</button>}</div> : null}
  </EntryShell>;
}

function GoogleIcon() {
  return <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true"><path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.7-2.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg>;
}
