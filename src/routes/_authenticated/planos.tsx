import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Crown, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { AmbientBackground, ErrorBlock, GlassCard, LoadingBlock } from "@/components/glass";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { getCheckoutUrl, getSubscriptionAccess, type SubscriptionPlan } from "@/lib/subscription.functions";
import { fetchSubscriptionAccessWhenAuthenticated } from "@/lib/subscription-access";
import { cn } from "@/lib/utils";
import { trackClick, trackEvent } from "@/lib/tracking";

export const Route = createFileRoute("/_authenticated/planos")({
  head: () => ({ meta: [
    { title: "Planos — Gestão Motoca Pro" },
    { name: "description", content: "Escolha seu plano do Gestão Motoca Pro com 7 dias grátis." },
    { property: "og:title", content: "Planos — Gestão Motoca Pro" },
    { property: "og:description", content: "Controle completo da sua rotina e dos custos da moto." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: PlansPage,
});

const FEATURES = ["Controle de ganhos", "Controle de gastos", "Controle de combustível", "Controle de manutenção", "Metas", "Relatórios", "Histórico"];

function PlansPage() {
  const navigate = useNavigate();
  const fetchAccess = useServerFn(getSubscriptionAccess);
  const fetchCheckout = useServerFn(getCheckoutUrl);
  const access = useQuery({ queryKey: ["subscription", "access"], queryFn: () => fetchSubscriptionAccessWhenAuthenticated(fetchAccess) });
  const [opening, setOpening] = useState<SubscriptionPlan | null>(null);

  const subscribe = async (plan: SubscriptionPlan) => {
    setOpening(plan);
    try {
      const result = await fetchCheckout({ data: { plan } });
      if (!result.configured || !result.url) {
        toast.info("Este checkout ainda não foi configurado.");
        return;
      }
      trackEvent("InitiateCheckout", { content_name: plan === "monthly" ? "Start" : plan === "quarterly" ? "Pro" : "Elite" });
      window.location.assign(result.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível abrir o checkout.");
    } finally {
      setOpening(null);
    }
  };

  if (access.isLoading) return <div className="flex min-h-dvh items-center justify-center bg-canvas p-6"><LoadingBlock label="Consultando sua assinatura..." /></div>;
  if (access.isError) return <div className="flex min-h-dvh items-center justify-center bg-canvas p-6"><ErrorBlock message="Não foi possível consultar sua assinatura." /></div>;

  return <div className="relative min-h-dvh bg-canvas px-4 py-7 text-foreground sm:px-6">
    <AmbientBackground />
    <main className="relative mx-auto max-w-5xl">
      <div className="flex items-center justify-between gap-3"><Logo /><Button asChild variant="ghost"><Link to="/app/perfil">Perfil</Link></Button></div>
      <div className="mx-auto mt-10 max-w-2xl text-center">
        <p className="text-sm font-semibold text-accent">GESTÃO MOTOCA PRO PREMIUM</p>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-5xl">Controle total da sua moto e do seu dinheiro</h1>
        <p className="mt-4 text-muted-foreground">Comece com 7 dias grátis no plano ideal. Seus dados ficam preservados mesmo se você cancelar.</p>
      </div>

      {access.data?.hasAppAccess ? <GlassCard className="mx-auto mt-8 max-w-xl text-center"><Crown className="mx-auto size-7 text-accent" /><h2 className="mt-3 font-display text-xl font-bold">{access.data.active ? "Sua assinatura está ativa" : access.data.trial ? "Seu teste grátis está ativo" : "Seu acesso está liberado"}</h2><p className="mt-2 text-sm text-muted-foreground">Você já tem acesso a todos os recursos.</p><Button className="mt-5" onClick={() => navigate({ to: "/app" })}>Abrir painel</Button></GlassCard> : <div className="mt-10 grid gap-5 md:grid-cols-3 md:items-stretch">
         <PlanCard name="Start" price="R$ 29,90" period="/mês" plan="monthly" loading={opening === "monthly"} onSubscribe={subscribe} />
         <PlanCard name="Pro" price="R$ 69,90" period="/trimestre" plan="quarterly" featured loading={opening === "quarterly"} onSubscribe={subscribe} />
         <PlanCard name="Elite" price="R$ 199,90" period="/ano" plan="annual" loading={opening === "annual"} onSubscribe={subscribe} />
      </div>}
      {access.data?.hasAppAccess ? null : <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-6 text-muted-foreground">Você não será cobrado durante os 7 primeiros dias. Após o período de teste, a cobrança será realizada automaticamente no cartão cadastrado, conforme o plano escolhido.</p>}
    </main>
  </div>;
}

function PlanCard({ name, price, period, plan, featured = false, loading, onSubscribe }: { name: string; price: string; period: string; plan: SubscriptionPlan; featured?: boolean; loading: boolean; onSubscribe: (plan: SubscriptionPlan) => void }) {
  return <GlassCard className={cn("relative flex h-full flex-col", featured && "border-accent/60 bg-glass-strong")}>
    {featured ? <span className="absolute right-5 top-5 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">ECONOMIZE</span> : null}
    <h2 className="pr-28 font-display text-xl font-bold">{name}</h2>
    <p className="mt-5 text-sm font-bold uppercase text-accent">7 dias grátis</p>
    <p className="mt-1 text-sm text-muted-foreground">Depois</p>
    <p><span className="num-display text-4xl">{price}</span><span className="text-sm text-muted-foreground">{period}</span></p>
    <ul className="my-7 flex-1 space-y-3">{FEATURES.map((feature) => <li key={feature} className="flex items-center gap-2 text-sm"><Check className="size-4 shrink-0 text-accent" />{feature}</li>)}</ul>
    <Button className="h-12 w-full" variant={featured ? "default" : "outline"} disabled={loading} onClick={() => { trackClick(`Escolher ${name}`); onSubscribe(plan); }}>{loading ? <LoaderCircle className="size-4 animate-spin" /> : "Começar 7 dias grátis"}</Button>
  </GlassCard>;
}
