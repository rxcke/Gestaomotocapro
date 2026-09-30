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

const numberClasses = "overflow-visible whitespace-normal break-words text-base leading-tight sm:text-xl";
const moneyClasses = "overflow-visible whitespace-normal break-words text-base leading-tight sm:text-xl";

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
        <Stat className="p-3 sm:p-4" valueClassName={moneyClasses} label="Faturamento" value={brl(current.income)} tone="positive" />
        <Stat className="p-3 sm:p-4" valueClassName={moneyClasses} label="Gastos" value={brl(current.expenses)} tone="negative" />
        <Stat className="col-span-2 border-l-4 border-l-accent p-4 sm:p-5 lg:col-span-2" valueClassName="overflow-visible whitespace-normal break-words text-2xl leading-tight sm:text-3xl" label="LUCRO" value={brl(current.profit)} tone={current.profit >= 0 ? "positive" : "negative"} />
        <Stat className="p-3 sm:p-4" valueClassName={numberClasses} label="Horas trabalhadas" value={`${num(current.hours, 1)} h`} />
        <Stat className="p-3 sm:p-4" valueClassName={moneyClasses} label="Lucro/hora" value={current.profitPerHour == null ? "—" : brl(current.profitPerHour)} tone={current.profit >= 0 ? "positive" : "negative"} />
        <Stat className="p-3 sm:p-4" valueClassName={numberClasses} hintClassName="whitespace-normal break-words leading-snug" label="KM rodados" value={current.distance == null ? "Ainda não informado" : `${num(current.distance, 0)} km`} hint={current.distance == null ? "Registre os KM para acompanhar sua distância." : undefined} />
        <Stat className="p-3 sm:p-4" valueClassName={moneyClasses} label="Combustível" value={brl(current.fuel)} />
      </div>
      {!current.hasActivity && <div className="border-l-2 border-l-accent bg-muted px-4 py-3 text-sm">
        <p className="font-semibold text-foreground">Nenhum movimento registrado nesta semana.</p>
        <p className="mt-1 text-muted-foreground">Registre seus ganhos e gastos para acompanhar seu resultado.</p>
      </div>}
      <p className="border-t border-border pt-4 text-sm leading-relaxed text-foreground">Você trabalhou {num(current.hours, 1)} horas nesta semana e teve {current.profit < 0 ? `${brl(Math.abs(current.profit))} de prejuízo` : `${brl(current.profit)} de lucro`}.</p>
      {current.hours > 0 && <p className="text-xs text-muted-foreground">Pausas não registradas na jornada não estão descontadas das horas.</p>}
      {changes.some(([, value]) => value != null) && <div className="border-t border-border pt-4">
        <h3 className="text-sm font-semibold">Comparado à semana anterior</h3>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
          {changes.filter(([, value]) => value != null).map(([label, value]) => <p key={label} className="min-w-0 text-muted-foreground">
            {label} <span className="font-semibold text-foreground">{value != null && value >= 0 ? "+" : ""}{num(value, 1)}%</span>
          </p>)}
        </div>
      </div>}
    </section>

    <div className="space-y-4 border-t border-border pt-5">
      <Stat className="p-4 sm:p-5" valueClassName="overflow-visible whitespace-normal break-words text-xl sm:text-2xl" label="Resultado acumulado no mês" value={brlCompact(f.net)} tone={f.net >= 0 ? "positive" : "negative"} />
      <section className="space-y-3" aria-labelledby="moto-indicators-heading">
        <h2 id="moto-indicators-heading" className="font-display text-lg font-bold">Indicadores da moto</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat valueClassName={numberClasses} hintClassName="whitespace-normal break-words leading-snug" label="KM rodados" value={distance > 0 ? `${Math.round(distance)} km` : "Ainda não informado"} hint={distance > 0 ? undefined : "Registre os KM para acompanhar sua distância."} />
          <Stat valueClassName={moneyClasses} hintClassName="whitespace-normal break-words leading-snug" label="Custo por km" value={distance > 0 ? brl(costPerKm(f.expenses, distance)) : "Ainda não calculado"} hint={distance > 0 ? undefined : "Registre os KM e abastecimentos para calcular."} />
        </div>
      </section>
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