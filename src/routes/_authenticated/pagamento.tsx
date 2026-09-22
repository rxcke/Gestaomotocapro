import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock3 } from "lucide-react";
import { AmbientBackground, GlassCard } from "@/components/glass";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { getSubscriptionAccess } from "@/lib/subscription.functions";
import { fetchSubscriptionAccessWhenAuthenticated } from "@/lib/subscription-access";

export const Route = createFileRoute("/_authenticated/pagamento")({
  head: () => ({ meta: [
    { title: "Confirmação de pagamento — Gestão Motoboy" },
    { name: "description", content: "Acompanhe a confirmação da sua assinatura." },
    { property: "og:title", content: "Confirmação de pagamento — Gestão Motoboy" },
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
  return <div className="relative flex min-h-dvh items-center justify-center bg-canvas px-5 py-10 text-foreground"><AmbientBackground /><div className="relative w-full max-w-lg"><div className="mb-7 flex justify-center"><Logo /></div><GlassCard className="text-center">{active ? <CheckCircle2 className="mx-auto size-11 text-positive" /> : <Clock3 className="mx-auto size-11 text-warning" />}<h1 className="mt-5 font-display text-2xl font-bold">{active ? "Pagamento confirmado! 🎉" : pollExpired ? "A confirmação ainda não chegou" : "Estamos confirmando seu pagamento"}</h1><p className="mt-3 text-sm text-muted-foreground">{active ? "Sua assinatura do Gestão Motoboy está ativa." : pollExpired ? "Você pode verificar novamente. Seu acesso será liberado assim que a Cakto confirmar." : "Assim que a Cakto confirmar, seu acesso será liberado automaticamente."}</p><div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">{active ? <Button asChild><Link to="/onboarding">Continuar</Link></Button> : <Button disabled={access.isFetching} onClick={() => void access.refetch()}>{access.isFetching ? "Verificando..." : "Verificar pagamento novamente"}</Button>}<Button asChild variant="outline"><Link to="/planos">Ver planos</Link></Button></div></GlassCard></div></div>;
}
