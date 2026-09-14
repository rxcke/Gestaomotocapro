import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div className="floaty absolute -top-24 -left-20 size-[520px] rounded-full bg-accent/25 blur-3xl" />
      <div className="absolute top-40 -right-32 size-[460px] rounded-full bg-sky-300/40 blur-3xl dark:bg-sky-500/15" />
      <div className="absolute -bottom-40 left-1/3 size-[520px] rounded-full bg-indigo-200/50 blur-3xl dark:bg-indigo-500/15" />
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
  return <section className={cn("glass-panel", padded && "p-5 sm:p-6", className)}>{children}</section>;
}

export function CardHeading({ title, action }: { title: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      {action}
    </div>
  );
}

export function Stat({
  label,
  value,
  tone = "default",
  hint,
}: {
  label: string;
  value: ReactNode;
  tone?: "default" | "positive" | "negative";
  hint?: string;
}) {
  return (
    <div className="glass-soft min-w-0 p-4">
      <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "num-display mt-1 truncate text-xl",
          tone === "positive" && "text-positive",
          tone === "negative" && "text-negative",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{hint}</p> : null}
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
    <div className="glass-soft flex flex-col items-center gap-3 px-6 py-10 text-center">
      <p className="font-display text-base font-bold">{title}</p>
      {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  );
}

export function LoadingBlock({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="glass-soft flex items-center justify-center gap-3 px-6 py-10 text-sm text-muted-foreground">
      <span className="size-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      {label}
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
      <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

export function StatusDot({ status }: { status: "ok" | "soon" | "late" }) {
  const color =
    status === "late" ? "bg-negative" : status === "soon" ? "bg-warning" : "bg-positive";
  return <span className={cn("inline-block size-2.5 shrink-0 rounded-full", color)} />;
}
