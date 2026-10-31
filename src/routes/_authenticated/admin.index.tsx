import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, ArrowRight, CreditCard, Gift, ShieldCheck, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingBlock, PageTitle, Stat } from "@/components/glass";
import { AdminEmpty, AdminError } from "@/components/admin/Shared";
import { getAdminOverview } from "@/lib/admin.functions";
import { overviewPeriod, type OverviewPeriod } from "@/lib/admin-view";
import { dateBR } from "@/lib/format";

const overviewQuery = (
  period: OverviewPeriod,
  fetcher: (input: { data: { period: OverviewPeriod } }) => ReturnType<typeof getAdminOverview> = getAdminOverview,
) =>
  queryOptions({
    queryKey: ["admin", "overview", period],
    queryFn: () => fetcher({ data: { period } }),
    staleTime: 30_000,
  });

export const Route = createFileRoute("/_authenticated/admin/")({
  validateSearch: (search) => ({ periodo: overviewPeriod(search["periodo"]) }),
  loaderDeps: ({ search }) => ({ periodo: search.periodo }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(overviewQuery(deps.periodo)),
  head: () => ({ meta: [
    { title: "Visão geral — Administração · Gestão Motoca Pro" },
    { name: "description", content: "Indicadores e atividade recente da plataforma Gestão Motoca Pro." },
    { property: "og:title", content: "Visão geral — Administração · Gestão Motoca Pro" },
    { property: "og:description", content: "Indicadores e atividade recente da plataforma." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  pendingComponent: () => <LoadingBlock label="Carregando visão geral..." />,
  errorComponent: () => <AdminError title="Não foi possível carregar a visão geral" />,
  component: OverviewPage,
});

const periodLabels: Record<OverviewPeriod, string> = { "7d": "7 dias", "30d": "30 dias", all: "Todo o período" };

function OverviewPage() {
  const { periodo } = Route.useSearch();
  const fetchOverview = useServerFn(getAdminOverview);
  const { data } = useSuspenseQuery(overviewQuery(periodo, fetchOverview));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle title="Visão geral" subtitle="Indicadores reais da plataforma, com acesso restrito." />
        <div role="group" aria-label="Período dos novos cadastros" className="flex gap-2">
          {(Object.entries(periodLabels) as [OverviewPeriod, string][]).map(([key, label]) => (
            <Button key={key} size="sm" variant={periodo === key ? "default" : "outline"} aria-pressed={periodo === key} asChild={periodo !== key} disabled={periodo === key}>
              {periodo === key ? label : <Link to="/admin" search={{ periodo: key }}>{label}</Link>}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Usuários cadastrados" value={data.totalUsers} />
        <Stat label="Assinaturas ativas" value={data.activeSubscriptions} tone="positive" />
        <Stat label={`Novos cadastros · ${periodLabels[periodo].toLowerCase()}`} value={data.newSignups} />
        <Stat label="Assinaturas canceladas" value={data.canceledSubscriptions} />
        <Stat label="Assinaturas expiradas" value={data.expiredSubscriptions} />
        <Stat label="Resgates pendentes" value={data.pendingRedemptions} />
      </div>

      {(data.webhookAttention > 0 || data.pendingRedemptions > 0) && (
        <section aria-label="Alertas administrativos" className="space-y-3 rounded-md border border-border p-4">
          <p className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="size-4 text-accent" />Alertas administrativos</p>
          <ul className="space-y-2 text-sm">
            {data.webhookAttention > 0 && (
              <li className="flex flex-wrap items-center justify-between gap-2">
                <span>{data.webhookAttention} {data.webhookAttention === 1 ? "evento de webhook exige" : "eventos de webhook exigem"} atenção.</span>
                <Button asChild size="sm" variant="outline"><Link to="/admin/webhooks" search={{ page: 1, busca: "", evento: "all", status: "attention" }}>Ver webhooks</Link></Button>
              </li>
            )}
            {data.pendingRedemptions > 0 && (
              <li className="flex flex-wrap items-center justify-between gap-2">
                <span>{data.pendingRedemptions} {data.pendingRedemptions === 1 ? "resgate aguarda" : "resgates aguardam"} processamento.</span>
                <Button asChild size="sm" variant="outline"><Link to="/admin/recompensas" search={{ page: 1 }}>Ver solicitações</Link></Button>
              </li>
            )}
          </ul>
        </section>
      )}

      <section aria-labelledby="shortcuts-title">
        <h2 id="shortcuts-title" className="font-display text-lg font-bold">Tarefas frequentes</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { to: "/admin/usuarios", icon: Users, label: "Gerenciar usuários", search: { page: 1, busca: "", acesso: "all", assinatura: "all" } },
            { to: "/admin/assinaturas", icon: CreditCard, label: "Ver assinaturas", search: { page: 1, busca: "", status: "all", plano: "all" } },
            { to: "/admin/recompensas", icon: Gift, label: "Clube de Recompensas", search: { page: 1 } },
            { to: "/admin/webhooks", icon: ShieldCheck, label: "Eventos de webhook", search: { page: 1, busca: "", evento: "all", status: "all" } },
          ].map((item) => (
            <Link key={item.to} to={item.to} search={item.search} className="group flex items-center justify-between gap-3 rounded-md border border-border p-4 transition-colors hover:border-accent">
              <span className="flex items-center gap-3 text-sm font-semibold"><item.icon className="size-4 text-accent" />{item.label}</span>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="activity-title">
        <h2 id="activity-title" className="font-display text-lg font-bold">Atividade recente</h2>
        <div className="mt-3 grid gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><UserPlus className="size-3.5" />Últimos cadastros</p>
            {data.recentUsers.length ? (
              <ul className="divide-y divide-border border-y border-border">
                {data.recentUsers.map((user) => (
                  <li key={user.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0"><p className="truncate text-sm font-semibold">{user.name ?? "Usuário"}</p><p className="truncate text-xs text-muted-foreground">{user.email ?? "E-mail não informado"}</p></div>
                    <span className="shrink-0 text-xs text-muted-foreground">{dateBR(user.created_at)}</span>
                  </li>
                ))}
              </ul>
            ) : <AdminEmpty label="Nenhum cadastro recente." />}
          </div>
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><ShieldCheck className="size-3.5" />Últimos eventos de webhook</p>
            {data.recentEvents.length ? (
              <ul className="divide-y divide-border border-y border-border">
                {data.recentEvents.map((event) => (
                  <li key={event.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0"><p className="truncate text-sm font-semibold">{event.event_type}</p><p className="truncate text-xs text-muted-foreground">{event.processed ? "Processado" : "Não processado"}{event.error_message ? ` · ${event.error_message}` : ""}</p></div>
                    <span className="shrink-0 text-xs text-muted-foreground">{dateBR(event.created_at)}</span>
                  </li>
                ))}
              </ul>
            ) : <AdminEmpty label="Nenhum evento recente." />}
          </div>
        </div>
      </section>
    </div>
  );
}
