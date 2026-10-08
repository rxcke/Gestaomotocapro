import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useAccess, openUpgrade } from "@/lib/use-access";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  submitting,
  submitLabel = "Salvar",
  actionClassName,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  onSubmit: (form: FormData) => void;
  submitting?: boolean;
  submitLabel?: string;
  actionClassName?: string;
  children: ReactNode;
}) {
  const access = useAccess();
  const blocked = Boolean(access.data && !access.data.hasAppAccess);
  useEffect(() => {
    if (open && blocked) { onOpenChange(false); openUpgrade(); }
  }, [open, blocked, onOpenChange]);
  if (open && blocked) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(new FormData(e.currentTarget));
          }}
        >
          {children}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className={`flex-1 ${actionClassName ?? ""}`} onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className={`flex-1 ${actionClassName ?? ""}`} disabled={submitting}>
              {submitting ? "Salvando..." : submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  placeholder,
  step,
  min,
  inputMode,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | undefined;
  required?: boolean;
  placeholder?: string;
  step?: string;
  min?: string;
  inputMode?: "decimal" | "numeric" | "text";
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required ?? false}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder ?? ""}
        step={step ?? ""}
        min={min}
        inputMode={inputMode ?? "text"}
        className="h-12 text-base"
      />
    </div>
  );
}

export function SelectField({
  label,
  name,
  options,
  defaultValue,
  placeholder = "Selecione",
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Select name={name} defaultValue={defaultValue ?? options[0]?.value ?? ""}>
        <SelectTrigger id={name} className="h-12 w-full text-base">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export const numberOrNull = (v: FormDataEntryValue | null) => {
  if (v == null || String(v).trim() === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

export const textOrNull = (v: FormDataEntryValue | null) => {
  const s = v == null ? "" : String(v).trim();
  return s === "" ? null : s;
};

/** Valor em destaque: primeiro passo do fluxo "registrar primeiro → detalhar depois". */
export function AmountField({
  question,
  name = "amount",
  defaultValue,
}: {
  question: string;
  name?: string;
  defaultValue?: string | number;
}) {
  return (
    <div className="rounded-2xl bg-muted/40 px-4 py-5 text-center">
      <Label htmlFor={name} className="block text-sm font-semibold text-muted-foreground">{question}</Label>
      <div className="mt-2 flex items-baseline justify-center gap-2">
        <span className="font-display text-2xl font-bold text-muted-foreground">R$</span>
        <input
          id={name}
          name={name}
          type="number"
          step="0.01"
          min="0.01"
          inputMode="decimal"
          required
          autoFocus
          placeholder="0,00"
          defaultValue={defaultValue ?? ""}
          className="num-display w-full min-w-0 max-w-[12ch] bg-transparent text-center text-4xl text-foreground outline-none placeholder:text-muted-foreground/50 focus-visible:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
    </div>
  );
}

/** Detalhes opcionais recolhidos. Os campos ficam sempre montados para irem no formulário. */
export function OptionalDetails({ children, defaultOpen = false }: { children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between rounded-xl px-1 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
      >
        <span>Detalhes (opcional)</span>
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={open ? "mt-2 space-y-4 animate-in fade-in-0 slide-in-from-top-1 duration-200" : "hidden"}>{children}</div>
    </div>
  );
}
