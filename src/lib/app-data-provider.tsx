import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AppContext, ALL_MOTOS, type AppState } from "./app-context";
import { useMotorcycles } from "./data";

const STORAGE_KEY = "motofinance-active-moto";

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
      setMotoIdState(list[0]?.id ?? ALL_MOTOS);
    }
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
      // With a single motorcycle the view stays general (entries without a motorcycle remain visible); that motorcycle still drives km context.
      activeMoto: motorcycles.find((m) => m.id === motoId) ?? (motorcycles.length === 1 ? motorcycles[0] ?? null : null),
      loading: motos.isLoading,
      error: motos.isError,
    };
  }, [motos.data, motos.isLoading, motos.isError, motoId]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}