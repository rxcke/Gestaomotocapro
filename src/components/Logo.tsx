export function LogoMark({ className = "size-10" }: { className?: string }) {
  return (
    <span
      className={`grid place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-[60%]">
        <circle cx="5.5" cy="16.5" r="3" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="18.5" cy="16.5" r="3" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M8.5 16.5h6.2M18.5 16.5 14 9H9.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M12 3.2v4.2M10.2 4.4h3.2a1 1 0 0 1 0 2h-2.4a1 1 0 0 0 0 2h3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function Logo({ subtitle = "Seu dinheiro. Sua moto." }: { subtitle?: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <LogoMark />
      <div className="min-w-0">
        <p className="font-display text-base leading-none font-bold">MotoFinance</p>
        {subtitle ? <p className="mt-1 truncate text-[11px] text-muted-foreground">{subtitle}</p> : null}
      </div>
    </div>
  );
}
