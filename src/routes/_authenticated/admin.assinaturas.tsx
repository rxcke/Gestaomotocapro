import { useState } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingBlock, PageTitle, Stat } from "@/components/glass";
import { AdminEmpty, AdminError, AdminPagination } from "@/components/admin/Shared";
import { getAdminSubscriptions } from "@/lib/admin.functions";
import { adminPage, adminPlanFilter, adminSearch, adminSubscriptionFilter, planLabel, subscriptionStatusLabel } from "@/lib/admin-view";
import { brl, dateBR } from "@/lib/format";

type SubsSearch = { page: number; busca: string; status: string; plano: string };

const subsQuery = (
  search: SubsSearch,
  fetcher: (input: { data: { search: string; status: string; plan: string; page: number } }) => ReturnType<typeof getAdminSubscriptions> = getAdminSubscriptions,
) =>
  queryOptions({
    queryKey: ["admin", "subscriptions", search],
    queryFn: () => fetcher({ data: { search: search.busca, status: search.status, plan: search.plano, page: search.page } }),
    staleTime: 30_000,
  });

export const Route = createFileRoute("/_authenticated/admin/assinaturas")({
  validateSearch: (s): SubsSearch => ({
    page: adminPage(s["page"]),
    busca: adminSearch(s["busca"]),
    status: adminSubscriptionFilter(s["status"]) === "none" ? "all" : adminSubscriptionFilter(s["status"]),
    plano: adminPlanFilter(s["plano"]),
  }),
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(subsQuery(deps.search)),
  head: () => ({ meta: [
    { title: "Assinaturas — Administração · Gestão Motoca Pro" },
    { name: "description", content: "Assinaturas ativas, canceladas, expiradas e históricas da plataforma." },
    { property: "og:title", content: "Assinaturas — Administração · Gestão Motoca Pro" },
    { property: "og:description", content: "Assinaturas ativas, canceladas, expiradas e históricas." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  pendingComponent: () => <LoadingBlock label="Carregando assinaturas..." />,
  errorComponent: () => <AdminError title="Não foi possível carregar as assinaturas" />,
  component: SubscriptionsPage,
});

const statusOptions: Array<[string, string]> = [
  ["all", "Todas"],
  ["active", "Ativas"],
  ["trial", "Trial"],
  ["pending", "Pendentes"],
  ["canceled", "Canceladas"],
  ["expired", "Expiradas"],
  ["refunded", "Reembolsadas"],
  ["chargeback", "Chargebacks"],
];

const planOptions: Array<[string, string]> = [
  ["all", "Todos os planos"],
  ["monthly", "Start · Mensal"],
  ["quarterly", "Pro · Trimestral"],
  ["annual", "Elite · Anual"],
];

function SubscriptionsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const fetchSubs = useServerFn(getAdminSubscriptions);
  const { data } = useSuspenseQuery(subsQuery(search, fetchSubs));
  const [term, setTerm] = useState(search.busca);

  const applyFilters = (next: Partial<SubsSearch>) =>
    void navigate({ search: { ...search, ...next, page: 1 }, replace: true });

  return (
    <div className="space-y-6">
      <PageTitle title="Assinaturas" subtitle="Situação real das assinaturas, incluindo planos históricos." />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Start · Mensal" value={data.distribution.monthly} />
        <Stat label="Pro · Trimestral" value={data.distribution.quarterly} hint="Plano histórico" />
        <Stat label="Elite · Anual" value={data.distribution.annual} />
      </div>

      <form
        role="search"
        className="flex flex-wrap items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters({ busca: term });
        }}
      >
        <Input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Buscar por e-mail ou nome"
          aria-label="Buscar por e-mail ou nome"
          className="w-full sm:w-72"
        />
        <Button type="submit" variant="outline" size="sm"><Search className="size-4" />Buscar</Button>
        <select
          aria-label="Filtrar por plano"
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          value={search.plano}
          onChange={(event) => applyFilters({ plano: adminPlanFilter(event.target.value) })}
        >
          {planOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </form>

      <div role="group" aria-label="Filtrar por situação" className="flex flex-wrap gap-2">
        {statusOptions.map(([value, label]) => (
          <Button key={value} size="sm" variant={search.status === value ? "default" : "outline"} aria-pressed={search.status === value} onClick={() => applyFilters({ status: value })}>
            {label}
          </Button>
        ))}
      </div>

      {data.rows.length ? (
        <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
          {data.rows.map((item) => (
            <div key={item.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{item.owner?.name ?? "Usuário"}</p>
                <p className="truncate text-xs text-muted-foreground">{item.owner?.email ?? item.email}</p>
              </div>
              <div className="min-w-0">
                <p className="font-semibold">{planLabel(item.plan)} · {subscriptionStatusLabel(item.provider_status === "pending" && item.status !== "pending" ? item.status : item.provider_status)}</p>
                <p className="truncate text-xs text-muted-foreground">{item.cakto_transaction_id ?? "Sem transação"} · {dateBR(item.started_at ?? item.created_at)}</p>
                {item.trial_started_at ? <p className="text-xs text-muted-foreground">Trial: {dateBR(item.trial_started_at)} até {dateBR(item.trial_ends_at)}</p> : null}
              </div>
              <div className="text-sm sm:text-right">
                <strong>{item.expires_at ? dateBR(item.expires_at) : "—"}</strong>
                {item.recurring_amount !== null ? <p className="text-xs text-muted-foreground">{brl(Number(item.recurring_amount))}</p> : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <AdminEmpty label="Nenhuma assinatura encontrada com esses filtros." />
      )}
      <AdminPagination page={search.page} total={data.total} />
    </div>
  );
}
