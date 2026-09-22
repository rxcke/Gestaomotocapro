import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Field, FormDialog, SelectField, numberOrNull, textOrNull } from "./fields";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useApp, ALL_MOTOS } from "@/lib/app-context";
import { useUpsert } from "@/lib/data";
import {
  DOCUMENT_TYPES,
  EXPENSE_GROUPS,
  GOAL_TYPES,
  INCOME_CATEGORIES,
  MAINTENANCE_CATEGORIES,
} from "@/lib/constants";
import { todayISO } from "@/lib/format";
import { normalizeFuelMeasurements } from "@/lib/fuel";
import { normalizeMaintenanceInput } from "@/lib/maintenance";
import type {
  AppDocument,
  Expense,
  FuelRecord,
  Goal,
  Income,
  MaintenanceRecord,
  Motorcycle,
} from "@/lib/types";

type DialogProps = { open: boolean; onOpenChange: (v: boolean) => void };

function useMotoOptions(allowEmpty = false) {
  const { motorcycles, motoId } = useApp();
  const options = motorcycles.map((m) => ({ value: m.id, label: `${m.brand} ${m.model}` }));
  if (allowEmpty) options.push({ value: "none", label: "Sem moto" });
  const preselect = motoId !== ALL_MOTOS ? motoId : (options[0]?.value ?? "none");
  return { options, preselect };
}

const motoValue = (v: FormDataEntryValue | null) => {
  const s = v == null ? "" : String(v);
  return s === "" || s === "none" ? null : s;
};

/* ---------------------------------- Moto ---------------------------------- */

