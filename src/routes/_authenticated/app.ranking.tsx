import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, CalendarDays, Medal, RefreshCw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LoadingBlock, PageTitle } from "@/components/glass";
import { getMyPoints, getPointsRanking } from "@/lib/points.functions";
import { pointsEventDate, rankingPage, RANKING_PAGE_SIZE, weeklyBonusPercent } from "@/lib/points-view";
import { cn } from "@/lib/utils";

const personalQuery = (userId: string, fetcher: typeof getMyPoints = getMyPoints) => queryOptions({
  queryKey: ["points", "summary", userId], queryFn: () => fetcher(), staleTime: 30_000,
});
const rankingQuery = (userId: string, page: number, fetcher: typeof getPointsRanking = getPointsRanking) => queryOptions({
  queryKey: ["points", "ranking", userId, page],
  queryFn: () => fetcher({ data: { limit: RANKING_PAGE_SIZE, offset: (page - 1) * RANKING_PAGE_SIZE } }),
  staleTime: 30_000,
});

export const Route = createFileRoute("/_authenticated/app/ranking")({
  validateSearch: (search) => ({ page: rankingPage(search.page) }),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(personalQuery(context.user.id)),
      context.queryClient.ensureQueryData(rankingQuery(context.user.id, deps.page)),
    ]);
  },
  head: () => ({ meta: [
    { title: "Ranking dos Motoca — Gestão Motoca Pro" },
    { name: "description", content: "Sua dedicação também conta. Acompanhe seus pontos, sua posição e seu histórico de uso." },
    { property: "og:title", content: "Ranking dos Motoca — Gestão Motoca Pro" },
    { property: "og:description", content: "Sua dedicação também conta. Pontuação e classificação dos Motoca." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  pendingComponent: () => <LoadingBlock label="Carregando ranking..." />,
  errorComponent: RankingError,
  notFoundComponent: () => <p className="py-10 text-muted-foreground">Ranking não encontrado.</p>,
  component: RankingPage,
});

function RankingError() {
  const router = useRouter();
  return <div role="alert" className="space-y-4 py-10 text-center">
    <Trophy className="mx-auto size-8 text-muted-foreground" />
    <h1 className="font-display text-xl font-bold">Não foi possível carregar o ranking</h1>
    <p className="text-sm text-muted-foreground">Tente novamente em instantes.</p>
    <Button variant="outline" onClick={() => void router.invalidate()}><RefreshCw className="size-4" />Tentar novamente</Button>
  </div>;
}

function RankingPage() {
  const { user } = Route.useRouteContext();
  const { page } = Route.useSearch();
  const fetchPersonal = useServerFn(getMyPoints);
  const fetchRanking = useServerFn(getPointsRanking);
  const { data: personal } = useSuspenseQuery(personalQuery(user.id, fetchPersonal));
  const { data: participants } = useSuspenseQuery(rankingQuery(user.id, page, fetchRanking));
  const summary = personal.summary;
  const number = (value: number) => value.toLocaleString("pt-BR");

  return <div className="space-y-8">
    <PageTitle title="Ranking dos Motoca" subtitle="Sua dedicação também conta" />

    <section aria-label="Minha pontuação" className="border-y border-border py-6">
      {summary ? <>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-[1.5fr_1fr_1fr]">
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs font-medium text-muted-foreground">Seus pontos acumulados</p>
            <p className="num-display mt-2 text-5xl text-accent">{number(summary.total_points)}<span className="ml-2 text-sm font-medium text-muted-foreground">pts</span></p>
            <p className="mt-2 break-words text-xs text-muted-foreground">{summary.public_name}</p>
          </div>
          <div><p className="text-xs text-muted-foreground">Sua posição</p><p className="num-display mt-2 text-3xl">{number(summary.position)}<span className="text-lg">º</span></p></div>
          <div><p className="text-xs text-muted-foreground">Dias nesta semana</p><p className="num-display mt-2 text-3xl">{number(summary.weekly_days)}<span className="ml-1 text-sm font-medium text-muted-foreground">/ 7</span></p></div>
        </div>
        <div className="mt-6 max-w-xl space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><span className="flex items-center gap-2 font-semibold"><CalendarDays className="size-4 text-accent" />Bônus semanal · +5 pontos</span><span className="text-muted-foreground">{summary.weekly_progress} de 5 dias</span></div>
          <Progress aria-label="Progresso para o bônus semanal" value={weeklyBonusPercent(summary.weekly_progress)} />
          <p className="text-xs text-muted-foreground">{summary.weekly_progress >= 5 ? "Meta semanal alcançada" : "Semana de segunda a domingo · horário de Brasília"}</p>
        </div>
      </> : <div className="space-y-2"><Trophy className="size-7 text-accent" /><h2 className="font-display font-bold">Sua pontuação ainda não está disponível</h2><p className="text-sm text-muted-foreground">Seus acessos pontuáveis aparecerão aqui após o registro.</p></div>}
    </section>

    <section aria-labelledby="classification-title">
      <div className="mb-4 flex items-center justify-between gap-3"><h2 id="classification-title" className="font-display text-lg font-bold">Classificação</h2><Trophy className="size-5 text-accent" /></div>
      {participants.length ? <>
        <div className="grid grid-cols-[3rem_minmax(0,1fr)_4rem] gap-2 border-b border-border pb-3 text-[11px] text-muted-foreground sm:grid-cols-[4rem_minmax(0,1fr)_6rem]"><span>Posição</span><span>Motoca</span><span className="text-right">Pontos</span></div>
        <ol aria-label="Classificação dos participantes" className="divide-y divide-border">
          {participants.map((participant) => <li key={participant.public_name} className={cn("grid min-h-16 grid-cols-[3rem_minmax(0,1fr)_4rem] items-center gap-2 px-1 py-3 sm:grid-cols-[4rem_minmax(0,1fr)_6rem]", participant.is_current_user && "bg-accent/10")}>
            <span className={cn("flex items-center gap-1 font-display text-sm font-bold", participant.position <= 3 ? "text-accent" : "text-muted-foreground")}>
              {participant.position <= 3 && <Medal className="size-4 shrink-0" aria-hidden="true" />}{participant.position}º
            </span>
            <div className="min-w-0"><p className="break-words text-sm font-semibold">{participant.public_name}</p>{participant.is_current_user && <span className="text-[11px] font-semibold text-accent">Você</span>}</div>
            <span className="num-display text-right text-base">{number(participant.total_points)}</span>
          </li>)}
        </ol>
      </> : <p className="border-y border-border py-8 text-sm text-muted-foreground">{page === 1 ? "Ainda não há participantes na classificação." : "Não há participantes nesta página."}</p>}
      {summary && !participants.some((participant) => participant.is_current_user) && <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-accent/10 px-4 py-3 text-sm"><span className="break-words font-semibold">Você · {summary.public_name}</span><span className="font-bold text-accent">{summary.position}º · {number(summary.total_points)} pts</span></div>}
      {(page > 1 || participants.length === RANKING_PAGE_SIZE) && <nav aria-label="Páginas da classificação" className="mt-4 flex items-center justify-between gap-2">
        <Button variant="outline" size="icon" disabled={page === 1} aria-label="Página anterior" asChild={page > 1}>{page > 1 ? <Link to="/app/ranking" search={{ page: page - 1 }}><ArrowLeft className="size-4" /></Link> : <ArrowLeft className="size-4" />}</Button>
        <span className="text-xs text-muted-foreground">Página {page}</span>
        <Button variant="outline" size="icon" disabled={participants.length < RANKING_PAGE_SIZE} aria-label="Próxima página" asChild={participants.length === RANKING_PAGE_SIZE}>{participants.length === RANKING_PAGE_SIZE ? <Link to="/app/ranking" search={{ page: page + 1 }}><ArrowRight className="size-4" /></Link> : <ArrowRight className="size-4" />}</Button>
      </nav>}
    </section>

    <section aria-labelledby="history-title">
      <h2 id="history-title" className="font-display text-lg font-bold">Meu histórico</h2>
      {personal.history.length ? <ul className="mt-4 divide-y divide-border border-y border-border">
        {personal.history.map((event) => <li key={event.id} className="flex items-center justify-between gap-4 py-4">
          <div><p className="text-sm font-semibold">{event.event_type === "daily_login" ? "Login diário" : "Bônus semanal"}</p><p className="mt-1 text-xs text-muted-foreground">{pointsEventDate(event.reference_date)}</p></div>
          <span className="num-display shrink-0 text-sm text-accent">+{event.points} {event.points === 1 ? "ponto" : "pontos"}</span>
        </li>)}
      </ul> : <p className="mt-4 py-6 text-sm text-muted-foreground">Nenhum crédito registrado no seu histórico.</p>}
      {personal.history.length === 100 && <p className="mt-3 text-xs text-muted-foreground">Últimos 100 créditos registrados.</p>}
    </section>
  </div>;
}