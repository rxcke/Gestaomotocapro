import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Check, CheckCircle2, Clock3, LoaderCircle, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchSubscriptionAccessWhenAuthenticated } from "@/lib/subscription-access";
import { getSubscriptionAccess } from "@/lib/subscription.functions";

export const Route = createFileRoute("/obrigado")({
  head: () => ({
    meta: [
      { title: "Obrigado pela compra — Gestão Motoca Pro" },
      {
        name: "description",
        content: "Acompanhe a liberação do seu acesso ao Gestão Motoca Pro.",
      },
      { property: "og:title", content: "Obrigado pela compra — Gestão Motoca Pro" },
      {
        property: "og:description",
        content: "Acompanhe a liberação do seu acesso ao Gestão Motoca Pro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ThankYouPage,
});

type ConfirmationState = "checking" | "active" | "processing";

function ThankYouPage() {
  const fetchAccess = useServerFn(getSubscriptionAccess);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [pollExpired, setPollExpired] = useState(false);

  const checkSession = useCallback(async () => {
    setPollExpired(false);
    const { data, error } = await supabase.auth.getSession();
    setHasSession(Boolean(!error && data.session?.access_token));
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!hasSession) return;
    const timer = window.setTimeout(() => setPollExpired(true), 60_000);
    return () => window.clearTimeout(timer);
  }, [hasSession]);

  const access = useQuery({
    queryKey: ["subscription", "access"],
    queryFn: () => fetchSubscriptionAccessWhenAuthenticated(fetchAccess),
    enabled: hasSession === true,
    retry: 1,
    refetchInterval: (query) => query.state.data?.active || pollExpired ? false : 5_000,
  });

  const state: ConfirmationState = access.data?.active
    ? "active"
    : hasSession === true && !pollExpired && !access.isError
      ? "checking"
      : "processing";

  const tryAgain = async () => {
    await checkSession();
    if (hasSession) await access.refetch();
  };

  return (
    <main className="dark min-h-dvh overflow-x-hidden bg-canvas text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-12 lg:py-8">
        <header className="flex items-center justify-between border-b border-border pb-5">
          <Link to="/" aria-label="Gestão Motoca Pro — início">
            <Logo />
          </Link>
          <span className="hidden text-xs font-semibold uppercase text-muted-foreground sm:block">
            Compra concluída
          </span>
        </header>

        <div className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] lg:gap-16 lg:py-14">
          <section className="min-w-0">
            <div className="mb-7 flex size-16 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent sm:size-20">
              <Check className="size-8 sm:size-10" strokeWidth={3} aria-hidden="true" />
            </div>
            <p className="text-sm font-bold uppercase text-accent">Pagamento recebido</p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.08] font-bold sm:text-5xl lg:text-6xl">
              AGORA É OFICIAL.
              <span className="mt-2 block text-accent">SEU CORRE ESTÁ SOB CONTROLE.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Seu pagamento foi recebido. Agora falta só um passo para começar a usar o Gestão Motoca Pro.
            </p>

            <div className="mt-10 border-l-2 border-accent pl-5 sm:pl-6">
              <p className="font-display text-lg font-bold">Seu próximo passo</p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                Use o mesmo e-mail utilizado na compra para acessar sua conta.
              </p>
            </div>
          </section>

          <section className="min-w-0 border-t border-border pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-12" aria-live="polite">
            <StatusIndicator state={state} />
            <h2 className="mt-6 font-display text-2xl font-bold sm:text-3xl">
              {state === "active"
                ? "ACESSO LIBERADO!"
                : state === "checking"
                  ? "Estamos confirmando seu acesso..."
                  : "Pagamento em processamento"}
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
              {state === "active"
                ? "Tudo certo. Sua assinatura foi confirmada e seu Gestão Motoca Pro está pronto."
                : state === "checking"
                  ? "Seu pagamento foi recebido. Estamos liberando sua conta."
                  : "Se você acabou de realizar o pagamento, aguarde alguns instantes. Assim que a confirmação chegar, seu acesso será liberado."}
            </p>

            {state === "processing" ? (
              <Button
                type="button"
                variant="outline"
                className="mt-7 h-14 w-full text-sm sm:w-auto"
                disabled={access.isFetching}
                onClick={() => void tryAgain()}
              >
                <RotateCcw className={access.isFetching ? "animate-spin" : ""} />
                {access.isFetching ? "VERIFICANDO..." : "TENTAR NOVAMENTE"}
              </Button>
            ) : null}

            <Button asChild className="mt-4 h-14 w-full px-6 text-sm sm:w-auto">
              <Link to="/auth">
                ACESSAR MEU GESTÃO MOTOCA
                <ArrowRight />
              </Link>
            </Button>

            <p className="mt-5 max-w-md text-xs leading-5 text-muted-foreground">
              Seu acesso será liberado automaticamente assim que sua assinatura for identificada.
            </p>
          </section>
        </div>

        <footer className="border-t border-border pt-5 text-xs text-muted-foreground">
          Gestão Motoca Pro · Seu corre sob controle.
        </footer>
      </div>
    </main>
  );
}

function StatusIndicator({ state }: { state: ConfirmationState }) {
  const sharedClass = "size-8";
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-border bg-secondary">
        {state === "active" ? (
          <CheckCircle2 className={`${sharedClass} text-positive`} aria-hidden="true" />
        ) : state === "checking" ? (
          <LoaderCircle className={`${sharedClass} animate-spin text-accent`} aria-hidden="true" />
        ) : (
          <Clock3 className={`${sharedClass} text-warning`} aria-hidden="true" />
        )}
      </span>
      <div>
        <p className="text-xs font-semibold uppercase text-muted-foreground">Status do acesso</p>
        <p className="mt-1 text-sm font-semibold">
          {state === "active" ? "Assinatura identificada" : state === "checking" ? "Confirmação em andamento" : "Aguardando confirmação"}
        </p>
      </div>
    </div>
  );
}