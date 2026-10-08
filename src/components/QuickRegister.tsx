import { useState } from "react";
import { Banknote, Fuel, Plus, Receipt, Wrench } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ExpenseDialog, FuelDialog, IncomeDialog, MaintenanceDialog } from "./forms/dialogs";
import { cn } from "@/lib/utils";

type Kind = "income" | "expense" | "fuel" | "maintenance" | null;

const ACTIONS = [
  { kind: "income" as const, icon: Banknote, label: "Ganho", tone: "text-positive" },
  { kind: "expense" as const, icon: Receipt, label: "Gasto", tone: "text-negative" },
  { kind: "fuel" as const, icon: Fuel, label: "Combustível", tone: "text-accent" },
  { kind: "maintenance" as const, icon: Wrench, label: "Manutenção", tone: "text-accent" },
];

/** Botão "Registrar" sempre ao alcance do polegar, com os quatro registros rápidos. */
export function QuickRegister({ variant = "fab" }: { variant?: "fab" | "sidebar" }) {
  const [sheet, setSheet] = useState(false);
  const [open, setOpen] = useState<Kind>(null);
  const close = () => setOpen(null);
  const pick = (k: Kind) => {
    setSheet(false);
    setOpen(k);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setSheet(true)}
        aria-label="Registrar"
        className={cn(
          "flex items-center justify-center gap-2 bg-primary font-bold text-primary-foreground transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          variant === "fab"
            ? "fixed right-4 z-30 h-14 rounded-full px-5 shadow-lg lg:hidden"
            : "h-12 w-full rounded-xl text-sm",
        )}
        style={variant === "fab" ? { bottom: "calc(5rem + env(safe-area-inset-bottom))" } : undefined}
      >
        <Plus className="size-5" />
        <span className="text-sm uppercase tracking-wide">Registrar</span>
      </button>

      <Sheet open={sheet} onOpenChange={setSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:mx-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="font-display">O que você quer registrar?</SheetTitle>
            <SheetDescription>Registre agora, detalhe depois.</SheetDescription>
          </SheetHeader>
          <div className="mt-2 grid grid-cols-2 gap-3 px-4">
            {ACTIONS.map((a) => (
              <button
                key={a.kind}
                type="button"
                onClick={() => pick(a.kind)}
                className="flex min-h-20 flex-col items-start justify-center gap-2 rounded-2xl bg-muted/50 p-4 text-left transition active:scale-[0.98] hover:bg-muted"
              >
                <a.icon className={cn("size-6", a.tone)} />
                <span className="text-base font-bold">+ {a.label}</span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <IncomeDialog open={open === "income"} onOpenChange={close} />
      <ExpenseDialog open={open === "expense"} onOpenChange={close} />
      <FuelDialog open={open === "fuel"} onOpenChange={close} />
      <MaintenanceDialog open={open === "maintenance"} onOpenChange={close} />
    </>
  );
}
