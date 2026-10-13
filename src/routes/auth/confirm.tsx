import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { EntryShell } from "@/components/EntryShell";
import { Button } from "@/components/ui/button";
import { confirmRecovery, readConfirmParams } from "@/lib/recovery-confirm";
import { markRecoveryVerified } from "@/lib/recovery-watch";

export const Route = createFileRoute("/auth/confirm")({
  staticData: { sitemap: false },
  ssr: false,
  head: () => ({
    meta: [
      { title: "Confirmando link — Gestão Motoca Pro" },
      { name: "description", content: "Confirmação do link de redefinição de senha do Gestão Motoca Pro." },
      { property: "og:title", content: "Confirmando link — Gestão Motoca Pro" },
      { property: "og:description", content: "Confirmação do link de redefinição de senha do Gestão Motoca Pro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConfirmPage,
});

function ConfirmPage() {
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const params = readConfirmParams(window.location.search);
    // Remove the token from the address bar and history right away.
    window.history.replaceState(window.history.state, "", "/auth/confirm");
    void confirmRecovery(params, (args) => supabase.auth.verifyOtp(args)).then((result) => {
      if (!active) return;
      if (result.ok) {
        markRecoveryVerified(result.userId);
        navigate({ to: "/reset-password", replace: true });
      } else {
        setFailed(true);
      }
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <EntryShell
      eyebrow="Nova senha"
      title={failed ? "Esse link expirou." : "Verificando seu link..."}
      subtitle={failed ? "Ele é inválido, expirou ou já foi usado. Peça um novo link para redefinir sua senha." : "Aguarde só um instante."}
      stepKey={failed ? 2 : 0}
    >
      {failed ? (
        <Button className="h-14 w-full rounded-full text-sm font-bold uppercase tracking-wider" onClick={() => navigate({ to: "/auth", replace: true })}>
          Pedir novo link
        </Button>
      ) : (
        <div className="h-14 animate-pulse rounded-2xl bg-secondary" />
      )}
    </EntryShell>
  );
}
