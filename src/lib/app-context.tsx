import { createContext, useContext } from "react";
import {
  useExpenses,
  useFuelRecords,
  useGoals,
  useIncomes,
  useMaintenance,
  useMotorcycles,
  useProfile,
  useWorkSessions,
  useWorkSessionPauses,
} from "./data";
import type { Motorcycle } from "./types";

export const ALL_MOTOS = "all";

export type AppState = {
  motoId: string;
  setMotoId: (id: string) => void;
  motorcycles: Motorcycle[];
  activeMoto: Motorcycle | null;
  loading: boolean;
  error: boolean;
};

export const AppContext = createContext<AppState | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp precisa estar dentro de AppDataProvider");
  return ctx;
}

/** Todos os dados do usuário já filtrados pela moto selecionada. */
export function useScopedData() {
  const { motoId } = useApp();
  const profile = useProfile();
  const incomes = useIncomes();
  const expenses = useExpenses();
  const fuel = useFuelRecords();
  const maintenance = useMaintenance();
  const goals = useGoals();
  const sessions = useWorkSessions();
  const pauses = useWorkSessionPauses();

  const filter = <T extends { motorcycle_id: string | null }>(rows: T[] | undefined) =>
    (rows ?? []).filter((r) => motoId === ALL_MOTOS || r.motorcycle_id === motoId);

  return {
    profile: profile.data ?? null,
    incomes: filter(incomes.data),
    expenses: filter(expenses.data),
    fuel: filter(fuel.data),
    maintenance: filter(maintenance.data),
    goals: goals.data ?? [],
    sessions: filter(sessions.data),
    pauses: (pauses.data ?? []).filter((pause) => (sessions.data ?? []).some((session) => session.id === pause.work_session_id && (motoId === ALL_MOTOS || session.motorcycle_id === motoId))),
    isLoading:
      profile.isLoading ||
      incomes.isLoading ||
      expenses.isLoading ||
      fuel.isLoading ||
      maintenance.isLoading ||
      goals.isLoading ||
      sessions.isLoading ||
      pauses.isLoading,
    isError:
      profile.isError ||
      incomes.isError ||
      expenses.isError ||
      fuel.isError ||
      maintenance.isError ||
      goals.isError ||
      sessions.isError ||
      pauses.isError,
  };
}
