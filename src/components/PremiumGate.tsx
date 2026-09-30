import { useQuery } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { LockKeyhole } from "lucide-react";
import { GlassCard, LoadingBlock } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { getSubscriptionAccess } from "@/lib/subscription.functions";
import { fetchSubscriptionAccessWhenAuthenticated } from "@/lib/subscription-access";

export function PremiumGate({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const fetchAccess = useServerFn(getSubscriptionAccess);
  const access = useQuery({ queryKey: ["subscription", "access"], queryFn: () => fetchSubscriptionAccessWhenAuthenticated(fetchAccess) });
  const basicProfile = pathname === "/app/perfil";

  if (access.isLoading) return <LoadingBlock label="Verificando sua assinatura..." />;
  if (basicProfile || access.data?.hasAppAccess) return children;

  return <GlassCard className="mx-auto mt-10 max-w-lg text-center"><LockKeyhole className="mx-auto size-9 text-accent" /><h1 className="mt-4 font-display text-2xl font-bold">Esse recurso faz parte do plano premium.</h1><p className="mt-2 text-sm text-muted-foreground">Assine para acessar todos os controles do Gestão Motoca Pro. Seus dados existentes continuam preservados.</p><div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center"><Button asChild><Link to="/planos">Ver planos</Link></Button><Button asChild variant="outline"><Link to="/app/perfil">Meu perfil</Link></Button></div></GlassCard>;
}