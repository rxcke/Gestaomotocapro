import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

/**
 * Moldura visual das telas de entrada (login, cadastro, senha, onboarding, pagamento).
 * Apenas apresentação: escuro, headline grande, sem caixa em volta do formulário.
 */
export function EntryShell({
  eyebrow,
  title,
  subtitle,
  children,
  stepKey,
  wide = false,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  stepKey?: string | number;
  wide?: boolean;
}) {
  return (
    <div className="dark relative min-h-dvh overflow-x-clip bg-background text-foreground">
      <div className="lp-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="lp-glow pointer-events-none absolute -top-40 -right-40 size-[520px]" aria-hidden="true" />
      <div className="relative mx-auto grid min-h-dvh max-w-6xl lg:grid-cols-[1fr_minmax(0,460px)] lg:gap-16">
        <aside className="hidden flex-col justify-between py-12 pl-8 lg:flex">
          <Link to="/" aria-label="Gestão Motoca Pro — início" className="w-fit"><Logo /></Link>
          <div className="home-rise">
            <p className="font-display text-6xl leading-[0.98] font-extrabold tracking-tight xl:text-7xl">
              Seu corre<br />sob <span className="text-accent">controle.</span>
            </p>
            <p className="mt-6 max-w-sm text-muted-foreground">Ganhos, gastos, combustível, manutenção e jornadas. Tudo em um lugar só.</p>
          </div>
          <p className="text-xs text-muted-foreground">Feito para quem vive do corre. 🏍️</p>
        </aside>

        <main className={cn("flex min-h-dvh flex-col px-5 py-6 sm:px-8 lg:justify-center lg:py-12", wide && "lg:col-span-2 lg:mx-auto lg:w-full lg:max-w-xl")}>
          <Link to="/" aria-label="Gestão Motoca Pro — início" className={cn("mb-10 w-fit", !wide && "lg:hidden")}><Logo /></Link>
          <div key={stepKey} className="home-rise my-auto w-full lg:my-0">
            {eyebrow ? <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">{eyebrow}</p> : null}
            <h1 className="mt-3 font-display text-[2.1rem] leading-[1.05] font-extrabold tracking-tight sm:text-5xl">{title}</h1>
            {subtitle ? <p className="mt-3 text-base leading-7 text-muted-foreground">{subtitle}</p> : null}
            <div className="mt-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function EntryProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-8" aria-label={`Passo ${step + 1} de ${total}`}>
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <span className={cn("block h-full rounded-full bg-accent transition-transform duration-500 ease-out origin-left", i <= step ? "scale-x-100" : "scale-x-0")} />
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs font-semibold text-muted-foreground">{step + 1} de {total}</p>
    </div>
  );
}
