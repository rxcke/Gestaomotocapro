import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { useAccess, openUpgrade } from "@/lib/use-access";
import { recordSignupAttribution } from "@/lib/demo.functions";
import { captureAttribution, campaignParameters } from "@/lib/tracking";
import { DEMO_HOURS, demoRemainingLabel } from "@/lib/demo";

export function DemoExperience() {
  const access = useAccess();
  const recordAttribution = useServerFn(recordSignupAttribution);
  const [upgrade, setUpgrade] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const open = () => setUpgrade(true);
    window.addEventListener("gmp:open-upgrade", open);
    captureAttribution();
    void recordAttribution({ data: { campaign: campaignParameters() } }).catch(() => {});
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => { window.removeEventListener("gmp:open-upgrade", open); window.clearInterval(timer); };
  }, [recordAttribution]);
  const demo = access.data?.demo;
  const expired = access.data?.demoExpired;
  const label = demoRemainingLabel(access.data?.demoExpiresAt ?? null, now);
  const expiresMs = access.data?.demoExpiresAt ? new Date(access.data.demoExpiresAt).getTime() : NaN;
  const remaining = Number.isFinite(expiresMs) ? Math.min(1, Math.max(0, (expiresMs - now) / (DEMO_HOURS * 3_600_000))) : null;
  return <>
    {(demo || expired) && <section className="home-rise mb-6 rounded-[1.75rem] bg-secondary/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">{expired ? "Demonstração encerrada" : "Demonstração"}</span>
          <p className={`mt-1 text-sm ${!expired && label?.soon ? "font-semibold text-warning" : "text-muted-foreground"}`}>{expired ? "Seus dados continuam aqui. Escolha um plano para continuar." : label && !label.expired ? label.text : ""}</p>
        </div>
        <Button className="h-11 rounded-full px-5 text-xs font-bold uppercase tracking-wider" onClick={openUpgrade}>{expired ? "Escolher meu plano" : "Desbloquear meu acesso"}</Button>
      </div>
      {!expired && remaining !== null ? <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Tempo restante da demonstração" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(remaining * 100)}><div className={`h-full rounded-full transition-[width] duration-700 ${label?.soon ? "bg-warning" : "bg-accent"}`} style={{ width: `${remaining * 100}%` }} /></div> : null}
    </section>}
    <Dialog open={upgrade} onOpenChange={setUpgrade}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-[2rem] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{expired ? "Seu período de demonstração terminou" : "Desbloqueie seu controle completo"}</DialogTitle>
          <DialogDescription>{expired ? "Você já conheceu o Gestão Motoca Pro. Agora desbloqueie seu controle completo e continue acompanhando seu corre." : "Assine para manter seu controle completo depois da demonstração. Tudo que você registrou continua na sua conta."}</DialogDescription>
        </DialogHeader>
        <Button asChild className="h-auto min-h-14 whitespace-normal rounded-full font-bold"><Link to="/planos" onClick={() => setUpgrade(false)}>DESBLOQUEAR MEU ACESSO</Link></Button>
        <Button variant="ghost" className="h-auto min-h-12 whitespace-normal rounded-full" onClick={() => setUpgrade(false)}>CONTINUAR EXPLORANDO</Button>
      </DialogContent>
    </Dialog>
  </>;
}
