import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { Pause, Play, Square } from "lucide-react";
import { QuickActions } from "@/components/QuickActions";
import { EmptyState, GlassCard, PageTitle, Stat } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp, useScopedData } from "@/lib/app-context";
import { sumAmount } from "@/lib/calc";
import { currentUserId, useExpenses, useIncomes, useUpsert, useWorkSessionPauses, useWorkSessions } from "@/lib/data";
import { brl, dateTimeBR, durationLabel, shortDuration } from "@/lib/format";
import type { WorkSession } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { workedDuration } from "@/lib/work-duration";
import { startOrResumeSession } from "@/lib/start-work-session";

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
  // A jornada aberta pertence ao usuário, não ao filtro de moto (ela pode até não ter moto).
  const sessions = useWorkSessions();
  const pauses = useWorkSessionPauses();
  const incomes = useIncomes();
  const expenses = useExpenses();
  const active = sessions.data?.find((session) => session.end_time == null) ?? null;
  const activePauses = pauses.data ?? [];
  const [now, setNow] = useState(Date.now());
  const [startKm, setStartKm] = useState("");
  const [endKm, setEndKm] = useState("");
  const paused = active ? activePauses.some((pause) => pause.work_session_id === active.id && pause.ended_at == null) : false;
  const queryClient = useQueryClient();
  const starting = useRef(false);
  const startSession = useMutation({
    mutationFn: async () => {
      const uid = await currentUserId();
      const getActive = async () => {
        const { data, error } = await supabase.from("work_sessions").select("*").eq("user_id", uid).is("end_time", null).maybeSingle();
        if (error) throw error;
        return data;
      };
      return startOrResumeSession(getActive, async () => {
        const { data, error } = await supabase.from("work_sessions").insert({
          user_id: uid,
          motorcycle_id: activeMoto?.id ?? null,
          start_time: new Date().toISOString(),
          start_km: startKm ? Number(startKm) : activeMoto?.current_km ?? null,
        }).select().single();
        if (error) throw error;
        return data;
      }, (error) => {
        const dbError = error as { code?: string; message?: string } | null;
        return dbError?.code === "23505" && dbError.message?.includes("work_sessions_one_active_per_user") === true;
      });
    },
    onSuccess: async ({ session, existed }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["work_sessions"] }),
        queryClient.invalidateQueries({ queryKey: ["work_session_pauses"] }),
      ]);
      const { data: openPause } = existed ? await supabase.from("work_session_pauses").select("id").eq("work_session_id", session.id).is("ended_at", null).maybeSingle() : { data: null };
      toast[existed ? "info" : "success"](existed ? (openPause ? "Você tem uma jornada pausada. Retome para continuar." : "Você já tem uma jornada em andamento.") : "Jornada iniciada.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível iniciar a jornada.");
      void queryClient.invalidateQueries({ queryKey: ["work_sessions"] });
    },
    onSettled: () => { starting.current = false; },
  });
  const changePause = useMutation({
    mutationFn: async ({ sessionId, pause }: { sessionId: string; pause: boolean }) => {
      const { error } = await supabase.rpc("set_work_session_pause", { _session_id: sessionId, _pause: pause });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["work_session_pauses"] });
      setNow(Date.now());
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível alterar a pausa.");
      void queryClient.invalidateQueries({ queryKey: ["work_session_pauses"] });
      void queryClient.invalidateQueries({ queryKey: ["work_sessions"] });
    },
  });
  const save = useUpsert("work_sessions", "work_sessions", {
    successMessage: active ? "Jornada encerrada." : "Jornada iniciada.",
  });

  useEffect(() => {
    if (!active || paused) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active, paused]);

  const sessionIncome = active ? sumAmount((incomes.data ?? []).filter((row) => row.work_session_id === active.id)) : 0;
  const sessionExpense = active ? sumAmount((expenses.data ?? []).filter((row) => row.work_session_id === active.id)) : 0;
  const sessionNet = sessionIncome - sessionExpense;
  const elapsed = active ? workedDuration(active, activePauses, now) : 0;
  const hourly = elapsed > 0 ? sessionNet / (elapsed / 3600000) : 0;

  const start = () => {
    if (starting.current || startSession.isPending || sessions.isLoading || sessions.isError || active) return;
    starting.current = true;
    startSession.mutate();
  };

  const finish = () => {
    if (!active || changePause.isPending || save.isPending || pauses.isLoading || pauses.isError) return;
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
  };

  return <div className="space-y-6">
    <PageTitle title="Jornada" subtitle="Tempo, lucro e rendimento do seu trabalho." />
    {active ? <>
      <h2 className="font-display text-lg font-bold">Jornada atual</h2>
      <GlassCard className="text-center">
        <p className="text-sm text-muted-foreground">{pauses.isLoading ? "Carregando estado da jornada..." : pauses.isError ? "Não foi possível consultar a pausa. Atualize a página." : paused ? "Jornada pausada" : "Jornada em andamento"}</p>
        <p className="num-display mt-3 text-5xl">{durationLabel(elapsed)}</p>
        <p className="mt-2 text-sm text-muted-foreground">Iniciada em {dateTimeBR(active.start_time)}</p>
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat className="p-3 sm:p-4" valueClassName="overflow-visible text-clip whitespace-normal break-words text-base leading-tight sm:truncate sm:text-xl" label="Ganhos" value={brl(sessionIncome)} tone="positive" />
          <Stat className="p-3 sm:p-4" valueClassName="overflow-visible text-clip whitespace-normal break-words text-base leading-tight sm:truncate sm:text-xl" label="Gastos" value={brl(sessionExpense)} tone="negative" />
          <Stat className="col-span-2 p-3 sm:col-span-1 sm:p-4" valueClassName="overflow-visible text-clip whitespace-normal break-words text-base leading-tight sm:truncate sm:text-xl" label="Lucro/hora" value={brl(hourly)} tone={hourly >= 0 ? "positive" : "negative"} />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div className="space-y-1.5 text-left"><Label htmlFor="end-km">KM ao encerrar</Label><Input id="end-km" type="number" inputMode="decimal" className="h-12 text-base" value={endKm} onChange={(e) => setEndKm(e.target.value)} /></div>
          <Button variant="outline" className="h-12" disabled={changePause.isPending || save.isPending || pauses.isLoading || pauses.isError} onClick={() => active && changePause.mutate({ sessionId: active.id, pause: !paused })}>{paused ? <Play className="mr-2 size-4" /> : <Pause className="mr-2 size-4" />}{paused ? "Retomar" : "Pausar"}</Button>
          <Button className="h-12" onClick={finish} disabled={save.isPending || changePause.isPending || pauses.isLoading || pauses.isError}><Square className="mr-2 size-4" />Encerrar</Button>
        </div>
      </GlassCard>
      <section><h2 className="mb-3 font-display text-lg font-bold">Registrar durante a jornada</h2><QuickActions sessionId={active.id} /></section>
    </> : <GlassCard>
      {sessions.isLoading ? <p className="text-center text-muted-foreground">Carregando jornada...</p> : sessions.isError ? <p className="text-center text-muted-foreground">Não foi possível consultar sua jornada. Atualize a página para tentar novamente.</p> :
      <div className="mx-auto max-w-md text-center"><h2 className="font-display text-2xl font-bold">Pronto para rodar?</h2><p className="mt-2 text-sm text-muted-foreground">Inicie a jornada e associe ganhos e gastos ao seu turno.</p><div className="mt-5 space-y-1.5 text-left"><Label htmlFor="start-km">KM inicial</Label><Input id="start-km" type="number" inputMode="decimal" className="h-12 text-base" value={startKm} onChange={(e) => setStartKm(e.target.value)} placeholder={String(activeMoto?.current_km ?? "")} /></div><Button className="mt-5 h-12 w-full text-base" onClick={start} disabled={startSession.isPending || starting.current}><Play className="mr-2 size-4" />Iniciar jornada</Button></div>}
    </GlassCard>}
    <GlassCard><h2 className="font-display text-lg font-bold">Histórico</h2>{data.sessions.filter((s) => s.end_time).length ? <div className="mt-4 divide-y divide-border/60">{data.sessions.filter((s) => s.end_time).map((s: WorkSession) => { const duration = workedDuration(s, data.pauses); return <div key={s.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-3"><div><p className="text-sm font-semibold">{dateTimeBR(s.start_time)}</p><p className="text-xs text-muted-foreground">{shortDuration(duration)} · {brl(s.total_income)} ganhos</p></div><p className={`num-display text-sm ${s.net_profit >= 0 ? "text-positive" : "text-negative"}`}>{brl(s.net_profit)}</p></div> })}</div> : <EmptyState title="Nenhuma jornada encerrada" description="Seu histórico aparecerá aqui." />}</GlassCard>
  </div>;
}