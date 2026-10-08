import { demoRemainingLabel } from "@/lib/demo";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Bike, CreditCard, Fuel, ShieldCheck, TrendingDown, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { AmbientBackground, ErrorBlock, GlassCard, LoadingBlock, PageTitle, Stat } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getAdminData, setAmbassadorAccess, type AdminData } from "@/lib/admin.functions";
import { brl, dateBR, km } from "@/lib/format";
import { displayProfilePhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw redirect({ to: "/auth" });
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) throw redirect({ to: "/app" });
  },
  head: () => ({ meta: [
    { title: "Administração — Gestão Motoca Pro" },
    { name: "description", content: "Visão administrativa dos registros do Gestão Motoca Pro." },
    { property: "og:title", content: "Administração — Gestão Motoca Pro" },
    { property: "og:description", content: "Visão administrativa dos registros do Gestão Motoca Pro." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AdminPage,
});

type Section = "users" | "motorcycles" | "incomes" | "expenses" | "fuel" | "subscriptions" | "webhooks";

function Owner({ data, userId }: { data: AdminData; userId: string }) {
  const owner = data.owners[userId];
  return <div className="min-w-0"><p className="truncate text-sm font-semibold">{owner?.name ?? "Usuário"}</p><p className="truncate text-xs text-muted-foreground">{owner?.email ?? userId}</p></div>;
}

function AdminPage() {
  const fetchAdminData = useServerFn(getAdminData);
  const query = useQuery({ queryKey: ["admin", "overview"], queryFn: () => fetchAdminData() });
  const [section, setSection] = useState<Section>("users");

  return <div className="relative min-h-dvh bg-canvas px-4 py-6 text-foreground sm:px-6 lg:px-10 lg:py-8">
    <AmbientBackground />
    <main className="relative mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <PageTitle title="Administração" subtitle="Dados reais de todos os usuários, com acesso restrito." />
        <Button asChild variant="outline" size="sm"><Link to="/app"><ArrowLeft className="mr-2 size-4" />Painel</Link></Button>
      </div>
      {query.isLoading ? <LoadingBlock label="Carregando visão administrativa..." /> : query.isError || !query.data ? <ErrorBlock message={query.error instanceof Error ? query.error.message : "Não foi possível carregar os dados administrativos."} /> : <AdminContent data={query.data} section={section} setSection={setSection} />}
    </main>
  </div>;
}

function AdminContent({ data, section, setSection }: { data: AdminData; section: Section; setSection: (section: Section) => void }) {
  const [pendingUser, setPendingUser] = useState<AdminData["users"][number] | null>(null);
  const queryClient = useQueryClient();
  const updateAccess = useServerFn(setAmbassadorAccess);
  const update = useMutation({
    mutationFn: (input: { userId: string; grant: boolean }) => updateAccess({ data: input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
      toast.success("Acesso de embaixador atualizado.");
      setPendingUser(null);
    },
    onError: (error: Error) => toast.error(error.message || "Não foi possível atualizar o acesso."),
  });
  const totalIncome = data.incomes.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalExpense = data.expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const activeSubscriptions = data.subscriptions.filter((item) => item.status === "active").length;
  const monthlySubscriptions = data.subscriptions.filter((item) => item.plan === "monthly").length;
  const quarterlySubscriptions = data.subscriptions.filter((item) => item.plan === "quarterly").length;
  const annualSubscriptions = data.subscriptions.filter((item) => item.plan === "annual").length;
  const canceledSubscriptions = data.subscriptions.filter((item) => item.status === "canceled").length;
  const expiredSubscriptions = data.subscriptions.filter((item) => item.status === "expired").length;
  const refundedSubscriptions = data.subscriptions.filter((item) => item.status === "refunded").length;
  const chargebackSubscriptions = data.subscriptions.filter((item) => item.status === "chargeback").length;
  const subscriptionsByUser = new Map<string, AdminData["subscriptions"][number]>();
  for (const subscription of data.subscriptions) {
    if (!subscriptionsByUser.has(subscription.user_id)) subscriptionsByUser.set(subscription.user_id, subscription);
  }
  const sections = [
    { id: "users" as const, label: "Usuários", icon: Users, count: data.users.length },
    { id: "motorcycles" as const, label: "Motos", icon: Bike, count: data.motorcycles.length },
    { id: "incomes" as const, label: "Ganhos", icon: TrendingUp, count: data.incomes.length },
    { id: "expenses" as const, label: "Gastos", icon: TrendingDown, count: data.expenses.length },
    { id: "fuel" as const, label: "Abastecimentos", icon: Fuel, count: data.fuelRecords.length },
    { id: "subscriptions" as const, label: "Assinaturas", icon: CreditCard, count: data.subscriptions.length },
    { id: "webhooks" as const, label: "Webhooks", icon: ShieldCheck, count: data.webhookEvents.length },
  ];

  return <>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Usuários com registros" value={Object.keys(data.owners).length} />
      <Stat label="Motos" value={data.motorcycles.length} />
      <Stat label="Ganhos registrados" value={brl(totalIncome)} tone="positive" />
      <Stat label="Gastos registrados" value={brl(totalExpense)} tone="negative" />
      <Stat label="Assinaturas ativas" value={activeSubscriptions} tone="positive" />
      <Stat label="Planos mensais" value={monthlySubscriptions} />
      <Stat label="Planos trimestrais" value={quarterlySubscriptions} />
      <Stat label="Planos anuais" value={annualSubscriptions} />
      <Stat label="Canceladas" value={canceledSubscriptions} />
      <Stat label="Expiradas" value={expiredSubscriptions} />
      <Stat label="Reembolsadas" value={refundedSubscriptions} tone="negative" />
      <Stat label="Chargebacks" value={chargebackSubscriptions} tone="negative" />
    </div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
      {sections.map((item) => <Button key={item.id} variant={section === item.id ? "default" : "outline"} className="h-auto min-h-12 justify-start px-2 py-2 sm:px-3" onClick={() => setSection(item.id)}><item.icon className="mr-2 size-4 shrink-0" /><span className="min-w-0 truncate text-xs sm:text-sm">{item.label}</span><span className={cn("ml-auto text-xs", section === item.id ? "text-primary-foreground/75" : "text-muted-foreground")}>{item.count}</span></Button>)}
    </div>
    <GlassCard padded={false} className="overflow-hidden">
      <div className="divide-y divide-border">
        {section === "users" && <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,.65fr)_minmax(0,.75fr)_minmax(0,1.4fr)] gap-3 px-4 py-3 text-xs font-semibold text-muted-foreground lg:grid"><span>Nome</span><span>E-mail</span><span>WhatsApp</span><span>Acesso</span><span>Plano</span><span>Status</span><span>Ações</span></div>}
        {section === "users" && data.users.map((user) => {
          const subscription = subscriptionsByUser.get(user.id);
          const access = user.admin ? "Admin" : user.ambassador ? "Embaixador" : user.subscribed ? "Assinante" : user.demo && user.demoExpiresAt ? (new Date(user.demoExpiresAt).getTime() > Date.now() ? "Demonstração" : "Demonstração expirada") : "Sem assinatura ativa";
          const plan = subscription ? ({ monthly: "Start", quarterly: "Pro", annual: "Elite" } as const)[subscription.plan] : "—";
          const status = subscription ? subscriptionStatus(subscription.provider_status === "pending" && subscription.status !== "pending" ? subscription.status : subscription.provider_status) : "—";
          return <div key={user.id} className="grid min-w-0 grid-cols-2 items-start gap-x-3 gap-y-3 p-4 text-sm lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,.65fr)_minmax(0,.75fr)_minmax(0,1.4fr)] lg:items-center">
            <div className="col-span-2 min-w-0 lg:col-span-1"><span className="mb-1 block text-xs text-muted-foreground lg:hidden">Nome</span><p className="break-words font-semibold">{user.name || "Usuário"}</p></div>
            <div className="col-span-2 min-w-0 lg:col-span-1"><span className="mb-1 block text-xs text-muted-foreground lg:hidden">E-mail</span><p className="break-all">{user.email || "E-mail não informado"}</p></div>
            <div className="col-span-2 min-w-0 lg:col-span-1"><span className="mb-1 block text-xs text-muted-foreground lg:hidden">WhatsApp</span><p className="break-all tabular-nums">{displayProfilePhone(user.phone)}</p></div>
            <div className="min-w-0"><span className="mb-1 block text-xs text-muted-foreground lg:hidden">Acesso</span><p className="break-words">{access}</p>{user.demo && user.demoStartedAt && !user.subscribed && <p className="mt-1 text-xs text-muted-foreground">{new Date(user.demoStartedAt).toLocaleString("pt-BR")} → {new Date(user.demoExpiresAt ?? user.demoStartedAt).toLocaleString("pt-BR")}{demoRemainingLabel(user.demoExpiresAt, Date.now())?.expired === false ? ` · ${demoRemainingLabel(user.demoExpiresAt, Date.now())?.text}` : ""}</p>}{user.referral && <p className="mt-1 break-all text-xs text-muted-foreground">Indicação: {user.referral}</p>}</div>
            <div className="min-w-0"><span className="mb-1 block text-xs text-muted-foreground lg:hidden">Plano</span><p>{plan}</p></div>
            <div className="min-w-0"><span className="mb-1 block text-xs text-muted-foreground lg:hidden">Status</span><p className="break-words">{status}</p></div>
            <div className="col-span-2 min-w-0 lg:col-span-1"><Button variant="outline" className="h-auto min-h-12 w-full whitespace-normal text-center" onClick={() => setPendingUser(user)}>{user.ambassador ? "Remover acesso de embaixador" : "Tornar embaixador"}</Button></div>
          </div>;
        })}
        {section === "motorcycles" && data.motorcycles.map((item) => <div key={item.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center"><Owner data={data} userId={item.user_id} /><div><p className="font-display font-bold">{item.brand} {item.model}</p><p className="text-xs text-muted-foreground">{item.year ?? "Ano não informado"} · {item.plate ?? "Sem placa"}</p></div><strong className="num-display text-sm">{km(item.current_km)}</strong></div>)}
        {section === "incomes" && data.incomes.map((item) => <div key={item.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center"><Owner data={data} userId={item.user_id} /><div><p className="font-semibold">{item.category}</p><p className="truncate text-xs text-muted-foreground">{item.description ?? "Sem descrição"} · {dateBR(item.date)}</p></div><strong className="num-display text-sm text-positive">{brl(item.amount)}</strong></div>)}
        {section === "expenses" && data.expenses.map((item) => <div key={item.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center"><Owner data={data} userId={item.user_id} /><div><p className="font-semibold">{item.category}</p><p className="truncate text-xs text-muted-foreground">{item.group_name} · {item.description ?? "Sem descrição"} · {dateBR(item.date)}</p></div><strong className="num-display text-sm text-negative">{brl(item.amount)}</strong></div>)}
        {section === "fuel" && data.fuelRecords.map((item) => { const details = [item.liters != null ? `${item.liters.toLocaleString("pt-BR")} L` : null, item.km != null ? km(item.km) : null, dateBR(item.date)].filter(Boolean); return <div key={item.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center"><Owner data={data} userId={item.user_id} /><div><p className="font-semibold">{item.station ?? "Posto não informado"}</p><p className="text-xs text-muted-foreground">{details.join(" · ")}</p></div><strong className="num-display text-sm">{brl(item.total)}</strong></div>})}
        {section === "subscriptions" && data.subscriptions.map((item) => <div key={item.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center"><Owner data={data} userId={item.user_id} /><div><p className="font-semibold">{item.plan === "monthly" ? "Start · Mensal" : item.plan === "quarterly" ? "Pro · Trimestral" : "Elite · Anual"} · {subscriptionStatus(item.provider_status === "pending" && item.status !== "pending" ? item.status : item.provider_status)}</p><p className="truncate text-xs text-muted-foreground">{item.cakto_transaction_id ?? "Sem transação"} · {dateBR(item.started_at ?? item.created_at)}</p></div><div className="text-sm sm:text-right"><strong>{item.expires_at ? dateBR(item.expires_at) : "—"}</strong>{item.recurring_amount !== null ? <p className="text-xs text-muted-foreground">{brl(Number(item.recurring_amount))}</p> : null}</div>{item.trial_started_at ? <p className="text-xs text-muted-foreground sm:col-span-3">Trial: {dateBR(item.trial_started_at)} até {dateBR(item.trial_ends_at)}</p> : null}</div>)}
        {section === "webhooks" && data.webhookEvents.map((item) => <div key={item.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center"><div><p className="font-semibold">{item.event_type}</p><p className="truncate text-xs text-muted-foreground">{item.transaction_id ?? "Sem transação"}</p></div><div><p className="text-sm">{item.processed ? "Processado" : "Não processado"}</p><p className="truncate text-xs text-muted-foreground">{item.error_message ?? "Sem erro registrado"}</p></div><strong className="text-sm">{dateBR(item.created_at)}</strong></div>)}
        {((section === "users" && !data.users.length) || (section === "motorcycles" && !data.motorcycles.length) || (section === "incomes" && !data.incomes.length) || (section === "expenses" && !data.expenses.length) || (section === "fuel" && !data.fuelRecords.length) || (section === "subscriptions" && !data.subscriptions.length) || (section === "webhooks" && !data.webhookEvents.length)) ? <p className="p-8 text-center text-sm text-muted-foreground">Nenhum registro encontrado.</p> : null}
      </div>
    </GlassCard>
    <AlertDialog open={pendingUser !== null} onOpenChange={(open) => { if (!open && !update.isPending) setPendingUser(null); }}><AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-md"><AlertDialogHeader><AlertDialogTitle>{pendingUser?.ambassador ? "Remover acesso de embaixador?" : "Conceder acesso de embaixador?"}</AlertDialogTitle><AlertDialogDescription>{pendingUser?.ambassador ? "Se o usuário não possuir uma assinatura ativa, ele perderá o acesso ao aplicativo." : "Este usuário terá acesso gratuito ao Gestão Motoca Pro sem precisar de assinatura."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={update.isPending}>Cancelar</AlertDialogCancel><AlertDialogAction disabled={update.isPending} onClick={(event) => { event.preventDefault(); if (pendingUser) update.mutate({ userId: pendingUser.id, grant: !pendingUser.ambassador }); }}>{update.isPending ? "Salvando..." : pendingUser?.ambassador ? "Remover acesso" : "Conceder acesso"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </>;
}

function subscriptionStatus(status: string) {
  return ({ pending: "Pendente", trial: "Trial", active: "Ativa", canceled: "Cancelada", expired: "Expirada", refunded: "Reembolsada", chargeback: "Chargeback", paused: "Pausada", late: "Inadimplente" } as Record<string, string>)[status] ?? "Pendente";
}