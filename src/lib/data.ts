import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAccess, openUpgrade } from "./use-access";
import type {
  AppDocument,
  Expense,
  FuelRecord,
  Goal,
  Income,
  MaintenanceRecord,
  Motorcycle,
  NotificationRow,
  Profile,
  WorkSession,
  WorkSessionPause,
} from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
// Acesso genérico às tabelas (nomes dinâmicos), a segurança é garantida por RLS.
const db = supabase as unknown as { from: (table: string) => any };

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sessão expirada. Entre novamente.");
  return data.user.id;
}

function useTable<T>(table: string, key: string, order: { column: string; asc?: boolean }) {
  return useQuery({
    queryKey: [key],
    queryFn: async () => {
      const { data, error } = await db
        .from(table)
        .select("*")
        .order(order.column, { ascending: order.asc ?? false });
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

export const useProfile = () =>
  useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const uid = await currentUserId();
      const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      if (error) throw error;
      return (data as Profile | null) ?? null;
    },
  });

export const useMotorcycles = () => useTable<Motorcycle>("motorcycles", "motorcycles", { column: "created_at", asc: true });
export const useIncomes = () => useTable<Income>("incomes", "incomes", { column: "date" });
export const useExpenses = () => useTable<Expense>("expenses", "expenses", { column: "date" });
export const useFuelRecords = () => useTable<FuelRecord>("fuel_records", "fuel_records", { column: "date" });
export const useMaintenance = () =>
  useTable<MaintenanceRecord>("maintenance_records", "maintenance_records", { column: "date" });
export const useGoals = () => useTable<Goal>("goals", "goals", { column: "created_at" });
export const useWorkSessions = () => useTable<WorkSession>("work_sessions", "work_sessions", { column: "start_time" });
export const useWorkSessionPauses = () => useTable<WorkSessionPause>("work_session_pauses", "work_session_pauses", { column: "started_at" });
export const useDocuments = () => useTable<AppDocument>("documents", "documents", { column: "expiration_date", asc: true });
export const useNotifications = () =>
  useTable<NotificationRow>("notifications", "notifications", { column: "created_at" });

const ALL_KEYS = [
  "profile",
  "motorcycles",
  "incomes",
  "expenses",
  "fuel_records",
  "maintenance_records",
  "goals",
  "work_sessions",
  "work_session_pauses",
  "documents",
  "notifications",
];

export function useInvalidateAll() {
  const qc = useQueryClient();
  return () => ALL_KEYS.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

type MutationOptions = { successMessage?: string; onDone?: () => void };

function reportWriteError(error: Error) {
  if (error.message === "demo_blocked" || error.message.includes("row-level security")) {
    openUpgrade();
    return;
  }
  toast.error(error.message || "Não foi possível salvar.");
}

export function useUpsert<T extends Record<string, unknown>>(
  table: string,
  key: string,
  options: MutationOptions = {},
) {
  const qc = useQueryClient();
  const access = useAccess();
  return useMutation({
    mutationFn: async (values: T & { id?: string }) => {
      if (access.data && !access.data.hasAppAccess) throw new Error("demo_blocked");
      const uid = await currentUserId();
      const payload = { ...values, user_id: uid };
      const { data, error } = values.id
        ? await db.from(table).update(payload).eq("id", values.id).select().single()
        : await db.from(table).insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      ALL_KEYS.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      qc.invalidateQueries({ queryKey: ["subscription", "access"] });
      if (options.successMessage) toast.success(options.successMessage);
      options.onDone?.();
    },
    onError: reportWriteError,
  });
}

export function useRemove(table: string, message = "Registro excluído.") {
  const qc = useQueryClient();
  const access = useAccess();
  return useMutation({
    mutationFn: async (id: string) => {
      if (access.data && !access.data.hasAppAccess) throw new Error("demo_blocked");
      const { error } = await db.from(table).delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      ALL_KEYS.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      toast.success(message);
    },
    onError: reportWriteError,
  });
}

export function useUpdateProfile(successMessage = "Perfil atualizado.") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<Pick<Profile, "name" | "phone" | "usage_types" | "is_professional" | "onboarding_completed">>) => {
      const uid = await currentUserId();
      const allowedValues = {
        ...(values.name !== undefined ? { name: values.name } : {}),
        ...(values.phone !== undefined ? { phone: values.phone } : {}),
        ...(values.usage_types !== undefined ? { usage_types: values.usage_types } : {}),
        ...(values.is_professional !== undefined ? { is_professional: values.is_professional } : {}),
        ...(values.onboarding_completed !== undefined ? { onboarding_completed: values.onboarding_completed } : {}),
      };
      const { error } = await db.from("profiles").update(allowedValues).eq("id", uid);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      if (successMessage) toast.success(successMessage);
    },
    onError: (error: Error) => toast.error(error.message || "Não foi possível salvar o perfil."),
  });
}

export { currentUserId };
