import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Fuel, Gauge, Sparkles } from "lucide-react";
import { AiInsightsPanel } from "@/components/AiInsightsPanel";
import { ErrorBlock, LoadingBlock } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useScopedData } from "@/lib/app-context";
import { costPerKm, daysAgoPeriod, financeSummary, inPeriod, iso, monthPeriod, sum, variation, type Period } from "@/lib/calc";
import { brl, num, todayISO } from "@/lib/format";
import { weekPeriod, weeklyComparison, weeklyReport } from "@/lib/weekly-report";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/relatorios")({
  head: () => ({ meta: [
    { title: "Relatórios — Gestão Motoca Pro" },
    { name: "description", content: "Entenda seu corre: lucro, valor por hora, combustível, KM e evolução." },
    { property: "og:title", content: "Relatórios — Gestão Motoca Pro" },
    { property: "og:description", content: "Veja o que seus números estão dizendo sobre o seu corre." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ReportsPage,
});

type Range = "today" | "7" | "30" | "custom";
type Metric = "income" | "expenses" | "profit";
const RANGES: { id: Range; label: string }[] = [
  { id: "today", label: "Hoje" }, { id: "7", label: "7 dias" }, { id: "30", label: "30 dias" }, { id: "custom", label: "Personalizado" },
];
const WEEKDAY = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const toDate = (s: string) => new Date(`${s}T12:00:00`);
const addDays = (s: string, n: number) => { const d = toDate(s); d.setDate(d.getDate() + n); return iso(d); };
const daysBetween = (p: Period) => Math.round((toDate(p.end).getTime() - toDate(p.start).getTime()) / 86400000) + 1;
const hoursLabel = (h: number) => { const m = Math.round(h * 60); return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}min`; };

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Contagem curta até o valor real; o valor final fica sempre disponível para leitores de tela. */
function CountUp({ value, format = brl, className }: { value: number; format?: (n: number) => string; className?: string }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(0);
  useEffect(() => {
    if (reduced) { setShown(value); from.current = value; return; }
    const start = performance.now(); const a = from.current; let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 700); const e = 1 - Math.pow(1 - k, 3);
      setShown(a + (value - a) * e);
      if (k < 1) raf = requestAnimationFrame(tick); else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduced]);
  return <span className={className}><span aria-hidden="true">{format(shown)}</span><span className="sr-only">{format(value)}</span></span>;
}

function Delta({ value, label, invert = false }: { value: number | null; label: string; invert?: boolean | undefined }) {
  if (value == null || !Number.isFinite(value)) return null;
  const good = invert ? value <= 0 : value >= 0;
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold", good ? "bg-positive/15 text-positive" : "bg-negative/15 text-negative")}>
    {value >= 0 ? "↑" : "↓"} {num(Math.abs(value), 1)}% <span className="font-medium opacity-80">{label}</span>
  </span>;
}

function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (!("IntersectionObserver" in window)) { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setSeen(true); io.disconnect(); } }, { rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <section ref={ref} style={{ transitionDelay: `${delay}ms` }} className={cn("report-reveal", seen && "is-in", className)}>{children}</section>;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{children}</p>;
}

function ReportsPage() {
  const d = useScopedData();
  const [range, setRange] = useState<Range>("7");
  const [custom, setCustom] = useState<Period>(() => ({ start: addDays(todayISO(), -13), end: todayISO() }));
  const [metric, setMetric] = useState<Metric>("profit");

  const period: Period = range === "today" ? { start: todayISO(), end: todayISO() } : range === "7" ? daysAgoPeriod(7) : range === "30" ? daysAgoPeriod(30)
    : custom.start <= custom.end ? custom : { start: custom.end, end: custom.start };
  const length = daysBetween(period);
  const prevPeriod: Period = { start: addDays(period.start, -length), end: addDays(period.start, -1) };

  const model = useMemo(() => {
    const rows = { incomes: d.incomes, expenses: d.expenses, fuel: d.fuel, sessions: d.sessions, pauses: d.pauses };
    const current = weeklyReport(rows, period);
    const previous = weeklyReport(rows, prevPeriod);
    const fin = financeSummary(d.incomes, d.expenses, period);
    // Evolução: dias do período (mín. 7, máx. 31 últimos dias).
    const evoLen = Math.min(31, Math.max(7, length));
    const evoStart = addDays(period.end, -(evoLen - 1));
    const days = Array.from({ length: evoLen }, (_, i) => {
      const date = addDays(evoStart, i);
      const f = financeSummary(d.incomes, d.expenses, { start: date, end: date });
      return { date, income: f.totalIncome, expenses: f.totalExpense, profit: f.net };
    });
    const categories = Object.entries(fin.expenses.reduce<Record<string, number>>((a, e) => { a[e.category] = (a[e.category] ?? 0) + Number(e.amount); return a; }, {})).sort((a, b) => b[1] - a[1]);
    const fuel = inPeriod(d.fuel, period);
    const liters = sum(fuel.map((r) => Number(r.liters ?? 0)));
    const litersKnown = fuel.length > 0 && fuel.every((r) => r.liters != null && Number(r.liters) > 0);
    const week = weekPeriod();
    const wCur = weeklyReport(rows, week);
    const wPrev = weeklyReport(rows, weekPeriod(new Date(), -1));
    const month = financeSummary(d.incomes, d.expenses, monthPeriod());
    return { current, previous, fin, days, categories, fuel, liters, litersKnown, week, wCur, wPrev, wCmp: weeklyComparison(wCur, wPrev), month };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.incomes, d.expenses, d.fuel, d.sessions, d.pauses, period.start, period.end]);

  if (d.isLoading) return <LoadingBlock label="Preparando relatórios..." />;
  if (d.isError) return <ErrorBlock />;

  const { current, previous, fin, days, categories, fuel, liters, litersKnown, week, wCur, wCmp, month } = model;
  const hasPrev = previous.hasActivity;
  const profitChange = hasPrev ? variation(current.profit, previous.profit) : null;
  const margin = current.income > 0 ? (current.profit / current.income) * 100 : null;
  const anyData = d.incomes.length > 0 || d.expenses.length > 0 || d.sessions.some((s) => s.end_time);

  // Insights somente com dados suficientes.
  const insights: string[] = [];
  const activeDays = days.filter((x) => x.income > 0 || x.expenses > 0);
  if (activeDays.length >= 2) {
    const best = activeDays.reduce((a, b) => (b.profit > a.profit ? b : a));
    if (best.profit > 0) insights.push(`Seu melhor dia foi ${WEEKDAY[toDate(best.date).getDay()]}, ${toDate(best.date).toLocaleDateString("pt-BR")}: ${brl(best.profit)} de lucro.`);
  }
  const top = categories[0]; if (top && fin.totalExpense > 0) insights.push(`Seu maior gasto foi ${top[0].toLowerCase()}: ${num((top[1] / fin.totalExpense) * 100, 0)}% do que saiu.`);
  if (current.hours > 0 && previous.hours > 0 && Math.abs(current.hours - previous.hours) >= 0.5) insights.push(current.hours > previous.hours ? "Você trabalhou mais horas do que no período anterior." : "Você trabalhou menos horas do que no período anterior.");
  if (current.profitPerHour != null && previous.profitPerHour != null && current.profitPerHour !== previous.profitPerHour) insights.push(current.profitPerHour > previous.profitPerHour ? "Seu lucro médio por hora aumentou." : "Seu lucro médio por hora caiu em relação ao período anterior.");

  const pricePerLiter = litersKnown && liters > 0 ? current.fuel / liters : null;
  const kmCost = current.distance != null && current.distance > 0 ? costPerKm(fin.expenses, current.distance) : null;
  const fuelPerKm = current.distance != null && current.distance > 0 && current.fuel > 0 ? current.fuel / current.distance : null;

  const metricColor = metric === "income" ? "bg-positive" : metric === "expenses" ? "bg-negative" : "bg-primary";
  const values = days.map((x) => x[metric]);
  const maxAbs = Math.max(1, ...values.map((v) => Math.abs(v)));
  const flowMax = Math.max(1, current.income, current.expenses);

  return <div className="mx-auto max-w-5xl space-y-12 pb-8">
    {/* Topo */}
    <header className="home-rise space-y-5">
      <div>
        <Eyebrow>Seu corre</Eyebrow>
        <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight sm:text-4xl">Veja o que seus números estão dizendo.</h1>
      </div>
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]" role="tablist" aria-label="Período">
        <div className="flex w-max gap-2">
          {RANGES.map((r) => <button key={r.id} role="tab" aria-selected={range === r.id} type="button" onClick={() => setRange(r.id)}
            className={cn("h-11 rounded-full px-5 text-sm font-bold transition active:scale-95", range === r.id ? "bg-primary text-primary-foreground shadow-[0_8px_24px_-12px_var(--primary)]" : "bg-muted text-muted-foreground hover:text-foreground")}>{r.label}</button>)}
        </div>
      </div>
      {range === "custom" ? <div className="grid max-w-md grid-cols-2 gap-3 animate-in fade-in-0">
        <label className="space-y-1 text-xs font-semibold text-muted-foreground">De<Input type="date" className="h-11 rounded-2xl text-base" value={custom.start} max={todayISO()} onChange={(e) => e.target.value && setCustom((c) => ({ ...c, start: e.target.value }))} /></label>
        <label className="space-y-1 text-xs font-semibold text-muted-foreground">Até<Input type="date" className="h-11 rounded-2xl text-base" value={custom.end} max={todayISO()} onChange={(e) => e.target.value && setCustom((c) => ({ ...c, end: e.target.value }))} /></label>
      </div> : null}
    </header>

    {!anyData ? <div className="report-reveal is-in flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border px-6 py-14 text-center">
      <Sparkles className="size-8 text-accent" />
      <p className="font-display text-2xl font-extrabold">Seu relatório ainda está vazio.</p>
      <p className="max-w-sm text-sm text-muted-foreground">Comece registrando seu primeiro corre e acompanhe sua evolução por aqui.</p>
      <Button asChild size="lg" className="h-12 rounded-2xl font-bold"><Link to="/app/dinheiro">Registrar primeiro ganho</Link></Button>
    </div> : <>
      {/* Resultado */}
      <Reveal className="home-hero relative overflow-hidden rounded-[2rem] px-6 py-9 sm:px-10 sm:py-12">
        <div className="home-hero-glow pointer-events-none absolute -right-20 -top-24 size-72 rounded-full" aria-hidden="true" />
        <Eyebrow>Seu lucro</Eyebrow>
        <CountUp value={current.profit} className={cn("relative mt-3 block break-words font-display text-[2.7rem] font-extrabold leading-none tabular-nums min-[390px]:text-5xl sm:text-7xl", current.profit < 0 && "text-negative")} />
        <div className="relative mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {profitChange != null ? <Delta value={profitChange} label="vs. período anterior" /> : <span>{current.hasActivity ? "Sem período anterior para comparar." : "Nenhum movimento neste período."}</span>}
        </div>
      </Reveal>

      <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        {/* Entrou x saiu */}
        <Reveal>
          <Eyebrow>Quanto entrou, quanto saiu</Eyebrow>
          <div className="mt-6 space-y-6">
            {[
              { label: "Faturamento", value: current.income, color: "bg-positive", text: "text-positive" },
              { label: "Gastos", value: current.expenses, color: "bg-negative", text: "text-negative" },
            ].map((row, i) => <div key={row.label}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-sm font-semibold text-muted-foreground">{row.label}</span>
                <CountUp value={row.value} className={cn("font-display text-2xl font-extrabold tabular-nums sm:text-3xl", row.text)} />
              </div>
              <div className="mt-2 h-4 overflow-hidden rounded-full bg-muted">
                <div className={cn("report-grow h-full rounded-full", row.color)} style={{ width: `${(row.value / flowMax) * 100}%`, animationDelay: `${150 + i * 150}ms` }} />
              </div>
            </div>)}
          </div>
        </Reveal>

        {/* Sobrou */}
        <Reveal delay={80} className="rounded-[2rem] bg-foreground p-6 text-background sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">Do que entrou, isso foi o que sobrou</p>
          <CountUp value={current.profit} className="mt-3 block break-words font-display text-4xl font-extrabold tabular-nums sm:text-5xl" />
          <p className="mt-4 text-sm opacity-80">{margin == null ? "Margem ainda não calculada — registre ganhos no período." : <>Margem de <strong className="font-display text-lg text-primary">{num(margin, 1)}%</strong></>}</p>
        </Reveal>
      </div>

      {/* Valor por hora */}
      <Reveal className="relative">
        <Eyebrow>Seu valor por hora</Eyebrow>
        <p className="mt-3 font-display text-5xl font-extrabold tabular-nums sm:text-6xl">
          {current.profitPerHour == null ? "—" : <><CountUp value={current.profitPerHour} /><span className="ml-2 text-xl font-bold text-muted-foreground">/ hora</span></>}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          {current.hours > 0 ? `Você trabalhou ${hoursLabel(current.hours)} no período, sem contar pausas.` : "Encerre jornadas para descobrir quanto vale sua hora."}
        </p>
      </Reveal>

      {/* Evolução */}
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><Eyebrow>Sua evolução</Eyebrow><p className="mt-1 text-sm text-muted-foreground">Últimos {days.length} dias</p></div>
          <div className="flex gap-1 rounded-full bg-muted p-1" role="tablist" aria-label="Métrica">
            {([["income", "Faturamento"], ["expenses", "Gastos"], ["profit", "Lucro"]] as const).map(([id, label]) =>
              <button key={id} type="button" role="tab" aria-selected={metric === id} onClick={() => setMetric(id)}
                className={cn("h-9 rounded-full px-3 text-xs font-bold transition sm:px-4", metric === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>{label}</button>)}
          </div>
        </div>
        <div className="mt-6 overflow-x-auto [scrollbar-width:thin]">
          <div className="flex h-48 items-end gap-1.5" style={{ minWidth: days.length > 10 ? `${days.length * 22}px` : undefined }} role="img"
            aria-label={days.map((x) => `${toDate(x.date).toLocaleDateString("pt-BR")}: ${brl(x[metric])}`).join("; ")}>
            {days.map((x) => { const v = x[metric]; const h = (Math.abs(v) / maxAbs) * 100; return <div key={x.date} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5" title={`${toDate(x.date).toLocaleDateString("pt-BR")} · ${brl(v)}`}>
              <div className={cn("w-full max-w-10 rounded-t-lg transition-all duration-500 ease-out", v < 0 ? "bg-negative" : metricColor, v === 0 && "opacity-30")} style={{ height: `${Math.max(v === 0 ? 2 : 4, h * 0.85)}%` }} />
              <span className="text-[11px] font-semibold text-muted-foreground">{days.length <= 7 ? SHORT[toDate(x.date).getDay()] : toDate(x.date).getDate()}</span>
            </div>; })}
          </div>
        </div>
      </Reveal>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Combustível */}
        <Reveal>
          <div className="flex items-center gap-2"><Fuel className="size-4 text-accent" /><Eyebrow>Combustível</Eyebrow></div>
          {fuel.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Nenhum abastecimento neste período.</p> : <>
            <CountUp value={current.fuel} className="mt-3 block font-display text-4xl font-extrabold tabular-nums" />
            <p className="text-sm text-muted-foreground">no período · {fuel.length} {fuel.length === 1 ? "abastecimento" : "abastecimentos"}</p>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <Fact label="Litros" value={litersKnown ? `${num(liters, 1)} L` : null} />
              <Fact label="Preço médio" value={pricePerLiter != null ? `${brl(pricePerLiter)}/L` : null} />
              <Fact label="KM informado" value={current.distance != null ? `${num(current.distance, 0)} km` : null} missing="Ainda não informado" />
              <Fact label="Combustível por km" value={fuelPerKm != null ? `${brl(fuelPerKm)}/km` : null} />
            </dl>
          </>}
        </Reveal>

        {/* KM */}
        <Reveal delay={80}>
          <div className="flex items-center gap-2"><Gauge className="size-4 text-accent" /><Eyebrow>KM rodados</Eyebrow></div>
          <p className="mt-3 font-display text-4xl font-extrabold tabular-nums">{current.distance != null ? `${num(current.distance, 0)} km` : <span className="text-2xl text-muted-foreground">Ainda não informado</span>}</p>
          <p className="mt-2 text-sm text-muted-foreground">Custo por km: <strong className="text-foreground">{kmCost != null ? `${brl(kmCost)}/km` : "ainda não calculado"}</strong></p>
          {current.distance == null ? <p className="mt-1 text-xs text-muted-foreground">Informe o KM ao iniciar e encerrar a jornada ou ao abastecer.</p> : null}
        </Reveal>
      </div>

      {/* Insights */}
      {insights.length ? <Reveal>
        <Eyebrow>Seu corre em números</Eyebrow>
        <ul className="mt-5 space-y-3">
          {insights.map((t, i) => <li key={t} className="report-reveal is-in flex gap-3 text-base font-semibold leading-snug sm:text-lg" style={{ transitionDelay: `${i * 80}ms` }}>
            <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />{t}
          </li>)}
        </ul>
      </Reveal> : null}

      {categories.length ? <Reveal>
        <Eyebrow>Para onde foi o dinheiro</Eyebrow>
        <div className="mt-5 space-y-4">{categories.map(([name, value], i) => <div key={name}>
          <div className="flex justify-between gap-3 text-sm"><span className="min-w-0 truncate">{name}</span><strong className="shrink-0 tabular-nums">{brl(value)}</strong></div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted"><div className="report-grow h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (value / Math.max(fin.totalExpense, 1)) * 100)}%`, animationDelay: `${i * 80}ms` }} /></div>
        </div>)}</div>
      </Reveal> : null}
    </>}

    {/* Semana */}
    <Reveal className="home-journey rounded-[2rem] p-6 sm:p-8">
      <Eyebrow>Resumo da sua semana</Eyebrow>
      <p className="mt-1 text-sm text-muted-foreground">Segunda a domingo · {week.start.split("-").reverse().join("/")} a {week.end.split("-").reverse().join("/")}</p>
      {wCur.hasActivity ? <>
        <p className="mt-5 font-display text-xl font-bold leading-snug sm:text-2xl">
          Você trabalhou {hoursLabel(wCur.hours)} e teve <span className={wCur.profit < 0 ? "text-negative" : "text-positive"}>{wCur.profit < 0 ? `${brl(Math.abs(wCur.profit))} de prejuízo` : `${brl(wCur.profit)} de lucro`}</span>.
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-5">
          <WeekFact label="Faturamento" value={brl(wCur.income)} change={wCmp?.income ?? null} />
          <WeekFact label="Gastos" value={brl(wCur.expenses)} change={wCmp?.expenses ?? null} invert />
          <WeekFact label="Lucro" value={brl(wCur.profit)} change={wCmp?.profit ?? null} />
          <WeekFact label="Horas" value={`${num(wCur.hours, 1)} h`} change={wCmp?.hours ?? null} />
          <WeekFact label="Lucro/hora" value={wCur.profitPerHour == null ? "—" : brl(wCur.profitPerHour)} change={wCmp?.profitPerHour ?? null} />
        </dl>
      </> : <p className="mt-5 text-sm text-muted-foreground">Nenhum movimento registrado nesta semana. Registre seus ganhos e gastos para acompanhar seu resultado.</p>}
    </Reveal>

    {/* Mês */}
    <Reveal>
      <Eyebrow>Este mês</Eyebrow>
      <div className="mt-5 grid gap-6 sm:grid-cols-[1fr_auto_1fr_auto_1.3fr] sm:items-end">
        <div><p className="font-display text-3xl font-extrabold tabular-nums text-positive">{brl(month.totalIncome)}</p><p className="text-sm text-muted-foreground">faturados</p></div>
        <span className="hidden font-display text-3xl text-muted-foreground sm:block" aria-hidden="true">−</span>
        <div><p className="font-display text-3xl font-extrabold tabular-nums text-negative">{brl(month.totalExpense)}</p><p className="text-sm text-muted-foreground">gastos</p></div>
        <span className="hidden font-display text-3xl text-muted-foreground sm:block" aria-hidden="true">=</span>
        <div className="border-t-4 border-primary pt-3 sm:border-t-0 sm:border-l-4 sm:pl-5 sm:pt-0"><p className={cn("font-display text-4xl font-extrabold tabular-nums", month.net < 0 && "text-negative")}>{brl(month.net)}</p><p className="text-sm text-muted-foreground">{month.net < 0 ? "de prejuízo" : "de lucro"}</p></div>
      </div>
    </Reveal>

    <AiInsightsPanel />
  </div>;
}

function Fact({ label, value, missing = "Ainda não calculado" }: { label: string; value: string | null; missing?: string }) {
  return <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className={cn("mt-0.5 break-words font-semibold", value ? "font-display text-lg tabular-nums" : "text-sm text-muted-foreground")}>{value ?? missing}</dd></div>;
}

function WeekFact({ label, value, change, invert }: { label: string; value: string; change: number | null; invert?: boolean }) {
  return <div className="min-w-0"><dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-display text-lg font-extrabold tabular-nums">{value}</dd>{change != null ? <dd className="mt-1"><Delta value={change} label="" invert={invert} /></dd> : null}</div>;
}
