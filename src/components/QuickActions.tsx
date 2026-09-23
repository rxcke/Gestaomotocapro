import { useState } from "react";
import { Banknote, Fuel, Receipt, Wrench } from "lucide-react";
import { ExpenseDialog, FuelDialog, IncomeDialog, MaintenanceDialog } from "./forms/dialogs";

type Kind = "income" | "expense" | "fuel" | "maintenance" | null;

const ACTIONS = [
  { kind: "income" as const, icon: Banknote, label: "+ Ganho", hint: "Registrar entrada" },
  { kind: "expense" as const, icon: Receipt, label: "+ Gasto", hint: "Registrar despesa" },
  { kind: "fuel" as const, icon: Fuel, label: "+ Abastecimento", hint: "Litros e preço" },
  { kind: "maintenance" as const, icon: Wrench, label: "+ Manutenção", hint: "Próximo KM" },
];

export function QuickActions({ sessionId }: { sessionId?: string | null }) {
  const [open, setOpen] = useState<Kind>(null);
  const close = () => setOpen(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ACTIONS.map((a) => (
          <button
            key={a.kind}
            type="button"
            onClick={() => setOpen(a.kind)}
            className="glass-soft flex flex-col items-start gap-1 p-4 text-left transition hover:-translate-y-0.5"
          >
            <a.icon className="size-5 text-accent" />
            <span className="text-sm font-bold">{a.label}</span>
            <span className="text-[11px] text-muted-foreground">{a.hint}</span>
          </button>
        ))}
      </div>

      <IncomeDialog open={open === "income"} onOpenChange={close} sessionId={sessionId ?? null} />
      <ExpenseDialog open={open === "expense"} onOpenChange={close} sessionId={sessionId ?? null} />
      <FuelDialog open={open === "fuel"} onOpenChange={close} sessionId={sessionId ?? null} />
      <MaintenanceDialog open={open === "maintenance"} onOpenChange={close} sessionId={sessionId ?? null} />
    </>
  );
}