export function MotoDialog({
  open,
  onOpenChange,
  record,
}: DialogProps & { record?: Motorcycle | null }) {
  const save = useUpsert("motorcycles", "motorcycles", {
    successMessage: record ? "Moto atualizada." : "Moto cadastrada com sucesso.",
    onDone: () => onOpenChange(false),
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={record ? "Editar moto" : "Cadastrar moto"}
      onSubmit={(f) =>
        save.mutate({
          ...(record ? { id: record.id } : {}),
          brand: String(f.get("brand")),
          model: String(f.get("model")),
          year: numberOrNull(f.get("year")),
          plate: textOrNull(f.get("plate")),
          current_km: numberOrNull(f.get("current_km")) ?? 0,
          purchase_value: numberOrNull(f.get("purchase_value")),
          purchase_date: textOrNull(f.get("purchase_date")),
          photo_url: textOrNull(f.get("photo_url")),
        })
      }
      submitting={save.isPending}
    >
      <Field label="Marca" name="brand" required defaultValue={record?.brand} placeholder="Honda" />
      <Field label="Modelo" name="model" required defaultValue={record?.model} placeholder="CG 160" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ano" name="year" type="number" inputMode="numeric" defaultValue={record?.year ?? ""} />
        <Field label="Placa" name="plate" defaultValue={record?.plate ?? ""} placeholder="ABC1D23" />
      </div>
      <Field
        label="Quilometragem atual"
        name="current_km"
        type="number"
        inputMode="decimal"
        required
        defaultValue={record?.current_km ?? ""}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Valor de compra"
          name="purchase_value"
          type="number"
          step="0.01"
          min="0.01"
          inputMode="decimal"
          defaultValue={record?.purchase_value ?? ""}
        />
        <Field label="Data da compra" name="purchase_date" type="date" defaultValue={record?.purchase_date ?? ""} />
      </div>
      <Field label="Foto (link)" name="photo_url" defaultValue={record?.photo_url ?? ""} placeholder="https://..." />
    </FormDialog>
  );
}

/* --------------------------------- Ganho ---------------------------------- */

export function IncomeDialog({
  open,
  onOpenChange,
  record,
  sessionId,
}: DialogProps & { record?: Income | null; sessionId?: string | null }) {
  const { options, preselect } = useMotoOptions(true);
  const save = useUpsert("incomes", "incomes", {
    successMessage: "Ganho salvo com sucesso.",
    onDone: () => onOpenChange(false),
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={record ? "Editar ganho" : "Adicionar ganho"}
      onSubmit={(f) =>
        save.mutate({
          ...(record ? { id: record.id } : {}),
          amount: numberOrNull(f.get("amount")) ?? 0,
          category: String(f.get("category")),
          date: String(f.get("date")),
          time: textOrNull(f.get("time")),
          description: textOrNull(f.get("description")),
          motorcycle_id: motoValue(f.get("motorcycle_id")),
          work_session_id: record?.work_session_id ?? sessionId ?? null,
        })
      }
      submitting={save.isPending}
      submitLabel="Salvar ganho"
    >
      <Field
        label="Valor (R$)"
        name="amount"
        type="number"
        step="0.01"
        inputMode="decimal"
        required
        defaultValue={record?.amount ?? ""}
      />
      <SelectField
        label="Categoria"
        name="category"
        options={INCOME_CATEGORIES.map((c) => ({ value: c, label: c }))}
        defaultValue={record?.category ?? "Entrega"}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Data" name="date" type="date" required defaultValue={record?.date ?? todayISO()} />
        <Field label="Hora (opcional)" name="time" type="time" defaultValue={record?.time?.slice(0, 5) ?? ""} />
      </div>
      {options.length > 1 ? (
        <SelectField
          label="Moto"
          name="motorcycle_id"
          options={options}
          defaultValue={record?.motorcycle_id ?? preselect}
        />
      ) : null}
      <Field label="Descrição (opcional)" name="description" defaultValue={record?.description ?? ""} />
    </FormDialog>
  );
}

/* -------------------------------- Despesa --------------------------------- */

const expenseOptions = Object.entries(EXPENSE_GROUPS).flatMap(([group, cats]) =>
  cats.map((c) => ({ value: `${group}|${c}`, label: `${group} · ${c}` })),
);

export function ExpenseDialog({
  open,
  onOpenChange,
  record,
  sessionId,
}: DialogProps & { record?: Expense | null; sessionId?: string | null }) {
  const { options, preselect } = useMotoOptions(true);
  const save = useUpsert("expenses", "expenses", {
    successMessage: "Gasto salvo com sucesso.",
    onDone: () => onOpenChange(false),
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={record ? "Editar gasto" : "Adicionar gasto"}
      onSubmit={(f) => {
        const [group, category] = String(f.get("category")).split("|");
        save.mutate({
          ...(record ? { id: record.id } : {}),
          amount: numberOrNull(f.get("amount")) ?? 0,
          group_name: group ?? "Moto",
          category: category ?? "Outros",
          date: String(f.get("date")),
          description: textOrNull(f.get("description")),
          motorcycle_id: motoValue(f.get("motorcycle_id")),
          work_session_id: record?.work_session_id ?? sessionId ?? null,
        });
      }}
      submitting={save.isPending}
      submitLabel="Salvar gasto"
    >
      <Field
        label="Valor (R$)"
        name="amount"
        type="number"
        step="0.01"
        inputMode="decimal"
        required
        defaultValue={record?.amount ?? ""}
      />
      <SelectField
        label="Categoria"
        name="category"
        options={expenseOptions}
        defaultValue={record ? `${record.group_name}|${record.category}` : "Moto|Combustível"}
      />
      <Field label="Data" name="date" type="date" required defaultValue={record?.date ?? todayISO()} />
      {options.length > 1 ? (
        <SelectField
          label="Moto"
          name="motorcycle_id"
          options={options}
          defaultValue={record?.motorcycle_id ?? preselect}
        />
      ) : null}
      <Field label="Descrição (opcional)" name="description" defaultValue={record?.description ?? ""} />
    </FormDialog>
  );
}

/* ----------------------------- Abastecimento ------------------------------ */

export function FuelDialog({
  open,
  onOpenChange,
  record,
}: DialogProps & { record?: FuelRecord | null }) {
  const { options, preselect } = useMotoOptions();
  const [saving, setSaving] = useState(false);
  const saveFuel = useUpsert("fuel_records", "fuel_records", {});
  const saveExpense = useUpsert("expenses", "expenses", {});
  const saveMoto = useUpsert("motorcycles", "motorcycles", {});

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={record ? "Editar abastecimento" : "Adicionar abastecimento"}
      description="Informe o valor total. Os demais detalhes podem ser adicionados agora ou depois."
      submitting={saving}
      submitLabel="Salvar abastecimento"
      onSubmit={async (f) => {
        const measurements = normalizeFuelMeasurements({
          total: numberOrNull(f.get("total")),
          liters: numberOrNull(f.get("liters")),
          pricePerLiter: numberOrNull(f.get("price_per_liter")),
          km: numberOrNull(f.get("km")),
        });
        if (!measurements) return;
        const { total, liters, pricePerLiter, km: kmValue } = measurements;
        const motoId = motoValue(f.get("motorcycle_id"));
        const date = textOrNull(f.get("date")) ?? todayISO();

        setSaving(true);
        try {
          await saveFuel.mutateAsync({
            ...(record ? { id: record.id } : {}),
            motorcycle_id: motoId,
            date,
            km: kmValue,
            liters,
            price_per_liter: pricePerLiter,
            total,
            station: textOrNull(f.get("station")),
            description: textOrNull(f.get("description")),
          });
          if (!record) {
            await saveExpense.mutateAsync({
              motorcycle_id: motoId,
              group_name: "Moto",
              category: "Combustível",
              amount: total,
              date,
              description: `Abastecimento${f.get("station") ? ` · ${String(f.get("station"))}` : ""}`,
            });
            if (motoId && kmValue != null) await saveMoto.mutateAsync({ id: motoId, current_km: kmValue });
          }
          onOpenChange(false);
        } finally {
          setSaving(false);
        }
      }}
    >
      <Field
        label="Valor do abastecimento *"
        name="total"
        type="number"
        step="0.01"
        min="0.01"
        inputMode="decimal"
        required
        defaultValue={record?.total ?? ""}
        placeholder="80,00"
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Litros (opcional)"
          name="liters"
          type="number"
          step="0.01"
          inputMode="decimal"
          defaultValue={record?.liters ?? ""}
        />
        <Field
          label="Preço por litro (opcional)"
          name="price_per_liter"
          type="number"
          step="0.001"
          min="0.001"
          inputMode="decimal"
          defaultValue={record?.price_per_liter ?? ""}
        />
      </div>
      <Field
        label="Quilometragem atual (opcional)"
        name="km"
        type="number"
        min="0"
        inputMode="decimal"
        defaultValue={record?.km ?? ""}
      />
      <Field label="Data (opcional)" name="date" type="date" defaultValue={record?.date ?? todayISO()} />
      {options.length > 1 ? (
        <SelectField
          label="Moto"
          name="motorcycle_id"
          options={options}
          defaultValue={record?.motorcycle_id ?? preselect}
        />
      ) : (
        <input type="hidden" name="motorcycle_id" value={record?.motorcycle_id ?? preselect} />
      )}
      <Field label="Posto (opcional)" name="station" defaultValue={record?.station ?? ""} />
      <Field label="Observação (opcional)" name="description" defaultValue={record?.description ?? ""} />
    </FormDialog>
  );
}

/* ------------------------------- Manutenção ------------------------------- */

export function MaintenanceDialog({
  open,
  onOpenChange,
  record,
}: DialogProps & { record?: MaintenanceRecord | null }) {
  const { options, preselect } = useMotoOptions();
  const [saving, setSaving] = useState(false);
  const saveMaintenance = useUpsert("maintenance_records", "maintenance_records", {});
  const saveExpense = useUpsert("expenses", "expenses", {});

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={record ? "Editar manutenção" : "Registrar manutenção"}
      description="Escolha o tipo e informe o valor. A data de hoje será registrada automaticamente."
      submitting={saving}
      submitLabel="Salvar manutenção"
      onSubmit={async (f) => {
        const cost = numberOrNull(f.get("cost"));
        const motoId = motoValue(f.get("motorcycle_id"));
        const category = String(f.get("category"));
        const parsed = normalizeMaintenanceInput({
          category,
          cost,
          description: textOrNull(f.get("description")),
          km: numberOrNull(f.get("km")),
          nextKm: numberOrNull(f.get("next_km")),
          nextDate: textOrNull(f.get("next_date")),
          workshop: textOrNull(f.get("workshop")),
        });
        if (!parsed.success) {
          toast.error("Informe o tipo e um valor maior que zero.");
          return;
        }
        setSaving(true);
        try {
          const saved = await saveMaintenance.mutateAsync({
            ...(record ? { id: record.id } : {}),
            motorcycle_id: motoId,
            category: parsed.data.category,
            description: parsed.data.description,
            ...(record ? { date: textOrNull(f.get("date")) ?? record.date } : {}),
            km: parsed.data.km,
            cost: parsed.data.cost,
            next_km: parsed.data.nextKm,
            next_date: parsed.data.nextDate,
            workshop: parsed.data.workshop,
          });
          if (!record) {
            await saveExpense.mutateAsync({
              motorcycle_id: motoId,
              group_name: "Moto",
              category: "Manutenção",
              amount: parsed.data.cost,
              date: String(saved.date),
              description: parsed.data.category,
            });
          }
          onOpenChange(false);
        } finally {
          setSaving(false);
        }
      }}
    >
      <SelectField
        label="Tipo de manutenção *"
        name="category"
        options={MAINTENANCE_CATEGORIES.map((c) => ({ value: c, label: c }))}
        defaultValue={record?.category ?? "Óleo"}
      />
      <Field
        label="Valor (R$) *"
        name="cost"
        type="number"
        step="0.01"
        min="0.01"
        inputMode="decimal"
        required
        defaultValue={record?.cost ?? ""}
        placeholder="80,00"
      />
      <Collapsible defaultOpen={Boolean(record)} className="rounded-md border border-border">
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" className="group h-12 w-full justify-between px-3">
            Adicionar detalhes
            <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 border-t border-border p-3">
          <Field label="Descrição (opcional)" name="description" defaultValue={record?.description ?? ""} placeholder="Troca de óleo + filtro" />
          <div className="grid grid-cols-2 gap-3">
            {record ? <Field label="Data (opcional)" name="date" type="date" defaultValue={record.date} /> : null}
            <Field label="KM atual (opcional)" name="km" type="number" min="0" inputMode="decimal" defaultValue={record?.km ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Próximo KM (opcional)" name="next_km" type="number" min="0" inputMode="decimal" defaultValue={record?.next_km ?? ""} />
            <Field label="Próxima data (opcional)" name="next_date" type="date" defaultValue={record?.next_date ?? ""} />
          </div>
          {options.length > 1 ? (
            <SelectField
              label="Moto (opcional)"
              name="motorcycle_id"
              options={options}
              defaultValue={record?.motorcycle_id ?? preselect}
            />
          ) : (
            <input type="hidden" name="motorcycle_id" value={record?.motorcycle_id ?? preselect} />
          )}
          <Field label="Oficina/local (opcional)" name="workshop" defaultValue={record?.workshop ?? ""} />
        </CollapsibleContent>
      </Collapsible>
    </FormDialog>
  );
}

/* ---------------------------------- Meta ---------------------------------- */

function endOfMonthISO() {
  const d = new Date();
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return end.toISOString().slice(0, 10);
}

function startOfMonthISO() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export function GoalDialog({ open, onOpenChange, record }: DialogProps & { record?: Goal | null }) {
  const save = useUpsert("goals", "goals", {
    successMessage: "Meta salva com sucesso.",
    onDone: () => onOpenChange(false),
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={record ? "Editar meta" : "Criar meta"}
      submitting={save.isPending}
      submitLabel="Salvar meta"
      onSubmit={(f) =>
        save.mutate({
          ...(record ? { id: record.id } : {}),
          type: String(f.get("type")),
          name: String(f.get("name")),
          target_amount: numberOrNull(f.get("target_amount")) ?? 0,
          start_date: String(f.get("start_date")),
          end_date: String(f.get("end_date")),
        })
      }
    >
      <SelectField
        label="Tipo"
        name="type"
        options={GOAL_TYPES.map((g) => ({ value: g.value, label: g.label }))}
        defaultValue={record?.type ?? "mensal"}
      />
      <Field label="Nome" name="name" required defaultValue={record?.name ?? ""} placeholder="Meta do mês" />
      <Field
        label="Valor (R$)"
        name="target_amount"
        type="number"
        step="0.01"
        inputMode="decimal"
        required
        defaultValue={record?.target_amount ?? ""}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Início" name="start_date" type="date" required defaultValue={record?.start_date ?? startOfMonthISO()} />
        <Field label="Fim" name="end_date" type="date" required defaultValue={record?.end_date ?? endOfMonthISO()} />
      </div>
    </FormDialog>
  );
}

/* -------------------------------- Documento -------------------------------- */

export function DocumentDialog({
  open,
  onOpenChange,
  record,
}: DialogProps & { record?: AppDocument | null }) {
  const { options, preselect } = useMotoOptions(true);
  const save = useUpsert("documents", "documents", {
    successMessage: "Documento salvo.",
    onDone: () => onOpenChange(false),
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={record ? "Editar documento" : "Adicionar documento"}
      submitting={save.isPending}
      onSubmit={(f) =>
        save.mutate({
          ...(record ? { id: record.id } : {}),
          name: String(f.get("name")),
          expiration_date: textOrNull(f.get("expiration_date")),
          amount: numberOrNull(f.get("amount")),
          description: textOrNull(f.get("description")),
          motorcycle_id: motoValue(f.get("motorcycle_id")),
        })
      }
    >
      <SelectField
        label="Documento"
        name="name"
        options={DOCUMENT_TYPES.map((d) => ({ value: d, label: d }))}
        defaultValue={record?.name ?? "IPVA"}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Vencimento" name="expiration_date" type="date" defaultValue={record?.expiration_date ?? ""} />
        <Field
          label="Valor (R$)"
          name="amount"
          type="number"
          step="0.01"
          inputMode="decimal"
          defaultValue={record?.amount ?? ""}
        />
      </div>
      {options.length > 1 ? (
        <SelectField
          label="Moto"
          name="motorcycle_id"
          options={options}
          defaultValue={record?.motorcycle_id ?? preselect}
        />
      ) : null}
      <Field label="Observação" name="description" defaultValue={record?.description ?? ""} />
    </FormDialog>
  );
}
