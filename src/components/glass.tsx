import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-x-0 top-0 h-px bg-accent/70" />
      <div className="absolute top-0 left-[8%] h-64 w-64 bg-accent/8 blur-3xl" />
      <div className="absolute right-[5%] bottom-0 h-72 w-72 bg-muted/30 blur-3xl" />
    </div>
  );
}

export function GlassCard({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return <section className={cn("glass-panel home-rise", padded && "p-5 sm:p-6", className)}>{children}</section>;
}

export function CardHeading({ title, action }: { title: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      {action}
    </div>
  );
}

export function Stat({
  label,
  value,
  tone = "default",
  hint,
  className,
  valueClassName,
  hintClassName,
}: {
  label: string;
  value: ReactNode;
  tone?: "default" | "positive" | "negative";
  hint?: string;
  className?: string;
  valueClassName?: string;
  hintClassName?: string;
}) {
  return (
    <div className={cn("glass-soft min-w-0 p-4", className)}>
      <p className="truncate text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "num-display mt-1 break-words text-lg leading-tight sm:text-xl",
          tone === "positive" && "text-positive",
          tone === "negative" && "text-negative",
          valueClassName,
        )}
      >
        {value}
      </p>
      {hint ? <p className={cn("mt-0.5 truncate text-[11px] text-muted-foreground", hintClassName)}>{hint}</p> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border px-6 py-10 text-center">
      <p className="font-display text-lg font-bold">{title}</p>
      {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  );
}

export function LoadingBlock({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="h-36 animate-pulse rounded-lg bg-muted" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 animate-pulse rounded-md bg-muted" />
        <div className="h-20 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-28 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

export function ErrorBlock({ message }: { message?: string }) {
  return (
    <div className="glass-soft px-6 py-8 text-center text-sm text-negative">
      {message ?? "Não foi possível carregar seus dados. Tente novamente."}
    </div>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="min-w-0">
      <h1 className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

export function StatusDot({ status }: { status: "ok" | "soon" | "late" }) {
  const color =
    status === "late" ? "bg-negative" : status === "soon" ? "bg-warning" : "bg-positive";
  return <span className={cn("inline-block size-2.5 shrink-0 rounded-full", color)} />;
}
