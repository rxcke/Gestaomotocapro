import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, CreditCard, Fuel, Wallet, TrendingUp, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { trackClick } from "@/lib/tracking";
import courier from "@/assets/trial-courier.jpg";

const SEEN_KEY = "gmp_trial_popup_seen";
const DELAY_MS = 5000;

const BENEFITS = [
  { icon: Wallet, text: "Ganhos e despesas sob controle." },
  { icon: Fuel, text: "Acompanhamento dos gastos com combustível." },
  { icon: TrendingUp, text: "Mais clareza sobre o lucro real." },
] as const;

/** Convite ao teste grátis de 24h: aparece após 5s, no máximo uma vez por sessão. */
export function TrialPopup() {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(SEEN_KEY) === "1"; } catch { /* sem storage */ }
    if (seen) return;
    let cancelled = false;
    void import("@/integrations/supabase/client").then(({ supabase }) =>
      supabase.auth.getSession().then(({ data }) => { if (!cancelled) setSignedIn(Boolean(data.session)); }),
    );
    const t = window.setTimeout(() => {
      setOpen(true);
      try { sessionStorage.setItem(SEEN_KEY, "1"); } catch { /* sem storage */ }
    }, DELAY_MS);
    return () => { cancelled = true; window.clearTimeout(t); };
  }, []);

  const goToTrial = () => {
    trackClick("Pop-up teste grátis 24h");
    setOpen(false);
    if (signedIn) void navigate({ to: "/app" });
    else void navigate({ to: "/auth", search: { mode: "signup" } });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="dark max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-4xl gap-0 overflow-hidden rounded-3xl border-primary/25 bg-background p-0 text-foreground shadow-2xl motion-reduce:animate-none [&>button:last-child]:hidden">
        <div className="grid max-h-[calc(100dvh-1.5rem)] overflow-y-auto md:grid-cols-[1.05fr_0.95fr] md:overflow-hidden">
          {/* Imagem */}
          <div className="relative h-44 overflow-hidden sm:h-56 md:order-2 md:h-auto">
            <img src={courier} alt="Motoboy profissional com mochila de entrega ao lado da moto" width={800} height={1104} className="absolute inset-0 size-full object-cover object-[center_25%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent md:bg-gradient-to-r md:from-background md:via-background/20" aria-hidden="true" />
            <PhonePreview />
          </div>

          {/* Texto */}
          <div className="relative flex flex-col px-6 pt-5 pb-6 sm:px-9 sm:pb-9 md:order-1 md:py-10">
            <div className="lp-glow pointer-events-none absolute -top-24 -left-24 size-72 opacity-70" aria-hidden="true" />
            <span className="relative w-fit rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-primary">ACESSO GRATUITO</span>
            <DialogTitle className="relative mt-4 text-[2.1rem] leading-[1.02] font-extrabold tracking-tight sm:text-5xl">
              Teste por <span className="text-primary">24 HORAS.</span>
            </DialogTitle>
            <p className="relative mt-3 text-lg font-semibold sm:text-xl">Veja quanto sobra do seu corre.</p>
            <DialogDescription className="relative mt-2 text-sm leading-6 text-muted-foreground">
              Controle seus ganhos, acompanhe seus gastos e descubra seu lucro real.
            </DialogDescription>

            <ul className="relative mt-5 grid gap-2">
              {BENEFITS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 px-3 py-2.5 text-sm">
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary"><Icon className="size-4" /></span>
                  <span className="min-w-0">{text}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={goToTrial}
              className="relative mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-primary to-primary/80 px-6 text-sm font-extrabold tracking-wide text-primary-foreground shadow-[0_12px_32px_-10px_var(--primary)] transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              QUERO TESTAR GRÁTIS POR 24H<ArrowRight className="size-4 shrink-0" />
            </button>
            <p className="relative mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><CreditCard className="size-3.5" />Sem cartão de crédito</span>
              <span className="inline-flex items-center gap-1.5"><Check className="size-3.5" />Seu corre sob controle</span>
            </p>
          </div>
        </div>

        <DialogClose className="absolute top-3 right-3 z-10 grid size-11 place-items-center rounded-full border border-border bg-background/80 text-foreground backdrop-blur transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" aria-label="Fechar">
          <X className="size-5" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

/** Celular ilustrativo com a estrutura da tela inicial — sem valores fictícios. */
function PhonePreview() {
  return (
    <div className="absolute bottom-6 left-1/2 hidden w-40 -translate-x-1/2 rotate-[-4deg] rounded-[1.75rem] border-4 border-secondary bg-background p-3 shadow-2xl md:block lg:w-44" aria-hidden="true">
      <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-secondary" />
      <p className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase">Seu resultado no mês</p>
      <div className="mt-2 h-5 w-24 rounded-md bg-primary/80" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-card p-2"><p className="text-[8px] text-muted-foreground">Faturados</p><div className="mt-1 h-2 w-10 rounded bg-positive/70" /></div>
        <div className="rounded-lg bg-card p-2"><p className="text-[8px] text-muted-foreground">Gastos</p><div className="mt-1 h-2 w-8 rounded bg-negative/70" /></div>
      </div>
      <div className="mt-3 flex h-14 items-end gap-1.5 rounded-lg bg-card p-2">
        {[40, 65, 50, 80, 60, 90, 70].map((h, i) => <div key={i} className="flex-1 rounded-sm bg-primary/70" style={{ height: `${h}%` }} />)}
      </div>
      <div className="mt-3 h-8 rounded-full bg-primary/90" />
    </div>
  );
}
