import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AmbientBackground, GlassCard } from "@/components/glass";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authErrorMessage } from "@/lib/auth-errors";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Redefinir senha — Gestão Motoboy" },
      { name: "description", content: "Defina uma nova senha para sua conta Gestão Motoboy." },
      { property: "og:title", content: "Redefinir senha — Gestão Motoboy" },
      { property: "og:description", content: "Defina uma nova senha para sua conta Gestão Motoboy." },
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
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setValidRecovery(Boolean(data.session));
      setChecking(false);
    });
    return () => { active = false; };
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
    toast.success("Senha atualizada!");
    navigate({ to: "/app", replace: true });
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-canvas px-5 text-foreground">
      <AmbientBackground />
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <GlassCard>
          <h1 className="font-display text-2xl font-bold">{checking ? "Verificando link" : validRecovery ? "Nova senha" : "Link inválido ou expirado"}</h1>
          {checking ? <p className="mt-3 text-sm text-muted-foreground">Aguarde só um instante.</p> : validRecovery ? <form className="mt-5 space-y-4" onSubmit={submit}>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" className="h-12 text-base" />
            </div>
            <div className="space-y-1.5"><Label htmlFor="confirmation">Confirmar senha</Label><Input id="confirmation" name="confirmation" type="password" minLength={8} required autoComplete="new-password" className="h-12 text-base" /></div>
            <Button type="submit" className="h-12 w-full text-base" disabled={loading}>
              {loading ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form> : <div className="mt-5"><p className="text-sm text-muted-foreground">Solicite um novo link para redefinir sua senha.</p><Button className="mt-5 w-full" onClick={() => navigate({ to: "/auth", replace: true })}>Voltar para entrar</Button></div>}
        </GlassCard>
      </div>
    </div>
  );
}
