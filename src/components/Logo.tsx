import logoImage from "@/assets/gestao-motoca-pro-logo.png";

export function LogoMark({ className = "size-10" }: { className?: string }) {
  return (
    <img src={logoImage} alt="" className={`shrink-0 object-contain ${className}`} aria-hidden="true" />
  );
}

export function Logo({ subtitle = "Seu corre sob controle." }: { subtitle?: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <LogoMark />
      <div className="min-w-0">
        <p className="font-display text-base leading-none font-bold text-foreground">Gestão Motoca Pro</p>
        {subtitle ? <p className="mt-1 truncate text-[11px] text-muted-foreground">{subtitle}</p> : null}
      </div>
    </div>
  );
}
