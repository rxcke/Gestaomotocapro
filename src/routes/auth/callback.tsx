import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AmbientBackground, GlassCard } from "@/components/glass";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { readSafeReturnPath } from "@/lib/auth-errors";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Confirmando acesso — Gestão Motoboy" },
    { name: "description", content: "Confirmação segura de acesso ao Gestão Motoboy." },
    { property: "og:title", content: "Confirmando acesso — Gestão Motoboy" },
    { property: "og:description", content: "Confirmação segura de acesso ao Gestão Motoboy." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const finish = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        navigate({ to: readSafeReturnPath(), replace: true });
        return;
      }
      setFailed(true);
    };
    const timer = window.setTimeout(() => void finish(), 800);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [navigate]);

  return <div className="relative flex min-h-dvh items-center justify-center bg-canvas px-5 text-foreground"><AmbientBackground /><div className="relative w-full max-w-md"><div className="mb-6 flex justify-center"><Logo /></div><GlassCard className="text-center"><h1 className="font-display text-2xl font-bold">{failed ? "Não foi possível confirmar" : "Confirmando seu acesso"}</h1><p className="mt-3 text-sm text-muted-foreground">{failed ? "O link pode ter expirado. Entre novamente ou solicite um novo link." : "Aguarde só um instante."}</p>{failed ? <Button asChild className="mt-6"><Link to="/auth">Voltar para entrar</Link></Button> : null}</GlassCard></div></div>;
}