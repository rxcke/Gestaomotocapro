import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { AppDataProvider } from "@/lib/app-context";
import { useProfile } from "@/lib/data";
import { ErrorBlock, LoadingBlock } from "@/components/glass";
import { PremiumGate } from "@/components/PremiumGate";
import { getSubscriptionAccess } from "@/lib/subscription.functions";
import { fetchSubscriptionAccessWhenAuthenticated } from "@/lib/subscription-access";
import { isValidBrazilianMobile } from "@/lib/phone";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppLayout,
});

function AppLayout() {
  const profile = useProfile();
  const navigate = useNavigate();
  const fetchAccess = useServerFn(getSubscriptionAccess);
  const access = useQuery({ queryKey: ["subscription", "access"], queryFn: () => fetchSubscriptionAccessWhenAuthenticated(fetchAccess) });
  const hasPremium = Boolean(access.data?.active || access.data?.admin);
  const needsOnboarding = profile.isSuccess && (!isValidBrazilianMobile(profile.data?.phone) || (hasPremium && !(profile.data?.onboarding_completed ?? false)));

  useEffect(() => {
    if (needsOnboarding) navigate({ to: "/onboarding", replace: true });
  }, [needsOnboarding, navigate]);

  if (profile.isLoading || access.isLoading || needsOnboarding) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas p-6">
        <LoadingBlock label="Preparando seu painel..." />
      </div>
    );
  }

  if (profile.isError || access.isError) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas p-6">
        <ErrorBlock message="Não foi possível preparar seu painel. Atualize a página para tentar novamente." />
      </div>
    );
  }

  return (
    <AppDataProvider>
      <AppShell>
        <PremiumGate>
          <Outlet />
        </PremiumGate>
      </AppShell>
    </AppDataProvider>
  );
}
