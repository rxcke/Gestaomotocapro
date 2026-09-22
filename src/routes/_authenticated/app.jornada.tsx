import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pause, Play, Square } from "lucide-react";
import { QuickActions } from "@/components/QuickActions";
import { EmptyState, GlassCard, PageTitle, Stat } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp, useScopedData } from "@/lib/app-context";
import { sumAmount } from "@/lib/calc";
import { useUpsert } from "@/lib/data";
import { brl, dateTimeBR, durationLabel, shortDuration } from "@/lib/format";
import type { WorkSession } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/app/jornada")({
  head: () => ({ meta: [
    { title: "Jornada — Gestão Motoca Pro" },
    { name: "description", content: "Acompanhe tempo, ganhos, gastos e lucro por hora durante o trabalho." },
    { property: "og:title", content: "Jornada — Gestão Motoca Pro" },
    { property: "og:description", content: "Acompanhe tempo, ganhos, gastos e lucro por hora durante o trabalho." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: JourneyPage,
});

function JourneyPage() {
  const data = useScopedData();
  const { activeMoto } = useApp();
  const active = data.sessions.find((session) => session.end_time == null) ?? null;
  const [now, setNow] = useState(Date.now());
  const [startKm, setStartKm] = useState("");
  const [endKm, setEndKm] = useState("");
  const [paused, setPaused] = useState(false);
  const save = useUpsert("work_sessions", "work_sessions", {
    successMessage: active ? "Jornada encerrada." : "Jornada iniciada.",
  });

  useEffect(() => {
    if (!active || paused) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active, paused]);

  const sessionIncome = active ? sumAmount(data.incomes.filter((row) => row.work_session_id === active.id)) : 0;
  const sessionExpense = active ? sumAmount(data.expenses.filter((row) => row.work_session_id === active.id)) : 0;
  const sessionNet = sessionIncome - sessionExpense;
  const elapsed = active ? Math.max(0, now - new Date(active.start_time).getTime()) : 0;
  const hourly = elapsed > 0 ? sessionNet / (elapsed / 3600000) : 0;

  const start = () => {
    save.mutate({
      motorcycle_id: activeMoto?.id ?? null,
      start_time: new Date().toISOString(),
      start_km: startKm ? Number(startKm) : activeMoto?.current_km ?? null,
      end_time: null,
      end_km: null,
      total_income: 0,
      total_expense: 0,
      net_profit: 0,
    });
  };

  const finish = () => {
    if (!active) return;
    save.mutate({
      id: active.id,
      motorcycle_id: active.motorcycle_id,
      start_time: active.start_time,
      start_km: active.start_km,
      end_time: new Date().toISOString(),
      end_km: endKm ? Number(endKm) : activeMoto?.current_km ?? active.start_km,
      total_income: sessionIncome,
      total_expense: sessionExpense,
      net_profit: sessionNet,
    });
    setPaused(false);
  };

  return <div className="space-y-6">
    <PageTitle title="Jornada" subtitle="Tempo, lucro e rendimento do seu trabalho." />
    {active ? <>
      <GlassCard className="text-center">
        <p className="text-sm text-muted-foreground">Jornada em andamento</p>
        <p className="num-display mt-3 text-5xl">{durationLabel(elapsed)}</p>
        <p className="mt-2 text-sm text-muted-foreground">Iniciada em {dateTimeBR(active.start_time)}</p>
        <div className="mt-6 grid grid-cols-3 gap-2">
          <Stat label="Ganhos" value={brl(sessionIncome)} tone="positive" />
          <Stat label="Gastos" value={brl(sessionExpense)} tone="negative" />
          <Stat label="Lucro/hora" value={brl(hourly)} tone={hourly >= 0 ? "positive" : "negative"} />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div className="space-y-1.5 text-left"><Label htmlFor="end-km">KM ao encerrar</Label><Input id="end-km" type="number" inputMode="decimal" className="h-12 text-base" value={endKm} onChange={(e) => setEndKm(e.target.value)} /></div>
          <Button variant="outline" className="h-12" onClick={() => setPaused((value) => !value)}>{paused ? <Play className="mr-2 size-4" /> : <Pause className="mr-2 size-4" />}{paused ? "Retomar" : "Pausar"}</Button>
          <Button className="h-12" onClick={finish} disabled={save.isPending}><Square className="mr-2 size-4" />Encerrar</Button>
        </div>
      </GlassCard>
      <section><h2 className="mb-3 font-display text-lg font-bold">Registrar durante a jornada</h2><QuickActions sessionId={active.id} /></section>
    </> : <GlassCard>
      <div className="mx-auto max-w-md text-center"><h2 className="font-display text-2xl font-bold">Pronto para rodar?</h2><p className="mt-2 text-sm text-muted-foreground">Inicie a jornada e associe ganhos e gastos ao seu turno.</p><div className="mt-5 space-y-1.5 text-left"><Label htmlFor="start-km">KM inicial</Label><Input id="start-km" type="number" inputMode="decimal" className="h-12 text-base" value={startKm} onChange={(e) => setStartKm(e.target.value)} placeholder={String(activeMoto?.current_km ?? "")} /></div><Button className="mt-5 h-12 w-full text-base" onClick={start} disabled={save.isPending}><Play className="mr-2 size-4" />Iniciar jornada</Button></div>
    </GlassCard>}
    <GlassCard><h2 className="font-display text-lg font-bold">Histórico</h2>{data.sessions.filter((s) => s.end_time).length ? <div className="mt-4 divide-y divide-border/60">{data.sessions.filter((s) => s.end_time).map((s: WorkSession) => { const duration = new Date(s.end_time ?? s.start_time).getTime() - new Date(s.start_time).getTime(); return <div key={s.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-3"><div><p className="text-sm font-semibold">{dateTimeBR(s.start_time)}</p><p className="text-xs text-muted-foreground">{shortDuration(duration)} · {brl(s.total_income)} ganhos</p></div><p className={`num-display text-sm ${s.net_profit >= 0 ? "text-positive" : "text-negative"}`}>{brl(s.net_profit)}</p></div> })}</div> : <EmptyState title="Nenhuma jornada encerrada" description="Seu histórico aparecerá aqui." />}</GlassCard>
  </div>;
}