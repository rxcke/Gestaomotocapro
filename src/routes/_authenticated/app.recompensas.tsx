import { useState } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CalendarRange, Gift, LockKeyhole, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageTitle, LoadingBlock } from "@/components/glass";
import { getRewards, getWalletHistory } from "@/lib/rewards.functions";
import { getMyPoints } from "@/lib/points.functions";
import { monthlyBonusPercent } from "@/lib/points-view";
import { rewardCategories, rewardMeta, rewardPage } from "@/lib/rewards-shared";
import { RewardPagination, RewardsError, Wallet } from "@/components/rewards/Shared";
import { RewardDetails } from "@/components/rewards/RewardDetails";
const catalogue = (uid: string, fetcher: () => ReturnType<typeof getRewards> = getRewards) =>
  queryOptions({
    queryKey: ["rewards", "catalogue", uid],
    queryFn: () => fetcher(),
    staleTime: 10000,
  });
const movements = (
  uid: string,
  page: number,
  fetcher: (input: {
    data: { page: number };
  }) => ReturnType<typeof getWalletHistory> = getWalletHistory,
) =>
  queryOptions({
    queryKey: ["rewards", "movements", uid, page],
    queryFn: () => fetcher({ data: { page } }),
  });
const monthly = (uid: string, fetcher: () => ReturnType<typeof getMyPoints> = getMyPoints) =>
  queryOptions({
    queryKey: ["points", "summary", uid],
    queryFn: () => fetcher(),
    staleTime: 30000,
  });
export const Route = createFileRoute("/_authenticated/app/recompensas")({
  validateSearch: (s) => ({ page: rewardPage(s["page"]) }),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(catalogue(context.user.id)),
      context.queryClient.ensureQueryData(movements(context.user.id, deps.page)),
      context.queryClient.ensureQueryData(monthly(context.user.id)),
    ]);
  },
  head: () =>
    rewardMeta(
      "Clube de Recompensas",
      "Sua carteira de pontos e recompensas disponíveis no Gestão Motoca Pro.",
    ),
  pendingComponent: () => <LoadingBlock label="Carregando clube..." />,
  errorComponent: RewardsError,
  component: RewardsPage,
});
function RewardsPage() {
  const { user } = Route.useRouteContext();
  const { page } = Route.useSearch();
  const fetch = useServerFn(getRewards);
  const historyFetch = useServerFn(getWalletHistory);
  const monthlyFetch = useServerFn(getMyPoints);
  const { data } = useSuspenseQuery(catalogue(user.id, fetch));
  const { data: history } = useSuspenseQuery(movements(user.id, page, historyFetch));
  const { data: points } = useSuspenseQuery(monthly(user.id, monthlyFetch));
  const summary = points.summary;
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<(typeof data.rewards)[number] | null>(null);
  const rows = data.rewards.filter(
    (r) =>
      (category === "all" || r.category === category) &&
      (!r.expires_at || new Date(r.expires_at) > new Date()) &&
      (r.category !== "partner" || data.partners.some((p) => p.id === r.partner_id)),
  );
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle title="Clube de Recompensas" subtitle="Seus pontos, novas possibilidades" />
        <Button asChild variant="outline" size="sm">
          <Link to="/app/resgates" search={{ page: 1 }}>
            <ReceiptText className="size-4" />
            Meus resgates
          </Link>
        </Button>
      </div>
      <Wallet wallet={data.wallet} />
      {summary && (
        <section aria-label="Meta mensal" className="max-w-xl space-y-2 border-b border-border pb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 font-semibold">
              <CalendarRange className="size-4 text-accent" />
              Bônus mensal · +10 pontos
            </span>
            <span className="text-muted-foreground">{summary.monthly_progress} de 20 dias</span>
          </div>
          <Progress aria-label="Progresso para o bônus mensal" value={monthlyBonusPercent(summary.monthly_progress)} />
          <p className="text-xs text-muted-foreground">
            {summary.monthly_progress >= 20
              ? "Meta mensal alcançada"
              : `Faltam ${20 - summary.monthly_progress} dias de acesso neste mês`}{" "}
            · {summary.monthly_points.toLocaleString("pt-BR")} pts conquistados no mês
          </p>
        </section>
      )}
      {!data.wallet.enabled && (
        <div className="flex items-center gap-3 border-b border-border pb-5 text-sm text-muted-foreground">
          <LockKeyhole className="size-5 shrink-0 text-accent" />
          Os resgates ainda não estão liberados.
        </div>
      )}
      <section aria-label="Recompensas">
        <div role="group" aria-label="Categoria" className="mb-5 flex flex-wrap gap-2">
          {[["all", "Todas"], ...Object.entries(rewardCategories)].map(([key, label]) => (
            <Button
              key={key}
              size="sm"
              variant={category === key ? "default" : "outline"}
              aria-pressed={category === key}
              onClick={() => setCategory(key ?? "all")}
            >
              {label}
            </Button>
          ))}
        </div>
        {rows.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((r) => (
              <article key={r.id} className="overflow-hidden rounded-md border border-border">
                {r.image_url ? (
                  <img
                    src={r.image_url}
                    alt={r.name}
                    className="aspect-video w-full object-cover"
                  />
                ) : (
                  <div className="grid aspect-video place-items-center bg-muted">
                    <Gift className="size-12 text-accent" />
                  </div>
                )}
                <div className="space-y-3 p-4">
                  <p className="text-xs text-muted-foreground">
                    {rewardCategories[r.category as keyof typeof rewardCategories]}
                  </p>
                  <h2 className="break-words font-display text-lg font-bold">{r.name}</h2>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-accent">{r.points_cost} pts</strong>
                    <Button size="sm" variant="outline" onClick={() => setSelected(r)}>
                      Ver detalhes
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="border-y border-border py-12 text-center">
            <Gift className="mx-auto mb-4 size-10 text-accent" />
            <h2 className="font-display text-lg font-bold">Nenhuma recompensa disponível</h2>
          </div>
        )}
      </section>
      <section aria-label="Movimentações da carteira">
        <h2 className="font-display text-lg font-bold">Movimentações da carteira</h2>
        {history.rows.length ? (
          <ul className="mt-3 divide-y divide-border">
            {history.rows.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-4">
                <div>
                  <p className="text-sm font-semibold">
                    {{
                      reserve: "Pontos reservados",
                      spend: "Resgate aprovado",
                      release: "Reserva liberada",
                    }[m.kind] ?? m.kind}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(m.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <strong className="text-sm">{m.points} pts</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-sm text-muted-foreground">Nenhuma movimentação de resgate.</p>
        )}
        <RewardPagination page={page} count={history.count} to="/app/recompensas" />
      </section>
      {selected && (
        <RewardDetails
          reward={selected}
          enabled={data.wallet.enabled}
          available={data.wallet.available}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
