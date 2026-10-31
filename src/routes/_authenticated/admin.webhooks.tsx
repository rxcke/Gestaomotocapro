import { useState } from "react";
import { queryOptions, useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadingBlock, PageTitle } from "@/components/glass";
import { AdminEmpty, AdminError, AdminPagination } from "@/components/admin/Shared";
import { getAdminWebhookDetail, getAdminWebhooks, reprocessCaktoEvent } from "@/lib/admin.functions";
import { adminPage, adminSearch, adminWebhookStatusFilter, webhookNeedsAttention } from "@/lib/admin-view";
import { dateBR } from "@/lib/format";

type WebhooksSearch = { page: number; busca: string; evento: string; status: "all" | "processed" | "attention" };

const webhooksQuery = (
  search: WebhooksSearch,
  fetcher: (input: { data: { search: string; eventType: string; status: WebhooksSearch["status"]; page: number } }) => ReturnType<typeof getAdminWebhooks> = getAdminWebhooks,
) =>
  queryOptions({
    queryKey: ["admin", "webhooks", search],
    queryFn: () => fetcher({ data: { search: search.busca, eventType: search.evento, status: search.status, page: search.page } }),
    staleTime: 30_000,
  });

export const Route = createFileRoute("/_authenticated/admin/webhooks")({
  validateSearch: (s): WebhooksSearch => ({
    page: adminPage(s["page"]),
    busca: adminSearch(s["busca"]),
    evento: typeof s["evento"] === "string" && s["evento"] ? s["evento"].slice(0, 80) : "all",
    status: adminWebhookStatusFilter(s["status"]),
  }),
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(webhooksQuery(deps.search)),
  head: () => ({ meta: [
    { title: "Webhooks — Administração · Gestão Motoca Pro" },
    { name: "description", content: "Eventos de webhook da Cakto, situação de processamento e reprocessamento autorizado." },
    { property: "og:title", content: "Webhooks — Administração · Gestão Motoca Pro" },
    { property: "og:description", content: "Eventos de webhook e reprocessamento autorizado." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  pendingComponent: () => <LoadingBlock label="Carregando eventos..." />,
  errorComponent: () => <AdminError title="Não foi possível carregar os eventos" />,
  component: WebhooksPage,
});

const statusOptions: Array<[WebhooksSearch["status"], string]> = [
  ["all", "Todos"],
  ["processed", "Processados"],
  ["attention", "Exigem atenção"],
];

function WebhooksPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const fetchWebhooks = useServerFn(getAdminWebhooks);
  const { data } = useSuspenseQuery(webhooksQuery(search, fetchWebhooks));
  const [term, setTerm] = useState(search.busca);
  const [detailId, setDetailId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const reprocessFn = useServerFn(reprocessCaktoEvent);
  const reprocess = useMutation({
    mutationFn: (eventId: string) => reprocessFn({ data: { eventId } }),
    onSuccess: async ({ result }) => {
      const messages: Record<string, string> = {
        processed: "Compra vinculada à conta do comprador.",
        buyer_not_found: "Ainda não existe conta confirmada com o e-mail da compra.",
        missing_link_data: "Evento antigo sem dados para vincular. Reenvie pela Cakto.",
        ambiguous_buyer: "Mais de uma conta corresponde. Verifique manualmente.",
        already_processed: "Este evento já foi processado.",
      };
      toast(messages[result] ?? `Resultado: ${result}`);
      await queryClient.invalidateQueries({ queryKey: ["admin", "webhooks"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao reprocessar."),
  });

  const applyFilters = (next: Partial<WebhooksSearch>) =>
    void navigate({ search: { ...search, ...next, page: 1 }, replace: true });

  return (
    <div className="space-y-6">
      <PageTitle title="Webhooks" subtitle="Eventos recebidos da Cakto, com idempotência e reprocessamento autorizado." />

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
          placeholder="Buscar por transação ou evento"
          aria-label="Buscar por transação ou evento"
          className="w-full sm:w-72"
        />
        <Button type="submit" variant="outline" size="sm"><Search className="size-4" />Buscar</Button>
        <select
          aria-label="Filtrar por tipo de evento"
          className="h-9 max-w-56 rounded-md border border-border bg-background px-3 text-sm"
          value={search.evento}
          onChange={(event) => applyFilters({ evento: event.target.value || "all" })}
        >
          <option value="all">Todos os eventos</option>
          {data.eventTypes.map((type) => <option key={type} value={type}>{type}</option>)}
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
          {data.rows.map((item) => {
            const attention = webhookNeedsAttention(item);
            return (
              <div key={item.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold">
                    {attention && <AlertTriangle className="size-4 shrink-0 text-accent" aria-label="Exige atenção" />}
                    {item.event_type}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{item.transaction_id ?? "Sem transação"}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-sm">{item.processed ? "Processado" : "Não processado"}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.error_message ?? "Sem erro registrado"}</p>
                  {!item.processed && item.error_message === "buyer_not_found" && (
                    <Button size="sm" variant="outline" className="mt-2" disabled={reprocess.isPending} onClick={() => reprocess.mutate(item.id)}>
                      Reprocessar
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  <strong className="text-sm">{dateBR(item.created_at)}</strong>
                  <Button size="sm" variant="ghost" onClick={() => setDetailId(item.id)}>Detalhes</Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <AdminEmpty label="Nenhum evento encontrado com esses filtros." />
      )}
      <AdminPagination page={search.page} total={data.total} />

      <WebhookDetail id={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}

function WebhookDetail({ id, onClose }: { id: string | null; onClose: () => void }) {
  const fetchDetail = useServerFn(getAdminWebhookDetail);
  const query = useQuery({
    queryKey: ["admin", "webhook-detail", id],
    queryFn: () => fetchDetail({ data: { id: id! } }),
    enabled: id !== null,
  });
  return (
    <Dialog open={id !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-[calc(100vw-2rem)] rounded-md sm:max-w-2xl">
        <DialogHeader><DialogTitle>Detalhes do evento</DialogTitle></DialogHeader>
        {query.isLoading ? (
          <p className="py-6 text-sm text-muted-foreground">Carregando evento...</p>
        ) : query.isError || !query.data ? (
          <p className="py-6 text-sm text-negative">Não foi possível carregar o evento.</p>
        ) : (
          <div className="space-y-3 text-sm">
            <dl className="grid gap-2 sm:grid-cols-2">
              <div><dt className="text-xs text-muted-foreground">Tipo</dt><dd className="break-all font-semibold">{query.data.event_type}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Evento</dt><dd className="break-all">{query.data.event_id}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Transação</dt><dd className="break-all">{query.data.transaction_id ?? "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Recebido em</dt><dd>{new Date(query.data.created_at).toLocaleString("pt-BR")}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Situação</dt><dd>{query.data.processed ? `Processado${query.data.processed_at ? ` em ${new Date(query.data.processed_at).toLocaleString("pt-BR")}` : ""}` : "Não processado"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Erro</dt><dd className="break-all">{query.data.error_message ?? "—"}</dd></div>
            </dl>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Conteúdo do evento</p>
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted p-3 text-xs">{JSON.stringify(query.data.payload, null, 2)}</pre>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
