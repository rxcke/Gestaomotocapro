import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Info } from "lucide-react";
import { LoadingBlock, PageTitle, Stat } from "@/components/glass";
import { AdminError } from "@/components/admin/Shared";
import { getAdminFinancial } from "@/lib/admin.functions";
import { brl } from "@/lib/format";

const financialQuery = (fetcher: () => ReturnType<typeof getAdminFinancial> = getAdminFinancial) =>
  queryOptions({
    queryKey: ["admin", "financial"],
    queryFn: () => fetcher(),
    staleTime: 60_000,
  });

export const Route = createFileRoute("/_authenticated/admin/financeiro")({
  loader: ({ context }) => context.queryClient.ensureQueryData(financialQuery()),
  head: () => ({ meta: [
    { title: "Financeiro — Administração · Gestão Motoca Pro" },
    { name: "description", content: "Agregados dos registros financeiros feitos pelos usuários no aplicativo." },
    { property: "og:title", content: "Financeiro — Administração · Gestão Motoca Pro" },
    { property: "og:description", content: "Agregados dos registros financeiros feitos pelos usuários." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  pendingComponent: () => <LoadingBlock label="Carregando dados financeiros..." />,
  errorComponent: () => <AdminError title="Não foi possível carregar os dados financeiros" />,
  component: FinancialPage,
});

function FinancialPage() {
  const fetchFinancial = useServerFn(getAdminFinancial);
  const { data } = useSuspenseQuery(financialQuery(fetchFinancial));

  return (
    <div className="space-y-6">
      <PageTitle title="Financeiro" subtitle="Agregados dos registros feitos pelos usuários no aplicativo." />

      <div className="flex items-start gap-3 rounded-md border border-border p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-accent" />
        <p>
          Estes números representam <strong className="text-foreground">ganhos e gastos que os motoboys registraram no aplicativo</strong>.
          Não são receita nem faturamento do Gestão Motoca Pro.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Ganhos registrados pelos usuários" value={brl(data.incomeTotal)} tone="positive" hint={`${data.incomeCount.toLocaleString("pt-BR")} registros`} />
        <Stat label="Gastos registrados pelos usuários" value={brl(data.expenseTotal)} tone="negative" hint={`${data.expenseCount.toLocaleString("pt-BR")} registros`} />
        <Stat label="Abastecimentos registrados" value={brl(data.fuelTotal)} hint={`${data.fuelCount.toLocaleString("pt-BR")} registros`} />
        <Stat label="Motos cadastradas" value={data.motorcycleCount} />
        <Stat label="Usuários cadastrados" value={data.userCount} />
        <Stat
          label="Resultado líquido dos registros"
          value={brl(data.incomeTotal - data.expenseTotal - data.fuelTotal)}
          tone={data.incomeTotal - data.expenseTotal - data.fuelTotal >= 0 ? "positive" : "negative"}
          hint="Ganhos menos gastos e abastecimentos dos usuários"
        />
      </div>
    </div>
  );
}
