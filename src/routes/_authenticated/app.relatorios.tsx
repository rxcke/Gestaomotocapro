import { createFileRoute } from "@tanstack/react-router";
import { AiInsightsPanel } from "@/components/AiInsightsPanel";
import { ErrorBlock, GlassCard, LoadingBlock, PageTitle, Stat } from "@/components/glass";
import { useScopedData } from "@/lib/app-context";
import { costPerKm, distanceInPeriod, financeSummary, monthPeriod } from "@/lib/calc";
import { brl, brlCompact, num } from "@/lib/format";
import { weekPeriod, weeklyComparison, weeklyReport } from "@/lib/weekly-report";

export const Route = createFileRoute("/_authenticated/app/relatorios")({
  head: () => ({ meta: [
    { title: "Relatórios — Gestão Motoca Pro" },
    { name: "description", content: "Resumo semanal, resultado financeiro e custo real da moto." },
    { property: "og:title", content: "Relatórios — Gestão Motoca Pro" },
    { property: "og:description", content: "Resumo semanal, resultado financeiro e custo real da moto." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ReportsPage,
});

const numberClasses = "overflow-visible text-clip whitespace-normal break-words text-base leading-tight sm:text-xl";

function ReportsPage() {
  const d = useScopedData();
  if (d.isLoading) return <LoadingBlock label="Preparando relatórios..." />;
  if (d.isError) return <ErrorBlock />;

  const period = monthPeriod();
  const f = financeSummary(d.incomes, d.expenses, period);
  const distance = distanceInPeriod(d.fuel, period);
  const rows = { incomes: d.incomes, expenses: d.expenses, fuel: d.fuel, sessions: d.sessions };
  const week = weekPeriod();
  const current = weeklyReport(rows, week);
  const previous = weeklyReport(rows, weekPeriod(new Date(), -1));
  const comparison = weeklyComparison(current, previous);
  const categories = Object.entries(f.expenses.reduce<Record<string, number>>((a, e) => {
    a[e.category] = (a[e.category] ?? 0) + Number(e.amount);
    return a;
  }, {})).sort((a, b) => b[1] - a[1]);
  const changes = comparison ? [
    ["Faturamento", comparison.income],
    ["Gastos", comparison.expenses],
    ["Lucro", comparison.profit],
    ["Horas", comparison.hours],
    ["Lucro/hora", comparison.profitPerHour],
  ] as const : [];

  return <div className="space-y-6">
    <PageTitle title="Relatórios" subtitle="O custo real da sua moto, sem esconder nada." />

    <section className="space-y-4" aria-labelledby="weekly-heading">
      <div>
        <h2 id="weekly-heading" className="font-display text-lg font-bold">Resumo da sua semana</h2>
        <p className="text-sm text-muted-foreground">Segunda a domingo · {week.start.split("-").reverse().join("/")} a {week.end.split("-").reverse().join("/")}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <Stat className="p-3 sm:p-4" valueClassName={numberClasses} label="Faturamento" value={brl(current.income)} tone="positive" />
        <Stat className="p-3 sm:p-4" valueClassName={numberClasses} label="Gastos" value={brl(current.expenses)} tone="negative" />
        <Stat className="p-3 sm:p-4" valueClassName={numberClasses} label="Lucro" value={brl(current.profit)} tone={current.profit >= 0 ? "positive" : "negative"} />
        <Stat className="p-3 sm:p-4" valueClassName={numberClasses} label="Horas trabalhadas" value={`${num(current.hours, 1)} h`} />
        <Stat className="p-3 sm:p-4" valueClassName={numberClasses} label="Lucro/hora" value={current.profitPerHour == null ? "—" : brl(current.profitPerHour)} tone={current.profit >= 0 ? "positive" : "negative"} />
        <Stat className="p-3 sm:p-4" valueClassName={numberClasses} label="KM rodados" value={current.distance == null ? "Sem dados" : `${num(current.distance, 0)} km`} />
        <Stat className="col-span-2 p-3 sm:col-span-1 sm:p-4" valueClassName={numberClasses} label="Combustível" value={brl(current.fuel)} />
      </div>
      <p className="text-sm text-foreground">Você trabalhou {num(current.hours, 1)} horas e teve {brl(current.profit)} de lucro nesta semana.</p>
      {changes.some(([, value]) => value != null) && <div className="border-t border-border pt-4">
        <h3 className="text-sm font-semibold">Comparado à semana anterior</h3>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
          {changes.filter(([, value]) => value != null).map(([label, value]) => <p key={label} className="min-w-0 text-muted-foreground">
            {label} <span className="font-semibold text-foreground">{value != null && value >= 0 ? "+" : ""}{num(value, 1)}%</span>
          </p>)}
        </div>
      </div>}
    </section>

    <div className="grid gap-3 sm:grid-cols-3">
      <Stat label="Resultado mensal" value={brlCompact(f.net)} tone={f.net >= 0 ? "positive" : "negative"} />
      <Stat label="Distância estimada" value={distance > 0 ? `${Math.round(distance)} km` : "Dados insuficientes"} />
      <Stat label="Custo real por km" value={distance > 0 ? brl(costPerKm(f.expenses, distance)) : "Dados insuficientes"} />
    </div>
    <AiInsightsPanel />
    <GlassCard>
      <h2 className="font-display text-lg font-bold">Despesas por categoria</h2>
      {categories.length ? <div className="mt-5 space-y-4">{categories.map(([name, value]) => <div key={name}>
        <div className="flex justify-between gap-3 text-sm"><span>{name}</span><strong>{brl(value)}</strong></div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (value / Math.max(f.totalExpense, 1)) * 100)}%` }} /></div>
      </div>)}</div> : <p className="mt-4 text-sm text-muted-foreground">Registre gastos para ver a distribuição.</p>}
    </GlassCard>
  </div>;
}