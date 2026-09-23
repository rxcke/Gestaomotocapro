import logoImage from "@/assets/gestao-motoca-pro-logo.png";

export function LogoMark({ className = "size-10" }: { className?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-md bg-logo-surface ${className}`} aria-hidden="true">
      <img src={logoImage} alt="" className="size-full object-contain" />
    </span>
  );
}

export function Logo({ subtitle = "Seu corre sob controle." }: { subtitle?: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <LogoMark />
      <div className="min-w-0">
        <p className="font-display text-base leading-none font-bold text-foreground">
          Gestão Motoca <span className="text-accent">Pro</span>
        </p>
        {subtitle ? <p className="mt-1 truncate text-[11px] text-muted-foreground">{subtitle}</p> : null}
      </div>
    </div>
  );
}
