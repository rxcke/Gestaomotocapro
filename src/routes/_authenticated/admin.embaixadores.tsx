import { useState } from "react";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { LoadingBlock, PageTitle } from "@/components/glass";
import { AdminEmpty, AdminError, AdminPagination } from "@/components/admin/Shared";
import { getAdminUsers, setAmbassadorAccess, type AdminUserRow } from "@/lib/admin.functions";
import { adminPage, planLabel, subscriptionStatusLabel } from "@/lib/admin-view";
import { displayProfilePhone } from "@/lib/phone";

const ambassadorsQuery = (
  page: number,
  fetcher: (input: { data: { search: string; access: "ambassador"; subscription: "all"; page: number } }) => ReturnType<typeof getAdminUsers> = getAdminUsers,
) =>
  queryOptions({
    queryKey: ["admin", "ambassadors", page],
    queryFn: () => fetcher({ data: { search: "", access: "ambassador", subscription: "all", page } }),
    staleTime: 30_000,
  });

export const Route = createFileRoute("/_authenticated/admin/embaixadores")({
  validateSearch: (s) => ({ page: adminPage(s["page"]) }),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(ambassadorsQuery(deps.page)),
  head: () => ({ meta: [
    { title: "Embaixadores — Administração · Gestão Motoca Pro" },
    { name: "description", content: "Gestão dos embaixadores do Gestão Motoca Pro." },
    { property: "og:title", content: "Embaixadores — Administração · Gestão Motoca Pro" },
    { property: "og:description", content: "Gestão dos embaixadores do Gestão Motoca Pro." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  pendingComponent: () => <LoadingBlock label="Carregando embaixadores..." />,
  errorComponent: () => <AdminError title="Não foi possível carregar os embaixadores" />,
  component: AmbassadorsPage,
});

function AmbassadorsPage() {
  const { page } = Route.useSearch();
  const fetchUsers = useServerFn(getAdminUsers);
  const { data } = useSuspenseQuery(ambassadorsQuery(page, fetchUsers));
  const [pendingUser, setPendingUser] = useState<AdminUserRow | null>(null);
  const queryClient = useQueryClient();
  const updateAccess = useServerFn(setAmbassadorAccess);
  const update = useMutation({
    mutationFn: (input: { userId: string; grant: boolean }) => updateAccess({ data: input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "ambassadors"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Acesso de embaixador atualizado.");
      setPendingUser(null);
    },
    onError: (error: Error) => toast.error(error.message || "Não foi possível atualizar o acesso."),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle title="Embaixadores" subtitle="Usuários com acesso de embaixador e seus códigos de indicação." />
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/usuarios" search={{ page: 1, busca: "", acesso: "all", assinatura: "all" }}>Conceder acesso em Usuários</Link>
        </Button>
      </div>

      {data.rows.length ? (
        <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
          {data.rows.map((user) => (
            <div key={user.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold">{user.name || "Usuário"}</p>
                <p className="break-all text-xs text-muted-foreground">{user.email || "E-mail não informado"}</p>
                <p className="break-all text-xs text-muted-foreground tabular-nums">{displayProfilePhone(user.phone)}</p>
              </div>
              <div className="min-w-0 text-sm">
                <p>{user.plan ? planLabel(user.plan) : "Sem assinatura"} · {user.subscriptionStatus ? subscriptionStatusLabel(user.subscriptionStatus) : "Acesso de embaixador"}</p>
                {user.referral ? (
                  <p className="mt-1 break-all text-xs text-muted-foreground">Código de indicação: {user.referral}</p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">Sem código de indicação registrado</p>
                )}
              </div>
              <Button variant="outline" size="sm" className="h-auto min-h-11 whitespace-normal" onClick={() => setPendingUser(user)}>
                Remover acesso de embaixador
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <AdminEmpty
          label="Nenhum embaixador ativo no momento."
          action={<Button asChild variant="outline" size="sm"><Link to="/admin/usuarios" search={{ page: 1, busca: "", acesso: "all", assinatura: "all" }}><Megaphone className="size-4" />Conceder acesso em Usuários</Link></Button>}
        />
      )}
      <AdminPagination page={page} total={data.total} />

      <AlertDialog open={pendingUser !== null} onOpenChange={(open) => { if (!open && !update.isPending) setPendingUser(null); }}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover acesso de embaixador?</AlertDialogTitle>
            <AlertDialogDescription>
              Se o usuário não possuir uma assinatura ativa, ele perderá o acesso ao aplicativo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={update.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={update.isPending} onClick={(event) => { event.preventDefault(); if (pendingUser) update.mutate({ userId: pendingUser.id, grant: false }); }}>
              {update.isPending ? "Salvando..." : "Remover acesso"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
