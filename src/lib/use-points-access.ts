import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { recordAppAccessPoints } from "./points.functions";
import { nextBrasiliaDayDelay } from "./points-access";

/** No local balance or durable client deduplication: every credit is decided in the database. */
export function usePointsAccess(userId: string) {
  const record = useServerFn(recordAppAccessPoints);
  const queryClient = useQueryClient();

  useEffect(() => {
    let disposed = false;
    let pending = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const register = async () => {
      if (disposed || pending || document.visibilityState !== "visible") return;
      pending = true;
      try {
        const result = await record();
        if (!disposed && result) {
          queryClient.setQueryData(["points", "last-access", userId], result);
          if (result.daily_awarded || result.bonus_awarded) {
            void queryClient.invalidateQueries({ queryKey: ["points", "summary", userId] });
            void queryClient.invalidateQueries({ queryKey: ["points", "ranking"] });
          }
        }
      } catch {
        // A points outage must never prevent financial navigation or sign-in.
        // The next foreground/online event retries through the idempotent RPC.
      } finally {
        pending = false;
      }
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        void register();
        schedule();
      }, nextBrasiliaDayDelay(new Date()));
    };
    const foreground = () => { void register(); schedule(); };
    foreground();
    document.addEventListener("visibilitychange", foreground);
    window.addEventListener("focus", foreground);
    window.addEventListener("online", foreground);
    return () => {
      disposed = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", foreground);
      window.removeEventListener("focus", foreground);
      window.removeEventListener("online", foreground);
    };
  }, [record, queryClient, userId]);
}