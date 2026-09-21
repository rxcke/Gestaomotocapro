import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Fuel, LineChart, Wrench } from "lucide-react";
import { AmbientBackground, GlassCard } from "@/components/glass";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gestão Motoboy — Sua moto gera dinheiro ou só leva dinheiro?" },
      {
        name: "description",
        content:
          "Controle ganhos, gastos, combustível e manutenção da sua moto em um só lugar e descubra quanto sobra no seu bolso.",
      },
      { property: "og:title", content: "Gestão Motoboy — Seu dinheiro. Sua moto. Seu resultado." },
      {
        property: "og:description",
        content: "Ganhos, gastos, combustível, manutenção e custo por km da sua moto em um só app.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: LineChart,
    title: "Resultado líquido",
    text: "Quanto entrou, quanto saiu e quanto realmente sobrou no mês.",
  },
  {
    icon: Fuel,
    title: "Consumo e custo/km",
    text: "Consumo médio calculado pelos seus abastecimentos, sem chute.",
  },
  {
    icon: Wrench,
    title: "Manutenção em dia",
    text: "Alertas por quilometragem e por data antes do problema aparecer.",
  },
];

function Landing() {
  return (
    <div className="relative min-h-dvh bg-canvas text-foreground">
      <AmbientBackground />
      <div className="relative mx-auto flex max-w-5xl flex-col px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <Logo />
          <Button asChild variant="ghost" className="glass-soft">
            <Link to="/auth">Entrar</Link>
          </Button>
        </header>

        <main className="py-14 sm:py-20">
          <p className="text-sm font-semibold text-accent">{APP_TAGLINE}</p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl leading-[1.05] font-bold tracking-tight sm:text-6xl">
            Sua moto gera dinheiro ou só leva dinheiro?
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Controle seus ganhos, gastos, combustível e manutenção em um só lugar.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 px-7 text-base">
              <Link to="/auth">
                Começar agora <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <GlassCard key={f.title}>
                <f.icon className="size-5 text-accent" />
                <h2 className="mt-3 font-display text-lg font-bold">{f.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              </GlassCard>
            ))}
          </div>
        </main>

        <footer className="mt-auto border-t border-border/60 pt-6 pb-4 text-xs text-muted-foreground">
          {APP_NAME} · {APP_TAGLINE}
        </footer>
      </div>
    </div>
  );
}
