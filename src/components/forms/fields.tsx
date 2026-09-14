import type { ReactNode } from "react";
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
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  onSubmit: (form: FormData) => void;
  submitting?: boolean;
  submitLabel?: string;
  children: ReactNode;
}) {
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
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
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
  inputMode,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | undefined;
  required?: boolean;
  placeholder?: string;
  step?: string;
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
