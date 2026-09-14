import { useEffect } from "react";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { AppDataProvider } from "@/lib/app-context";
import { useProfile } from "@/lib/data";
import { LoadingBlock } from "@/components/glass";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppLayout,
});

function AppLayout() {
  const profile = useProfile();
  const navigate = useNavigate();
  const needsOnboarding = profile.isSuccess && !(profile.data?.onboarding_completed ?? false);

  useEffect(() => {
    if (needsOnboarding) navigate({ to: "/onboarding", replace: true });
  }, [needsOnboarding, navigate]);

  if (profile.isLoading || needsOnboarding) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas p-6">
        <LoadingBlock label="Preparando seu painel..." />
      </div>
    );
  }

  return (
    <AppDataProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </AppDataProvider>
  );
}
