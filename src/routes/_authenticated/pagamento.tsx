import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock3 } from "lucide-react";
import { EntryShell } from "@/components/EntryShell";
import { Button } from "@/components/ui/button";
import { getSubscriptionAccess } from "@/lib/subscription.functions";
import { fetchSubscriptionAccessWhenAuthenticated } from "@/lib/subscription-access";

export const Route = createFileRoute("/_authenticated/pagamento")({
  head: () => ({ meta: [
    { title: "Confirmação de pagamento — Gestão Motoca Pro" },
    { name: "description", content: "Acompanhe a confirmação da sua assinatura." },
    { property: "og:title", content: "Confirmação de pagamento — Gestão Motoca Pro" },
    { property: "og:description", content: "Acompanhe a confirmação da sua assinatura." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "robots", content: "noindex" },
  ] }),
  component: PaymentReturnPage,
});

function PaymentReturnPage() {
  const fetchAccess = useServerFn(getSubscriptionAccess);
  const [pollExpired, setPollExpired] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setPollExpired(true), 60_000);
    return () => window.clearTimeout(timer);
  }, []);
  const access = useQuery({ queryKey: ["subscription", "access"], queryFn: () => fetchSubscriptionAccessWhenAuthenticated(fetchAccess), refetchInterval: (query) => query.state.data?.active || pollExpired ? false : 5000 });
  const active = access.data?.active ?? false;
  return <EntryShell eyebrow={active ? "Assinatura ativa" : "Pagamento"} title={active ? "Pagamento recebido. 🏍️" : pollExpired ? "A confirmação ainda não chegou." : "Estamos confirmando seu pagamento."} subtitle={active ? "Seu acesso ao Gestão Motoca Pro está liberado." : pollExpired ? "Você pode verificar novamente. Seu acesso é liberado assim que a confirmação chegar." : "Isso pode levar alguns instantes. Esta tela atualiza sozinha."} stepKey={active ? 1 : pollExpired ? 2 : 0}>
    <div className={active ? "lp-pop flex size-16 items-center justify-center rounded-full bg-positive/15 text-positive" : "flex size-16 items-center justify-center rounded-full bg-secondary text-warning"}>{active ? <CheckCircle2 className="size-8" /> : <Clock3 className={pollExpired ? "size-8" : "size-8 animate-pulse"} />}</div>
    <div className="mt-8 flex flex-col gap-3">{active ? <Button asChild className="h-14 rounded-full text-sm font-bold uppercase tracking-wider"><Link to="/app">Entrar no meu app</Link></Button> : <Button className="h-14 rounded-full text-sm font-bold uppercase tracking-wider" disabled={access.isFetching} onClick={() => void access.refetch()}>{access.isFetching ? "Verificando..." : "Atualizar status"}</Button>}{active ? null : <Button asChild variant="ghost" className="h-12 rounded-full"><Link to="/planos">Ver planos</Link></Button>}</div>
  </EntryShell>;
}
