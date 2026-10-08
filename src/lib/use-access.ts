import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSubscriptionAccess } from "./subscription.functions";
import { fetchSubscriptionAccessWhenAuthenticated } from "./subscription-access";

export function useAccess() {
  const fetchAccess = useServerFn(getSubscriptionAccess);
  return useQuery({ queryKey: ["subscription", "access"], queryFn: () => fetchSubscriptionAccessWhenAuthenticated(fetchAccess), staleTime: 0, refetchInterval: 30_000 });
}

export function openUpgrade() {
  window.dispatchEvent(new Event("gmp:open-upgrade"));
}