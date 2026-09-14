import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  useExpenses,
  useFuelRecords,
  useGoals,
  useIncomes,
  useMaintenance,
  useMotorcycles,
  useProfile,
  useWorkSessions,
} from "./data";
import type { Motorcycle } from "./types";

const STORAGE_KEY = "motofinance-active-moto";
export const ALL_MOTOS = "all";

type AppState = {
  motoId: string;
  setMotoId: (id: string) => void;
  motorcycles: Motorcycle[];
  activeMoto: Motorcycle | null;
  loading: boolean;
  error: boolean;
};

const AppContext = createContext<AppState | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const motos = useMotorcycles();
  const [motoId, setMotoIdState] = useState<string>(ALL_MOTOS);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) setMotoIdState(stored);
  }, []);

  useEffect(() => {
    const list = motos.data ?? [];
    if (motoId !== ALL_MOTOS && list.length > 0 && !list.some((m) => m.id === motoId)) {
      setMotoIdState(list[0]!.id);
    }
    if (motoId === ALL_MOTOS && list.length === 1) setMotoIdState(list[0]!.id);
  }, [motos.data, motoId]);

  const setMotoId = (id: string) => {
    setMotoIdState(id);
    window.localStorage.setItem(STORAGE_KEY, id);
  };

  const value = useMemo<AppState>(() => {
    const motorcycles = motos.data ?? [];
    return {
      motoId,
      setMotoId,
      motorcycles,
      activeMoto: motorcycles.find((m) => m.id === motoId) ?? null,
      loading: motos.isLoading,
      error: motos.isError,
    };
  }, [motos.data, motos.isLoading, motos.isError, motoId]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

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
    isLoading:
      profile.isLoading ||
      incomes.isLoading ||
      expenses.isLoading ||
      fuel.isLoading ||
      maintenance.isLoading ||
      goals.isLoading ||
      sessions.isLoading,
    isError:
      profile.isError ||
      incomes.isError ||
      expenses.isError ||
      fuel.isError ||
      maintenance.isError ||
      goals.isError ||
      sessions.isError,
  };
}
