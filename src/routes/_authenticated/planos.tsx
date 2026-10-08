import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { ErrorBlock, LoadingBlock } from "@/components/glass";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { getCheckoutUrl, getSubscriptionAccess, type SubscriptionPlan } from "@/lib/subscription.functions";
import { fetchSubscriptionAccessWhenAuthenticated } from "@/lib/subscription-access";
import { cn } from "@/lib/utils";
import { trackClick, trackEvent } from "@/lib/tracking";

export const Route = createFileRoute("/_authenticated/planos")({
  head: () => ({ meta: [
    { title: "Planos — Gestão Motoca Pro" },
    { name: "description", content: "Escolha seu plano para desbloquear o Gestão Motoca Pro." },
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

  const hasPaidAccess = access.data?.hasAppAccess && !access.data.demo;
  return <div className="dark relative min-h-dvh overflow-x-clip bg-background px-4 py-6 text-foreground sm:px-6">
    <div className="lp-glow pointer-events-none absolute top-0 left-1/2 size-[560px] -translate-x-1/2" aria-hidden="true" />
    <main className="relative mx-auto max-w-5xl">
      <div className="flex items-center justify-between gap-3"><Link to="/" aria-label="Gestão Motoca Pro — início"><Logo /></Link><div className="flex gap-1">{access.data?.demo || access.data?.demoExpired ? <Button asChild variant="ghost" className="rounded-full"><Link to="/app">Continuar explorando</Link></Button> : null}<Button asChild variant="ghost" className="rounded-full"><Link to="/app/perfil">Perfil</Link></Button></div></div>

      {hasPaidAccess ? <section className="home-rise mx-auto mt-20 max-w-xl text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">{access.data?.active ? "Assinatura ativa" : "Acesso liberado"}</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">Seu acesso está ativo. <span className="text-accent">●</span></h1>
        <p className="mt-4 text-muted-foreground">Você já tem todos os recursos do Gestão Motoca Pro.</p>
        <Button className="mt-8 h-14 rounded-full px-8 text-sm font-bold uppercase tracking-wider" onClick={() => navigate({ to: "/app" })}>Entrar no app</Button>
      </section> : <>
        <section className="home-rise mx-auto mt-12 max-w-2xl text-center sm:mt-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">{access.data?.demoExpired ? "Demonstração encerrada" : access.data?.demo ? "Você está na demonstração" : "Planos"}</p>
          <h1 className="mt-3 font-display text-[2.2rem] leading-[1.05] font-extrabold tracking-tight sm:text-6xl">Escolha como você quer controlar seu corre.</h1>
          <p className="mt-4 text-muted-foreground">{access.data?.demoExpired ? "Seus dados continuam aqui. Escolha um plano para continuar." : "Comece simples. Evolua quando quiser. Tudo que você já registrou continua na sua conta."}</p>
        </section>
        <div className="mt-12 grid gap-5 md:grid-cols-3 md:items-center">
          <PlanCard name="Start" price="R$ 29,90" period="/mês" charge="Pagamento mensal" plan="monthly" loading={opening === "monthly"} onSubscribe={subscribe} delay={0} />
          <PlanCard name="Pro" price="R$ 69,90" period="/trimestre" charge="Pagamento trimestral" monthly="≈ R$ 23,30/mês" badge="🔥 Mais popular" plan="quarterly" featured loading={opening === "quarterly"} onSubscribe={subscribe} delay={100} />
          <PlanCard name="Elite" price="R$ 199,90" period="/ano" charge="Pagamento anual" monthly="≈ R$ 16,66/mês" badge="🏆 Melhor custo-benefício" plan="annual" loading={opening === "annual"} onSubscribe={subscribe} delay={200} />
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-6 text-muted-foreground">Todos os planos liberam o app completo. Pagamento seguro pela Cakto.</p>
      </>}
    </main>
  </div>;
}

function PlanCard({ name, price, period, charge, monthly, badge, plan, featured = false, loading, onSubscribe, delay }: { name: string; price: string; period: string; charge: string; monthly?: string; badge?: string; plan: SubscriptionPlan; featured?: boolean; loading: boolean; onSubscribe: (plan: SubscriptionPlan) => void; delay: number }) {
  return <article style={{ animationDelay: `${delay}ms` }} className={cn("lp-pop relative flex flex-col rounded-[2rem] p-7", featured ? "bg-foreground text-background shadow-2xl md:py-10" : "border border-border bg-card")}>
    {badge ? <span className={cn("absolute -top-3 left-7 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider", featured ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground")}>{badge}</span> : null}
    <h2 className="text-sm font-bold uppercase tracking-[0.2em]">{name}</h2>
    <p className="mt-5 flex items-end gap-1"><span className="num-display text-4xl">{price}</span><span className={cn("pb-1 text-sm", featured ? "text-background/60" : "text-muted-foreground")}>{period}</span></p>
    <p className="mt-1 min-h-5 text-sm font-semibold text-accent">{monthly ?? ""}</p>
    <p className={cn("mt-1 text-xs font-semibold uppercase tracking-wider", featured ? "text-background/60" : "text-muted-foreground")}>{charge}</p>
    <ul className="my-7 flex-1 space-y-2.5">{FEATURES.map((feature) => <li key={feature} className="flex items-center gap-2 text-sm"><Check className="size-4 shrink-0 text-accent" />{feature}</li>)}</ul>
    <Button className={cn("h-14 w-full rounded-full text-sm font-bold uppercase tracking-wider", featured ? "" : "")} variant={featured ? "default" : "outline"} disabled={loading} onClick={() => { trackClick(`Escolher ${name}`); onSubscribe(plan); }}>{loading ? <LoaderCircle className="size-4 animate-spin" /> : `Assinar ${name}`}</Button>
  </article>;
}
