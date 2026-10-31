import { useState } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Gift, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle, LoadingBlock } from "@/components/glass";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getRewardAdmin } from "@/lib/rewards-admin.functions";
import { rewardMeta, rewardPage, rewardCategories, rewardStatuses } from "@/lib/rewards-shared";
import { RewardPagination, RewardsError } from "@/components/rewards/Shared";
import {
  AdminEditor,
  CodesEditor,
  ProcessEditor,
  emptyReward,
  type RewardForm,
} from "@/components/rewards/AdminForms";
const adminQuery = (
  uid: string,
  page: number,
  fetcher: (input: {
    data: { page: number };
  }) => ReturnType<typeof getRewardAdmin> = getRewardAdmin,
) =>
  queryOptions({
    queryKey: ["reward-admin", "overview", uid, page],
    queryFn: () => fetcher({ data: { page } }),
  });
export const Route = createFileRoute("/_authenticated/admin/recompensas")({
  validateSearch: (s) => ({ page: rewardPage(s["page"]) }),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(adminQuery(context.user.id, deps.page)),
  head: () =>
    rewardMeta(
      "Administração do Clube",
      "Administração protegida de recompensas, parceiros e solicitações.",
    ),
  pendingComponent: () => <LoadingBlock label="Carregando administração..." />,
  errorComponent: RewardsError,
  component: AdminRewards,
});
function AdminRewards() {
  const { user } = Route.useRouteContext();
  const { page } = Route.useSearch();
  const fetch = useServerFn(getRewardAdmin);
  const { data } = useSuspenseQuery(adminQuery(user.id, page, fetch));
  const [reward, setReward] = useState<RewardForm | null>(null);
  const [partner, setPartner] = useState<{
    id?: string;
    name: string;
    instructions: string;
    active: boolean;
  } | null>(null);
  const [codes, setCodes] = useState<string | null>(null);
  const [request, setRequest] = useState<(typeof data.requests)[number] | null>(null);
  return (
    <main className="mx-auto min-h-dvh max-w-6xl space-y-6 px-4 py-6 text-foreground sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle title="Administração do Clube" />
        <Button asChild variant="outline">
          <Link to="/admin">
            <ArrowLeft className="size-4" />
            Administração
          </Link>
        </Button>
      </div>
      <div className="flex items-center gap-3 border-y border-border py-4 text-sm">
        <LockKeyhole className="size-5 text-accent" />
        {data.enabled ? "Resgates liberados" : "Resgates reais bloqueados"}
      </div>
      <Tabs defaultValue="catalogue">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="catalogue">Recompensas</TabsTrigger>
          <TabsTrigger value="partners">Parceiros</TabsTrigger>
          <TabsTrigger value="requests">Solicitações</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
        </TabsList>
        <TabsContent value="catalogue" className="space-y-4">
          <Button onClick={() => setReward({ ...emptyReward })}>
            <Plus className="size-4" />
            Cadastrar recompensa
          </Button>
          {data.rewards.length ? (
            <ul className="divide-y divide-border">
              {data.rewards.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <h2 className="font-semibold">{r.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {rewardCategories[r.category as keyof typeof rewardCategories]} ·{" "}
                      {r.points_cost} pts · {r.active ? "Ativa" : "Inativa"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Estoque total: {r.stock ?? "Sem limite"} · Comprometido: {r.committed}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setReward({ ...r, category: r.category as RewardForm["category"] })
                      }
                    >
                      Editar
                    </Button>
                    {r.uses_codes && (
                      <Button variant="outline" size="sm" onClick={() => setCodes(r.id)}>
                        Códigos
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty label="Nenhuma recompensa cadastrada" />
          )}
        </TabsContent>
        <TabsContent value="partners" className="space-y-4">
          <Button onClick={() => setPartner({ name: "", instructions: "", active: false })}>
            <Plus className="size-4" />
            Cadastrar parceiro
          </Button>
          {data.partners.length ? (
            <ul className="divide-y divide-border">
              {data.partners.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-4">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.active ? "Ativo" : "Inativo"}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setPartner(p)}>
                    Editar
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <Empty label="Nenhum parceiro cadastrado" />
          )}
        </TabsContent>
        <TabsContent value="requests">
          {data.requests.length ? (
            <ul className="divide-y divide-border">
              {data.requests.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <h2 className="font-semibold">
                      {String((r.snapshot as Record<string, unknown>)["name"])}
                    </h2>
                    <p className="text-sm text-accent">
                      {rewardStatuses[r.status]} · {r.points_cost} pts
                    </p>
                    <p className="break-all text-xs text-muted-foreground">Solicitação {r.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setRequest(r)}>
                    Consultar / processar
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <Empty label="Nenhuma solicitação" />
          )}
          <RewardPagination page={page} count={data.requestCount} to="/admin/recompensas" />
        </TabsContent>
        <TabsContent value="audit">
          {data.audit.length ? (
            <ul className="divide-y divide-border">
              {data.audit.map((a) => (
                <li key={a.id} className="space-y-2 py-4 text-xs">
                  <p className="font-semibold">
                    {{
                      reward_saved: "Recompensa salva",
                      partner_saved: "Parceiro salvo",
                      codes_added: "Códigos adicionados",
                      status: "Situação alterada",
                    }[a.action] ?? a.action}
                  </p>
                  <p className="break-all text-muted-foreground">
                    {new Date(a.created_at).toLocaleString("pt-BR")} · Responsável: {a.actor_id}
                  </p>
                  <p className="break-all">Registro: {a.entity_id}</p>
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted p-3">
                    {JSON.stringify(a.changes, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          ) : (
            <Empty label="Nenhuma alteração registrada" />
          )}
          <RewardPagination page={page} count={data.auditCount} to="/admin/recompensas" />
        </TabsContent>
      </Tabs>
      {(reward || partner) && (
        <AdminEditor
          reward={reward ?? undefined}
          partner={partner ?? undefined}
          partners={data.partners}
          close={() => {
            setReward(null);
            setPartner(null);
          }}
        />
      )}
      {codes && <CodesEditor id={codes} close={() => setCodes(null)} />}
      {request && <ProcessEditor request={request} uid={user.id} close={() => setRequest(null)} />}
    </main>
  );
}
function Empty({ label }: { label: string }) {
  return (
    <div className="border-y border-border py-12 text-center">
      <Gift className="mx-auto mb-3 size-8 text-accent" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
