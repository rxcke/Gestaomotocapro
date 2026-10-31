import { useState } from "react";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Search, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { LoadingBlock, PageTitle } from "@/components/glass";
import { AdminEmpty, AdminError, AdminPagination } from "@/components/admin/Shared";
import { ExportUsersDialog } from "@/components/ExportUsersDialog";
import { getAdminUsers, setAmbassadorAccess, type AdminUserRow } from "@/lib/admin.functions";
import { accessLabel, adminAccessFilter, adminPage, adminSearch, adminSubscriptionFilter, planLabel, subscriptionStatusLabel, type AdminAccessKind } from "@/lib/admin-view";
import { demoRemainingLabel } from "@/lib/demo";
import { displayProfilePhone } from "@/lib/phone";

type UsersSearch = { page: number; busca: string; acesso: "all" | AdminAccessKind; assinatura: string };

const usersQuery = (
  search: UsersSearch,
  fetcher: (input: { data: { search: string; access: UsersSearch["acesso"]; subscription: string; page: number } }) => ReturnType<typeof getAdminUsers> = getAdminUsers,
) =>
  queryOptions({
    queryKey: ["admin", "users", search],
    queryFn: () => fetcher({ data: { search: search.busca, access: search.acesso, subscription: search.assinatura, page: search.page } }),
    staleTime: 30_000,
  });

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  validateSearch: (s): UsersSearch => ({
    page: adminPage(s["page"]),
    busca: adminSearch(s["busca"]),
    acesso: adminAccessFilter(s["acesso"]),
    assinatura: adminSubscriptionFilter(s["assinatura"]),
  }),
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(usersQuery(deps.search)),
  head: () => ({ meta: [
    { title: "Usuários — Administração · Gestão Motoca Pro" },
    { name: "description", content: "Gestão de usuários, acessos e exportação restrita da plataforma." },
    { property: "og:title", content: "Usuários — Administração · Gestão Motoca Pro" },
    { property: "og:description", content: "Gestão de usuários, acessos e exportação restrita." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  pendingComponent: () => <LoadingBlock label="Carregando usuários..." />,
  errorComponent: () => <AdminError title="Não foi possível carregar os usuários" />,
  component: UsersPage,
});

const accessOptions: Array<["all" | AdminAccessKind, string]> = [
  ["all", "Todos os acessos"],
  ["admin", "Admin"],
  ["ambassador", "Embaixador"],
  ["subscriber", "Assinante"],
  ["demo", "Demonstração"],
  ["demo_expired", "Demonstração expirada"],
  ["none", "Sem assinatura ativa"],
];

const subscriptionOptions: Array<[string, string]> = [
  ["all", "Todas as situações"],
  ["active", "Ativa"],
  ["trial", "Trial"],
  ["pending", "Pendente"],
  ["canceled", "Cancelada"],
  ["expired", "Expirada"],
  ["refunded", "Reembolsada"],
  ["chargeback", "Chargeback"],
  ["none", "Sem assinatura"],
];

function UsersPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const fetchUsers = useServerFn(getAdminUsers);
  const { data } = useSuspenseQuery(usersQuery(search, fetchUsers));
  const [term, setTerm] = useState(search.busca);
  const [pendingUser, setPendingUser] = useState<AdminUserRow | null>(null);
  const queryClient = useQueryClient();
  const updateAccess = useServerFn(setAmbassadorAccess);
  const update = useMutation({
    mutationFn: (input: { userId: string; grant: boolean }) => updateAccess({ data: input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Acesso de embaixador atualizado.");
      setPendingUser(null);
    },
    onError: (error: Error) => toast.error(error.message || "Não foi possível atualizar o acesso."),
  });

  const applyFilters = (next: Partial<UsersSearch>) =>
    void navigate({ search: { ...search, ...next, page: 1 }, replace: true });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle title="Usuários" subtitle="Contas, tipos de acesso e situação da assinatura." />
        <ExportUsersDialog />
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
          placeholder="Buscar por nome ou e-mail"
          aria-label="Buscar por nome ou e-mail"
          className="w-full sm:w-72"
        />
        <Button type="submit" variant="outline" size="sm"><Search className="size-4" />Buscar</Button>
        <select
          aria-label="Filtrar por tipo de acesso"
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          value={search.acesso}
          onChange={(event) => applyFilters({ acesso: adminAccessFilter(event.target.value) })}
        >
          {accessOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select
          aria-label="Filtrar por situação da assinatura"
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          value={search.assinatura}
          onChange={(event) => applyFilters({ assinatura: adminSubscriptionFilter(event.target.value) })}
        >
          {subscriptionOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </form>

      {data.rows.length ? (
        <div className="overflow-hidden rounded-md border border-border">
          <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,.65fr)_minmax(0,.75fr)_minmax(0,1.4fr)] gap-3 border-b border-border px-4 py-3 text-xs font-semibold text-muted-foreground lg:grid">
            <span>Nome</span><span>E-mail</span><span>WhatsApp</span><span>Acesso</span><span>Plano</span><span>Status</span><span>Ações</span>
          </div>
          <div className="divide-y divide-border">
            {data.rows.map((user) => (
              <div key={user.id} className="grid min-w-0 grid-cols-2 items-start gap-x-3 gap-y-3 p-4 text-sm lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,.65fr)_minmax(0,.75fr)_minmax(0,1.4fr)] lg:items-center">
                <div className="col-span-2 min-w-0 lg:col-span-1"><span className="mb-1 block text-xs text-muted-foreground lg:hidden">Nome</span><p className="break-words font-semibold">{user.name || "Usuário"}</p></div>
                <div className="col-span-2 min-w-0 lg:col-span-1"><span className="mb-1 block text-xs text-muted-foreground lg:hidden">E-mail</span><p className="break-all">{user.email || "E-mail não informado"}</p></div>
                <div className="col-span-2 min-w-0 lg:col-span-1"><span className="mb-1 block text-xs text-muted-foreground lg:hidden">WhatsApp</span><p className="break-all tabular-nums">{displayProfilePhone(user.phone)}</p></div>
                <div className="min-w-0">
                  <span className="mb-1 block text-xs text-muted-foreground lg:hidden">Acesso</span>
                  <p className="break-words">{accessLabel(user.access)}</p>
                  {user.demo && user.demoStartedAt && !user.subscribed && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(user.demoStartedAt).toLocaleString("pt-BR")} → {new Date(user.demoExpiresAt ?? user.demoStartedAt).toLocaleString("pt-BR")}
                      {demoRemainingLabel(user.demoExpiresAt, Date.now())?.expired === false ? ` · ${demoRemainingLabel(user.demoExpiresAt, Date.now())?.text}` : ""}
                    </p>
                  )}
                  {user.referral && <p className="mt-1 break-all text-xs text-muted-foreground">Indicação: {user.referral}</p>}
                </div>
                <div className="min-w-0"><span className="mb-1 block text-xs text-muted-foreground lg:hidden">Plano</span><p>{user.plan ? planLabel(user.plan).split(" · ")[0] : "—"}</p></div>
                <div className="min-w-0"><span className="mb-1 block text-xs text-muted-foreground lg:hidden">Status</span><p className="break-words">{user.subscriptionStatus ? subscriptionStatusLabel(user.subscriptionStatus) : "—"}</p></div>
                <div className="col-span-2 min-w-0 lg:col-span-1">
                  <Button variant="outline" className="h-auto min-h-12 w-full whitespace-normal text-center" onClick={() => setPendingUser(user)}>
                    {user.ambassador ? "Remover acesso de embaixador" : "Tornar embaixador"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <AdminEmpty label="Nenhum usuário encontrado com esses filtros." />
      )}
      <AdminPagination page={search.page} total={data.total} />

      <AlertDialog open={pendingUser !== null} onOpenChange={(open) => { if (!open && !update.isPending) setPendingUser(null); }}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingUser?.ambassador ? "Remover acesso de embaixador?" : "Conceder acesso de embaixador?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingUser?.ambassador
                ? "Se o usuário não possuir uma assinatura ativa, ele perderá o acesso ao aplicativo."
                : "Este usuário terá acesso gratuito ao Gestão Motoca Pro sem precisar de assinatura."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={update.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={update.isPending} onClick={(event) => { event.preventDefault(); if (pendingUser) update.mutate({ userId: pendingUser.id, grant: !pendingUser.ambassador }); }}>
              {update.isPending ? "Salvando..." : pendingUser?.ambassador ? "Remover acesso" : "Conceder acesso"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
