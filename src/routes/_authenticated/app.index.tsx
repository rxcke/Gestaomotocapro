import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Fuel, Target, Wrench } from "lucide-react";
import { QuickActions } from "@/components/QuickActions";
import { CardHeading, EmptyState, ErrorBlock, GlassCard, LoadingBlock, PageTitle, Stat, StatusDot } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useApp, ALL_MOTOS, useScopedData } from "@/lib/app-context";
import { activeMotoKm, financeSummary, fuelStats, monthPeriod, percent, upcomingMaintenance, variation } from "@/lib/calc";
import { brl, brlCompact, greeting, num } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({
    meta: [
      { title: "Painel — Gestão Motoca Pro" },
      { name: "description", content: "Resultado líquido, metas, combustível e manutenção da sua moto." },
      { property: "og:title", content: "Painel — Gestão Motoca Pro" },
      { property: "og:description", content: "Acompanhe o resultado real da sua moto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const data = useScopedData();
  const { activeMoto, motorcycles, motoId } = useApp();
  if (data.isLoading) return <LoadingBlock label="Calculando seu resultado..." />;
  if (data.isError) return <ErrorBlock />;
  if (motorcycles.length === 0) return <EmptyState title="Cadastre sua primeira moto" description="Ela será a base para calcular consumo, manutenção e custo por km." />;

  const current = financeSummary(data.incomes, data.expenses, monthPeriod());
  const previous = financeSummary(data.incomes, data.expenses, monthPeriod(-1));
  const change = variation(current.net, previous.net);
  const fuels = fuelStats(data.fuel);
  const kmNow = activeMotoKm(activeMoto, data.fuel);
  const nextMaintenance = upcomingMaintenance(data.maintenance, kmNow)[0];
  const activeGoal = data.goals.find((g) => g.start_date <= monthPeriod().end && g.end_date >= monthPeriod().start);
  const goalCurrent = activeGoal?.type === "economia" ? Math.max(0, current.net) : current.totalIncome;
  const goalProgress = activeGoal ? percent(goalCurrent, Number(activeGoal.target_amount)) : 0;
  const professional = data.profile?.is_professional ?? false;

  return (
    <div className="space-y-6">
      <PageTitle
        title={`${greeting()}, ${data.profile?.name?.split(" ")[0] ?? "piloto"}`}
        subtitle={motoId === ALL_MOTOS ? "Resultado consolidado de todas as motos" : "Veja como sua moto está trabalhando por você."}
      />

      <GlassCard className="overflow-hidden">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.5fr)_minmax(220px,0.8fr)] md:items-end">
          <div className="min-w-0">
            <CardHeading title="Lucro deste mês" />
            <p className={`num-display mt-3 text-4xl sm:text-5xl ${current.net >= 0 ? "text-positive" : "text-negative"}`}>
              {brl(current.net)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {change == null ? "Primeiro mês com dados" : `${change >= 0 ? "+" : ""}${num(change)}% em relação ao mês anterior`}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Entrou" value={brl(current.totalIncome)} tone="positive" />
            <Stat label="Saiu" value={brl(current.totalExpense)} tone="negative" />
          </div>
        </div>
      </GlassCard>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold">Ações rápidas</h2>
        <QuickActions />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard>
          <CardHeading title="Meta ativa" action={<Target className="size-4 text-accent" />} />
          {activeGoal ? (
            <>
              <p className="mt-3 truncate font-display text-lg font-bold">{activeGoal.name}</p>
              <div className="mt-4 flex items-center justify-between gap-2 text-sm">
                <span>{brlCompact(goalCurrent)}</span>
                <span className="text-muted-foreground">{brlCompact(activeGoal.target_amount)}</span>
              </div>
              <Progress value={Math.min(100, goalProgress)} className="mt-2 [&>div]:bg-accent" />
              <p className="mt-2 text-xs text-muted-foreground">
                {goalProgress >= 100 ? "Meta alcançada! 🔥" : `Faltam ${brl(Math.max(0, Number(activeGoal.target_amount) - goalCurrent))}`}
              </p>
            </>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Crie uma meta e acompanhe o progresso diário.</p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/app/metas">Criar meta</Link>
              </Button>
            </div>
          )}
        </GlassCard>

        <GlassCard>
          <CardHeading title="Combustível" action={<Fuel className="size-4 text-accent" />} />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Consumo médio</p>
              <p className="num-display mt-1 text-2xl">{fuels.avgKmL == null ? "—" : `${num(fuels.avgKmL)} km/L`}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Custo por km</p>
              <p className="num-display mt-1 text-2xl">{fuels.fuelCostPerKm == null ? "—" : brl(fuels.fuelCostPerKm)}</p>
            </div>
          </div>
          <Button asChild variant="ghost" size="sm" className="mt-4 px-0 text-accent">
            <Link to="/app/moto/abastecimentos">Ver abastecimentos <ArrowUpRight className="ml-1 size-4" /></Link>
          </Button>
        </GlassCard>

        <GlassCard>
          <CardHeading title="Próxima manutenção" action={<Wrench className="size-4 text-accent" />} />
          {nextMaintenance ? (
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <StatusDot status={nextMaintenance.status} />
                <p className="font-display text-lg font-bold">{nextMaintenance.record.category}</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{nextMaintenance.label}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Nenhuma manutenção futura cadastrada.</p>
          )}
          <Button asChild variant="ghost" size="sm" className="mt-4 px-0 text-accent">
            <Link to="/app/manutencao">Abrir manutenção <ArrowUpRight className="ml-1 size-4" /></Link>
          </Button>
        </GlassCard>
      </div>

      {professional ? (
        <GlassCard>
          <CardHeading title="Modo trabalho" />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Stat label="Ganhos no mês" value={brl(current.totalIncome)} tone="positive" />
            <Stat label="Lucro do mês" value={brl(current.net)} tone={current.net >= 0 ? "positive" : "negative"} />
            <div className="glass-soft flex items-center justify-center p-4">
              <Button asChild className="w-full"><Link to="/app/jornada">Abrir jornada</Link></Button>
            </div>
          </div>
        </GlassCard>
      ) : null}
    </div>
  );
}