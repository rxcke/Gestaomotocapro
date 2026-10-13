import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EntryShell } from "@/components/EntryShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authErrorMessage } from "@/lib/auth-errors";
import { isRecoverySession, recoveryLinkError } from "@/lib/recovery-session";

export const Route = createFileRoute("/reset-password")({
  staticData: { sitemap: false },
  ssr: false,
  head: () => ({
    meta: [
      { title: "Redefinir senha — Gestão Motoca Pro" },
      { name: "description", content: "Defina uma nova senha para sua conta Gestão Motoca Pro." },
      { property: "og:title", content: "Redefinir senha — Gestão Motoca Pro" },
      { property: "og:description", content: "Defina uma nova senha para sua conta Gestão Motoca Pro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [validRecovery, setValidRecovery] = useState(false);

  useEffect(() => {
    let active = true;
    // Captured before the auth client clears the URL; a link error always wins.
    const linkError = recoveryLinkError(window.location.hash, window.location.search);
    const decide = (accessToken: string | null | undefined) => {
      if (!active) return;
      setValidRecovery(!linkError && isRecoverySession(accessToken));
      setChecking(false);
    };
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") decide(session?.access_token);
    });
    // getSession waits for the client to finish processing the link, so a
    // recovery confirmed before this page mounted is still recognised here.
    void supabase.auth.getSession().then(({ data: sessionData }) => decide(sessionData.session?.access_token));
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    const confirmation = String(form.get("confirmation"));
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      toast.error("Use pelo menos 8 caracteres, com letra e número.");
      return;
    }
    if (password !== confirmation) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(authErrorMessage(error, "Não foi possível atualizar a senha."));
      return;
    }
    toast.success("Senha alterada. Bora voltar pro corre! 🏍️");
    navigate({ to: "/app", replace: true });
  };

  const field = "h-14 rounded-2xl border-transparent bg-secondary px-4 text-base focus-visible:border-accent";
  return (
    <EntryShell
      eyebrow="Nova senha"
      title={checking ? "Verificando seu link..." : validRecovery ? "Crie uma nova senha." : "Esse link expirou."}
      subtitle={checking ? "Aguarde só um instante." : validRecovery ? "Mínimo de 8 caracteres, com letra e número." : "Peça um novo link para redefinir sua senha."}
      stepKey={checking ? 0 : validRecovery ? 1 : 2}
    >
      {checking ? <div className="h-14 animate-pulse rounded-2xl bg-secondary" /> : validRecovery ? <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-1.5"><Label htmlFor="password">Nova senha</Label><Input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" className={field} /></div>
        <div className="space-y-1.5"><Label htmlFor="confirmation">Confirmar nova senha</Label><Input id="confirmation" name="confirmation" type="password" minLength={8} required autoComplete="new-password" className={field} /></div>
        <Button type="submit" className="mt-2 h-14 w-full rounded-full text-sm font-bold uppercase tracking-wider" disabled={loading}>{loading ? "Salvando..." : "Alterar senha"}</Button>
      </form> : <Button className="h-14 w-full rounded-full text-sm font-bold uppercase tracking-wider" onClick={() => navigate({ to: "/auth", replace: true })}>Voltar para entrar</Button>}
    </EntryShell>
  );
}
