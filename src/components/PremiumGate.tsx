import { useQuery } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { LockKeyhole } from "lucide-react";
import { LoadingBlock } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { getSubscriptionAccess } from "@/lib/subscription.functions";
import { fetchSubscriptionAccessWhenAuthenticated } from "@/lib/subscription-access";
import { DemoExperience } from "./DemoExperience";

export function PremiumGate({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const fetchAccess = useServerFn(getSubscriptionAccess);
  const access = useQuery({ queryKey: ["subscription", "access"], queryFn: () => fetchSubscriptionAccessWhenAuthenticated(fetchAccess) });
  const basicProfile = pathname === "/app/perfil";

  if (access.isLoading) return <LoadingBlock label="Verificando sua assinatura..." />;
  if (basicProfile || access.data?.hasAppAccess || access.data?.demoExpired) return <><DemoExperience />{children}</>;

  return <section className="home-rise mx-auto mt-12 max-w-lg px-1 text-center">
    <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary text-accent"><LockKeyhole className="size-7" /></span>
    <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Acesso</p>
    <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight sm:text-4xl">Seu acesso precisa ser liberado.</h1>
    <p className="mt-3 text-muted-foreground">Seus dados continuam seguros. Escolha um plano para continuar.</p>
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"><Button asChild className="h-14 rounded-full px-8 text-sm font-bold uppercase tracking-wider"><Link to="/planos">Ver planos</Link></Button><Button asChild variant="ghost" className="h-14 rounded-full"><Link to="/app/perfil">Meu perfil</Link></Button></div>
  </section>;
}
