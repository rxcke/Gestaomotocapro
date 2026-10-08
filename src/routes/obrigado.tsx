import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CheckCircle2, Clock3, LoaderCircle, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { EntryShell } from "@/components/EntryShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchSubscriptionAccessWhenAuthenticated } from "@/lib/subscription-access";
import { getSubscriptionAccess } from "@/lib/subscription.functions";

export const Route = createFileRoute("/obrigado")({
  head: () => ({
    meta: [
      { title: "Obrigado pela compra — Gestão Motoca Pro" },
      {
        name: "description",
        content: "Acompanhe a liberação do seu acesso ao Gestão Motoca Pro.",
      },
      { property: "og:title", content: "Obrigado pela compra — Gestão Motoca Pro" },
      {
        property: "og:description",
        content: "Acompanhe a liberação do seu acesso ao Gestão Motoca Pro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ThankYouPage,
});

type ConfirmationState = "checking" | "active" | "processing";

function ThankYouPage() {
  const fetchAccess = useServerFn(getSubscriptionAccess);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [pollExpired, setPollExpired] = useState(false);

  const checkSession = useCallback(async () => {
    setPollExpired(false);
    const { data, error } = await supabase.auth.getSession();
    setHasSession(Boolean(!error && data.session?.access_token));
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!hasSession) return;
    const timer = window.setTimeout(() => setPollExpired(true), 60_000);
    return () => window.clearTimeout(timer);
  }, [hasSession]);

  const access = useQuery({
    queryKey: ["subscription", "access"],
    queryFn: () => fetchSubscriptionAccessWhenAuthenticated(fetchAccess),
    enabled: hasSession === true,
    retry: 1,
    refetchInterval: (query) => query.state.data?.active || pollExpired ? false : 5_000,
  });

  const state: ConfirmationState = access.data?.active
    ? "active"
    : hasSession === true && !pollExpired && !access.isError
      ? "checking"
      : "processing";

  const tryAgain = async () => {
    await checkSession();
    if (hasSession) await access.refetch();
  };

  const copy = state === "active"
    ? { eyebrow: "Assinatura confirmada", title: <>Pagamento recebido. <span className="text-accent">🏍️</span></>, text: "Seu acesso ao Gestão Motoca Pro está liberado. Agora é só começar o corre." }
    : state === "checking"
      ? { eyebrow: "Confirmando", title: "Estamos confirmando seu pagamento.", text: "Isso pode levar alguns instantes. Esta página atualiza sozinha." }
      : { eyebrow: "Aguardando confirmação", title: "Não conseguimos identificar seu pagamento ainda.", text: hasSession ? "Se você acabou de realizar a compra, aguarde alguns instantes e atualize o status." : "Se você acabou de realizar a compra, entre com o mesmo e-mail usado no pagamento para acompanhar a liberação." };

  return (
    <EntryShell eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.text} stepKey={state}>
      <div aria-live="polite">
        <StatusIndicator state={state} />
        <div className="mt-8 flex flex-col gap-3">
          {state === "active" ? (
            <Button asChild className="h-14 rounded-full text-sm font-bold uppercase tracking-wider"><Link to="/app">Entrar no meu app<ArrowRight /></Link></Button>
          ) : hasSession ? (
            <Button type="button" className="h-14 rounded-full text-sm font-bold uppercase tracking-wider" disabled={access.isFetching} onClick={() => void tryAgain()}>
              <RotateCcw className={access.isFetching ? "animate-spin" : ""} />{access.isFetching ? "Verificando..." : "Atualizar status"}
            </Button>
          ) : (
            <Button asChild className="h-14 rounded-full text-sm font-bold uppercase tracking-wider"><Link to="/auth">Ir para login<ArrowRight /></Link></Button>
          )}
        </div>
        <p className="mt-6 text-xs leading-5 text-muted-foreground">Use o mesmo e-mail da compra. O acesso é liberado automaticamente quando a assinatura é identificada.</p>
      </div>
    </EntryShell>
  );
}

function StatusIndicator({ state }: { state: ConfirmationState }) {
  return (
    <div className="flex items-center gap-4">
      <span className={state === "active" ? "lp-pop flex size-16 shrink-0 items-center justify-center rounded-full bg-positive/15" : "flex size-16 shrink-0 items-center justify-center rounded-full bg-secondary"}>
        {state === "active" ? <CheckCircle2 className="size-8 text-positive" aria-hidden="true" /> : state === "checking" ? <LoaderCircle className="size-8 animate-spin text-accent" aria-hidden="true" /> : <Clock3 className="size-8 text-warning" aria-hidden="true" />}
      </span>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Status do acesso</p>
        <p className="mt-1 text-sm font-semibold">{state === "active" ? "Assinatura identificada" : state === "checking" ? "Confirmação em andamento" : "Aguardando confirmação"}</p>
      </div>
    </div>
  );
}
