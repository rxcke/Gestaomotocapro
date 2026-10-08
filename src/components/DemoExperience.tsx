import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { useAccess, openUpgrade } from "@/lib/use-access";
import { recordSignupAttribution } from "@/lib/demo.functions";
import { captureAttribution, campaignParameters } from "@/lib/tracking";
import { demoRemainingLabel } from "@/lib/demo";

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
  return <>
    {(demo || expired) && <section className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <div><span className="text-xs font-bold tracking-wide text-accent">{expired ? "DEMONSTRAÇÃO ENCERRADA" : "DEMONSTRAÇÃO"}</span>{!expired && label && !label.expired ? <p className={`mt-1 text-sm ${label.soon ? "font-semibold text-warning" : "text-muted-foreground"}`}>{label.text}</p> : null}</div>
      <Button variant="outline" onClick={openUpgrade}>Desbloquear acesso completo</Button>
    </section>}
    <Dialog open={upgrade} onOpenChange={setUpgrade}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{expired ? "Seu período de demonstração terminou" : "Desbloqueie seu controle completo"}</DialogTitle>
          <DialogDescription>{expired ? "Você já conheceu o Gestão Motoca Pro. Agora desbloqueie seu controle completo e continue acompanhando seu corre." : "Assine para manter seu controle completo depois da demonstração. Tudo que você registrou continua na sua conta."}</DialogDescription>
        </DialogHeader>
        <Button asChild className="h-auto min-h-12 whitespace-normal"><Link to="/planos" onClick={() => setUpgrade(false)}>DESBLOQUEAR MEU ACESSO</Link></Button>
        <Button variant="outline" className="h-auto min-h-12 whitespace-normal" onClick={() => setUpgrade(false)}>CONTINUAR EXPLORANDO</Button>
      </DialogContent>
    </Dialog>
  </>;
}
