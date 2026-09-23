import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ExpenseDialog, IncomeDialog } from "@/components/forms/dialogs";
import { ErrorBlock, GlassCard, LoadingBlock, PageTitle, Stat } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useScopedData } from "@/lib/app-context";
import { daysAgoPeriod, financeSummary, inPeriod, monthPeriod, type Period } from "@/lib/calc";
import { useRemove } from "@/lib/data";
import { brl, dateBR } from "@/lib/format";
import type { Expense, Income } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/app/dinheiro")({
  head: () => ({ meta: [
    { title: "Dinheiro — Gestão Motoca Pro" },
    { name: "description", content: "Ganhos, despesas e resultado líquido da sua moto." },
    { property: "og:title", content: "Dinheiro — Gestão Motoca Pro" },
    { property: "og:description", content: "Ganhos, despesas e resultado líquido da sua moto." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: MoneyPage,
});

type DialogState = { kind: "income"; record?: Income } | { kind: "expense"; record?: Expense } | null;

function MoneyPage() {
  const data = useScopedData();
  const [periodKey, setPeriodKey] = useState("month");
  const [dialog, setDialog] = useState<DialogState>(null);
  const removeIncome = useRemove("incomes", "Ganho excluído.");
  const removeExpense = useRemove("expenses", "Gasto excluído.");

  const period: Period = useMemo(() => {
    if (periodKey === "today") return daysAgoPeriod(1);
    if (periodKey === "7") return daysAgoPeriod(7);
    if (periodKey === "previous") return monthPeriod(-1);
    return monthPeriod();
  }, [periodKey]);

  if (data.isLoading) return <LoadingBlock />;
  if (data.isError) return <ErrorBlock />;
  const result = financeSummary(data.incomes, data.expenses, period);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <PageTitle title="Dinheiro" subtitle="Tudo que entra, sai e sobra." />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setDialog({ kind: "income" })}><Plus className="mr-1 size-4" /> Ganho</Button>
          <Button size="sm" variant="outline" onClick={() => setDialog({ kind: "expense" })}><Plus className="mr-1 size-4" /> Gasto</Button>
        </div>
      </div>

      <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
        {[{k:"today",l:"Hoje"},{k:"7",l:"7 dias"},{k:"month",l:"Este mês"},{k:"previous",l:"Mês anterior"}].map((p) => (
          <Button key={p.k} size="sm" variant={periodKey === p.k ? "default" : "outline"} className="shrink-0" onClick={() => setPeriodKey(p.k)}>{p.l}</Button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Entradas" value={brl(result.totalIncome)} tone="positive" />
        <Stat label="Despesas" value={brl(result.totalExpense)} tone="negative" />
        <Stat label="Resultado líquido" value={brl(result.net)} tone={result.net >= 0 ? "positive" : "negative"} />
      </div>

      <GlassCard>
        <Tabs defaultValue="all">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="all">Tudo</TabsTrigger>
            <TabsTrigger value="income">Ganhos</TabsTrigger>
            <TabsTrigger value="expense">Gastos</TabsTrigger>
          </TabsList>
          <TabsContent value="all"><Ledger incomes={result.incomes} expenses={result.expenses} onEdit={setDialog} onRemoveIncome={removeIncome.mutate} onRemoveExpense={removeExpense.mutate} /></TabsContent>
          <TabsContent value="income"><Ledger incomes={result.incomes} expenses={[]} onEdit={setDialog} onRemoveIncome={removeIncome.mutate} onRemoveExpense={removeExpense.mutate} /></TabsContent>
          <TabsContent value="expense"><Ledger incomes={[]} expenses={result.expenses} onEdit={setDialog} onRemoveIncome={removeIncome.mutate} onRemoveExpense={removeExpense.mutate} /></TabsContent>
        </Tabs>
      </GlassCard>

      <IncomeDialog open={dialog?.kind === "income"} onOpenChange={(v) => !v && setDialog(null)} record={dialog?.kind === "income" ? dialog.record ?? null : null} />
      <ExpenseDialog open={dialog?.kind === "expense"} onOpenChange={(v) => !v && setDialog(null)} record={dialog?.kind === "expense" ? dialog.record ?? null : null} />
    </div>
  );
}

function Ledger({ incomes, expenses, onEdit, onRemoveIncome, onRemoveExpense }: {
  incomes: Income[]; expenses: Expense[]; onEdit: (v: DialogState) => void; onRemoveIncome: (id: string) => void; onRemoveExpense: (id: string) => void;
}) {
  const rows = [
    ...incomes.map((r) => ({ ...r, kind: "income" as const })),
    ...expenses.map((r) => ({ ...r, kind: "expense" as const })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  if (!rows.length) return <p className="py-10 text-center text-sm text-muted-foreground">Nenhum lançamento neste período.</p>;
  return <div className="mt-4 divide-y divide-border/60">{rows.map((r) => (
    <div key={`${r.kind}-${r.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
      <div className="min-w-0"><p className="truncate text-sm font-semibold">{r.category}</p><p className="truncate text-xs text-muted-foreground">{dateBR(r.date)}{r.description ? ` · ${r.description}` : ""}</p></div>
      <div className="flex items-center gap-1"><span className={`mr-1 num-display text-sm ${r.kind === "income" ? "text-positive" : "text-negative"}`}>{r.kind === "income" ? "+" : "−"}{brl(r.amount)}</span>
        {r.kind === "expense" && r.fuel_record_id ? null : <>
          <Button variant="ghost" size="icon" className="size-8" aria-label="Editar" onClick={() => onEdit(r.kind === "income" ? {kind:"income",record:r} : {kind:"expense",record:r})}><Pencil className="size-3.5" /></Button>
          <Button variant="ghost" size="icon" className="size-8 text-negative" aria-label="Excluir" onClick={() => { if (window.confirm("Excluir este lançamento?")) r.kind === "income" ? onRemoveIncome(r.id) : onRemoveExpense(r.id); }}><Trash2 className="size-3.5" /></Button>
        </>}
      </div>
    </div>
  ))}</div>;
}