import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Banknote, Fuel, Pause, Play, Receipt, ShoppingBag, Sparkles, Target, Trophy, Wrench } from "lucide-react";
import { ErrorBlock, LoadingBlock } from "@/components/glass";
import { MotoContext } from "@/components/AppShell";
import { ExpenseDialog, FuelDialog, IncomeDialog, MaintenanceDialog } from "@/components/forms/dialogs";
import { Button } from "@/components/ui/button";
import { useApp, useScopedData } from "@/lib/app-context";
import { financeSummary, monthPeriod, percent, sumAmount, variation } from "@/lib/calc";
import { useIncomes, useWorkSessionPauses, useWorkSessions } from "@/lib/data";
import { brl, greeting, num, shortDuration, todayISO } from "@/lib/format";
import { workedDuration } from "@/lib/work-duration";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({
    meta: [
      { title: "Início — Gestão Motoca Pro" },
      { name: "description", content: "Seu corre, seu dinheiro, seu resultado: lucro, jornada e metas em um só lugar." },
      { property: "og:title", content: "Início — Gestão Motoca Pro" },
      { property: "og:description", content: "Veja quanto sobrou do seu corre e registre tudo em segundos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

type Kind = "income" | "expense" | "fuel" | "maintenance" | null;

function Home() {
  const data = useScopedData();
  const { motorcycles } = useApp();
  const sessions = useWorkSessions();
  const pauses = useWorkSessionPauses();
  const allIncomes = useIncomes();
  const [open, setOpen] = useState<Kind>(null);
  const [now, setNow] = useState(() => Date.now());

  const active = sessions.data?.find((s) => s.end_time == null) ?? null;
  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(t);
  }, [active]);

  if (data.isLoading) return <LoadingBlock label="Calculando seu resultado..." />;
  if (data.isError) return <ErrorBlock />;

  const month = monthPeriod();
  const current = financeSummary(data.incomes, data.expenses, month);
  const previous = financeSummary(data.incomes, data.expenses, monthPeriod(-1));
  const change = variation(current.net, previous.net);
  const today = financeSummary(data.incomes, data.expenses, { start: todayISO(), end: todayISO() });
  const hasToday = today.totalIncome > 0 || today.totalExpense > 0;

  const activeGoal = data.goals.find((g) => g.start_date <= month.end && g.end_date >= month.start);
  const goalTarget = Number(activeGoal?.target_amount ?? 0);
  const goalCurrent = activeGoal?.type === "economia" ? Math.max(0, current.net) : current.totalIncome;
  const goalProgress = activeGoal ? percent(goalCurrent, goalTarget) : 0;

  const firstName = data.profile?.name?.trim().split(" ")[0] || "Motoca";
  const sessionPauses = pauses.data ?? [];
  const paused = active ? sessionPauses.some((p) => p.work_session_id === active.id && p.ended_at == null) : false;
  const worked = active ? workedDuration(active, sessionPauses, now) : 0;
  const sessionIncome = active ? sumAmount((allIncomes.data ?? []).filter((i) => i.work_session_id === active.id)) : 0;
  const perHour = worked >= 3600000 / 6 ? sessionIncome / (worked / 3600000) : null;
  const positive = current.net >= 0;

  return (
    <div className="mx-auto max-w-3xl space-y-10 pb-6">
      {/* 1. Saudação */}
      <header className="home-rise min-w-0">
        <p className="text-sm font-medium text-muted-foreground">{greeting()}, {firstName} 👋</p>
        <h1 className="mt-1 font-display text-2xl font-bold leading-tight sm:text-3xl">Bora ver como está seu corre.</h1>
        <div className="mt-3"><MotoContext subtle /></div>
      </header>

      {/* 2. Resultado */}
      <section className="home-hero home-rise relative overflow-hidden rounded-3xl px-5 py-7 sm:px-8 sm:py-9" aria-label="Resultado do mês">
        <div className="home-hero-glow pointer-events-none absolute -right-16 -top-20 size-64 rounded-full" aria-hidden="true" />
        <p className="relative text-xs font-bold uppercase tracking-[0.18em] text-accent">Seu resultado no mês</p>
        <p className={cn("home-count relative mt-3 break-words font-display text-[2.6rem] font-extrabold leading-none tabular-nums min-[390px]:text-5xl sm:text-6xl", positive ? "text-foreground" : "text-negative")}>
          {brl(current.net)}
        </p>
        <p className="relative mt-3 text-sm text-muted-foreground">
          {positive ? "foi o que sobrou do seu corre" : "o corre ainda está no vermelho"}
          {change != null ? (
            <span className={cn("ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold", change >= 0 ? "bg-positive/15 text-positive" : "bg-negative/15 text-negative")}>
              {change >= 0 ? "↑" : "↓"} {num(Math.abs(change), 0)}% vs mês passado
            </span>
          ) : null}
        </p>

        <div className="relative mt-7 flex flex-wrap gap-x-8 gap-y-3">
          <div className="min-w-0">
            <p className="font-display text-lg font-bold tabular-nums text-positive">{brl(current.totalIncome)}</p>
            <p className="text-xs text-muted-foreground">faturados</p>
          </div>
          <div className="min-w-0">
            <p className="font-display text-lg font-bold tabular-nums text-negative">{brl(current.totalExpense)}</p>
            <p className="text-xs text-muted-foreground">gastos</p>
          </div>
          {hasToday ? (
            <div className="min-w-0">
              <p className="font-display text-lg font-bold tabular-nums">{brl(today.net)}</p>
              <p className="text-xs text-muted-foreground">sobrou hoje</p>
            </div>
          ) : null}
        </div>
      </section>

      {/* 3. Ações */}
      <section className="home-rise" aria-labelledby="acoes">
        <h2 id="acoes" className="font-display text-lg font-bold">O que aconteceu no seu corre?</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <ActionButton primary icon={Banknote} label="Ganho" onClick={() => setOpen("income")} />
          <ActionButton icon={Receipt} label="Gasto" onClick={() => setOpen("expense")} />
          <ActionButton icon={Fuel} label="Abasteci" onClick={() => setOpen("fuel")} subtle />
          <ActionButton icon={Wrench} label="Manutenção" onClick={() => setOpen("maintenance")} subtle />
        </div>
      </section>

      {/* 4. Jornada */}
      <section className="home-rise" aria-label="Jornada">
        {active ? (
          <div className={cn("home-journey rounded-3xl p-5 sm:p-7", paused && "is-paused")}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em]">
              <span className={cn("relative flex size-2.5", !paused && "home-pulse")}>
                <span className={cn("size-2.5 rounded-full", paused ? "bg-warning" : "bg-positive")} />
              </span>
              <span className={paused ? "text-warning" : "text-positive"}>{paused ? "Seu corre está pausado" : "Seu corre está rodando"}</span>
            </div>
            <p className="mt-4 font-display text-4xl font-extrabold tabular-nums sm:text-5xl">{shortDuration(worked)}</p>
            <p className="text-sm text-muted-foreground">{paused ? "trabalhadas até agora" : "de trabalho, sem contar pausas"}</p>
            {!paused ? (
              <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2">
                <div><p className="font-display text-lg font-bold tabular-nums text-positive">{brl(sessionIncome)}</p><p className="text-xs text-muted-foreground">ganhos no corre</p></div>
                {perHour != null ? <div><p className="font-display text-lg font-bold tabular-nums">{brl(perHour)}/h</p><p className="text-xs text-muted-foreground">ganho por hora</p></div> : null}
              </div>
            ) : null}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button asChild size="lg" variant={paused ? "default" : "secondary"} className="h-12 rounded-2xl font-bold">
                <Link to="/app/jornada">{paused ? <><Play className="size-4" /> Retomar</> : <><Pause className="size-4" /> Pausar</>}</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="h-12 rounded-2xl font-bold text-negative hover:text-negative">
                <Link to="/app/jornada">Encerrar corre</Link>
              </Button>
            </div>
          </div>
        ) : (
          <Link to="/app/jornada" className="home-start group flex items-center justify-between gap-4 rounded-3xl p-5 transition active:scale-[0.99] sm:p-6">
            <div className="min-w-0">
              <p className="font-display text-xl font-bold">Vai começar o corre?</p>
              <p className="mt-1 text-sm text-muted-foreground">Cronometre o trabalho e veja quanto ganha por hora.</p>
            </div>
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition group-hover:scale-105">
              <Play className="size-6 fill-current" />
            </span>
          </Link>
        )}
      </section>

      {/* 5. Meta */}
      <section className="home-rise" aria-label="Meta">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
          <Target className="size-4 text-accent" /> Meta do mês
        </div>
        {activeGoal ? (
          <div className="mt-3">
            <p className="truncate text-sm text-muted-foreground">{activeGoal.name}</p>
            <div className="mt-1 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
              <p className="font-display text-3xl font-extrabold tabular-nums">
                {brl(goalCurrent)} <span className="text-base font-semibold text-muted-foreground">de {brl(goalTarget)}</span>
              </p>
              <p className="font-display text-2xl font-extrabold text-accent tabular-nums">{num(Math.min(goalProgress, 999), 0)}%</p>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
              <div className="home-bar h-full rounded-full bg-primary" style={{ width: `${Math.min(100, goalProgress)}%` }} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {goalProgress >= 100 ? "Meta batida! 🔥 Bora pra próxima." : `Faltam ${brl(Math.max(0, goalTarget - goalCurrent))} para sua meta.`}
            </p>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Defina uma meta para acompanhar sua evolução.</p>
            <Button asChild variant="outline" className="rounded-2xl"><Link to="/app/metas">Criar meta</Link></Button>
          </div>
        )}
      </section>

      {/* 6–7. Espaço preparado para evolução e vantagens (sem dados inventados) */}
      <section className="grid gap-3 sm:grid-cols-2" aria-label="Em breve">
        <ComingSoon icon={Trophy} title="Sua evolução" text="Pontos e conquistas por manter o corre no controle." />
        <ComingSoon icon={ShoppingBag} title="Vantagens dos Motoca" text="Ofertas selecionadas para quem vive do corre." />
      </section>

      {motorcycles.length === 0 ? (
        <Link to="/app/moto" className="flex items-center justify-between gap-3 text-sm font-semibold text-accent">
          Cadastre sua moto para ver consumo e manutenção <ArrowRight className="size-4 shrink-0" />
        </Link>
      ) : null}

      <IncomeDialog open={open === "income"} onOpenChange={() => setOpen(null)} sessionId={active?.id ?? null} />
      <ExpenseDialog open={open === "expense"} onOpenChange={() => setOpen(null)} sessionId={active?.id ?? null} />
      <FuelDialog open={open === "fuel"} onOpenChange={() => setOpen(null)} sessionId={active?.id ?? null} />
      <MaintenanceDialog open={open === "maintenance"} onOpenChange={() => setOpen(null)} sessionId={active?.id ?? null} />
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, primary, subtle }: { icon: typeof Banknote; label: string; onClick: () => void; primary?: boolean; subtle?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-16 items-center gap-3 rounded-2xl px-4 text-left font-display text-base font-bold transition active:scale-[0.97]",
        primary ? "bg-primary text-primary-foreground hover:brightness-110" : subtle ? "bg-muted/60 hover:bg-muted" : "bg-secondary hover:bg-muted",
      )}
    >
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", primary ? "bg-background/15" : "bg-background/40 text-accent")}>
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">{primary || !subtle ? "+ " : ""}{label}</span>
    </button>
  );
}

function ComingSoon({ icon: Icon, title, text }: { icon: typeof Trophy; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border p-4 opacity-80">
      <Icon className="mt-0.5 size-5 shrink-0 text-accent" />
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-bold">{title} <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground"><Sparkles className="size-3" />Em breve</span></p>
        <p className="mt-0.5 text-xs text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
