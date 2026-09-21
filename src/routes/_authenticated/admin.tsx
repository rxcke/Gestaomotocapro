import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Bike, CreditCard, Fuel, TrendingDown, TrendingUp } from "lucide-react";
import { AmbientBackground, ErrorBlock, GlassCard, LoadingBlock, PageTitle, Stat } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { getAdminData, type AdminData } from "@/lib/admin.functions";
import { brl, dateBR, km } from "@/lib/format";
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
    { title: "Administração — Gestão Motoboy" },
    { name: "description", content: "Visão administrativa dos registros do Gestão Motoboy." },
    { property: "og:title", content: "Administração — Gestão Motoboy" },
    { property: "og:description", content: "Visão administrativa dos registros do Gestão Motoboy." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AdminPage,
});

type Section = "motorcycles" | "incomes" | "expenses" | "fuel" | "subscriptions";

function Owner({ data, userId }: { data: AdminData; userId: string }) {
  const owner = data.owners[userId];
  return <div className="min-w-0"><p className="truncate text-sm font-semibold">{owner?.name ?? "Usuário"}</p><p className="truncate text-xs text-muted-foreground">{owner?.email ?? userId}</p></div>;
}

function AdminPage() {
  const fetchAdminData = useServerFn(getAdminData);
  const query = useQuery({ queryKey: ["admin", "overview"], queryFn: () => fetchAdminData() });
  const [section, setSection] = useState<Section>("motorcycles");

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
  const totalIncome = data.incomes.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalExpense = data.expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const activeSubscriptions = data.subscriptions.filter((item) => item.status === "active").length;
  const sections = [
    { id: "motorcycles" as const, label: "Motos", icon: Bike, count: data.motorcycles.length },
    { id: "incomes" as const, label: "Ganhos", icon: TrendingUp, count: data.incomes.length },
    { id: "expenses" as const, label: "Gastos", icon: TrendingDown, count: data.expenses.length },
    { id: "fuel" as const, label: "Abastecimentos", icon: Fuel, count: data.fuelRecords.length },
    { id: "subscriptions" as const, label: "Assinaturas", icon: CreditCard, count: data.subscriptions.length },
  ];

  return <>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Stat label="Usuários com registros" value={Object.keys(data.owners).length} />
      <Stat label="Motos" value={data.motorcycles.length} />
      <Stat label="Ganhos registrados" value={brl(totalIncome)} tone="positive" />
      <Stat label="Gastos registrados" value={brl(totalExpense)} tone="negative" />
      <Stat label="Assinaturas ativas" value={activeSubscriptions} tone="positive" />
    </div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {sections.map((item) => <Button key={item.id} variant={section === item.id ? "default" : "outline"} className="h-auto min-h-12 justify-start px-3 py-2" onClick={() => setSection(item.id)}><item.icon className="mr-2 size-4 shrink-0" /><span className="min-w-0 truncate">{item.label}</span><span className={cn("ml-auto text-xs", section === item.id ? "text-primary-foreground/75" : "text-muted-foreground")}>{item.count}</span></Button>)}
    </div>
    <GlassCard padded={false} className="overflow-hidden">
      <div className="divide-y divide-border">
        {section === "motorcycles" && data.motorcycles.map((item) => <div key={item.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center"><Owner data={data} userId={item.user_id} /><div><p className="font-display font-bold">{item.brand} {item.model}</p><p className="text-xs text-muted-foreground">{item.year ?? "Ano não informado"} · {item.plate ?? "Sem placa"}</p></div><strong className="num-display text-sm">{km(item.current_km)}</strong></div>)}
        {section === "incomes" && data.incomes.map((item) => <div key={item.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center"><Owner data={data} userId={item.user_id} /><div><p className="font-semibold">{item.category}</p><p className="truncate text-xs text-muted-foreground">{item.description ?? "Sem descrição"} · {dateBR(item.date)}</p></div><strong className="num-display text-sm text-positive">{brl(item.amount)}</strong></div>)}
        {section === "expenses" && data.expenses.map((item) => <div key={item.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center"><Owner data={data} userId={item.user_id} /><div><p className="font-semibold">{item.category}</p><p className="truncate text-xs text-muted-foreground">{item.group_name} · {item.description ?? "Sem descrição"} · {dateBR(item.date)}</p></div><strong className="num-display text-sm text-negative">{brl(item.amount)}</strong></div>)}
        {section === "fuel" && data.fuelRecords.map((item) => <div key={item.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center"><Owner data={data} userId={item.user_id} /><div><p className="font-semibold">{item.station ?? "Posto não informado"}</p><p className="text-xs text-muted-foreground">{item.liters.toLocaleString("pt-BR")} L · {km(item.km)} · {dateBR(item.date)}</p></div><strong className="num-display text-sm">{brl(item.total)}</strong></div>)}
        {section === "subscriptions" && data.subscriptions.map((item) => <div key={item.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center"><Owner data={data} userId={item.user_id} /><div><p className="font-semibold">{item.plan === "monthly" ? "Mensal" : "Anual"} · {subscriptionStatus(item.status)}</p><p className="truncate text-xs text-muted-foreground">{item.kiwify_transaction_id ?? "Sem transação"} · {dateBR(item.started_at ?? item.created_at)}</p></div><strong className="text-sm">{item.expires_at ? dateBR(item.expires_at) : "—"}</strong></div>)}
        {((section === "motorcycles" && !data.motorcycles.length) || (section === "incomes" && !data.incomes.length) || (section === "expenses" && !data.expenses.length) || (section === "fuel" && !data.fuelRecords.length) || (section === "subscriptions" && !data.subscriptions.length)) ? <p className="p-8 text-center text-sm text-muted-foreground">Nenhum registro encontrado.</p> : null}
      </div>
    </GlassCard>
  </>;
}

function subscriptionStatus(status: AdminData["subscriptions"][number]["status"]) {
  return ({ pending: "Pendente", active: "Ativa", canceled: "Cancelada", expired: "Expirada", refunded: "Reembolsada", chargeback: "Chargeback" })[status];
}