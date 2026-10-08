import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Stat } from "./glass";
import { useAccess, openUpgrade } from "@/lib/use-access";
import { startDemo, recordSignupAttribution } from "@/lib/demo.functions";
import { captureAttribution, campaignParameters } from "@/lib/tracking";
import { useExpenses, useIncomes } from "@/lib/data";
import { demoResult } from "@/lib/demo";
import { brl } from "@/lib/format";

export function DemoExperience() {
  const access = useAccess();
  const qc = useQueryClient();
  const begin = useServerFn(startDemo);
  const recordAttribution = useServerFn(recordSignupAttribution);
  const [upgrade, setUpgrade] = useState(false);
  const [starting, setStarting] = useState(false);
  useEffect(() => {
    const open = () => setUpgrade(true);
    window.addEventListener("gmp:open-upgrade", open);
    captureAttribution();
    void recordAttribution({ data: { campaign: campaignParameters() } }).catch(() => {});
    return () => window.removeEventListener("gmp:open-upgrade", open);
  }, [recordAttribution]);
  const demo = access.data?.demo;
  const usage = access.data?.demoUsage;
  return <>
    {demo && <section className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <div><span className="text-xs font-bold tracking-wide text-accent">DEMONSTRAÇÃO</span><p className="mt-1 text-sm text-muted-foreground">Ganhos: {usage?.incomeUsed ? 1 : 0}/1 · Gastos: {usage?.expenseUsed ? 1 : 0}/1 · Sem cartão</p></div>
      <Button variant="outline" onClick={openUpgrade}>Desbloquear acesso completo</Button>
    </section>}
    <Dialog open={Boolean(demo && !usage?.welcomed)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md [&>button:last-child]:hidden" onEscapeKeyDown={e => e.preventDefault()} onInteractOutside={e => e.preventDefault()} onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader><DialogTitle className="font-display text-2xl">Bem-vindo ao Gestão Motoca Pro.</DialogTitle><DialogDescription>Conheça como funciona o controle do seu corre antes de desbloquear a plataforma completa.</DialogDescription></DialogHeader>
        <p className="text-sm text-muted-foreground">Experimente com 1 ganho e 1 gasto reais. Sem cartão, sem assinatura e sem prazo.</p>
        <Button disabled={starting} className="h-auto min-h-12 whitespace-normal" onClick={async () => {
          setStarting(true);
          try { await begin(); await qc.invalidateQueries({ queryKey: ["subscription", "access"] }); }
          catch { toast.error("Não foi possível começar. Tente novamente."); }
          finally { setStarting(false); }
        }}>{starting ? "Preparando..." : "COMEÇAR DEMONSTRAÇÃO"}</Button>
      </DialogContent>
    </Dialog>
    <Dialog open={upgrade} onOpenChange={setUpgrade}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader><DialogTitle className="font-display text-2xl">Desbloqueie seu controle completo</DialogTitle><DialogDescription>Você já conheceu como funciona. Agora desbloqueie o Gestão Motoca Pro para controlar seus ganhos, gastos, combustível, manutenção e lucro de verdade.</DialogDescription></DialogHeader>
        <p className="font-semibold">Seu corre. Seus números. Seu controle.</p>
        <Button asChild className="h-auto min-h-12 whitespace-normal"><Link to="/planos" onClick={() => setUpgrade(false)}>DESBLOQUEAR MEU ACESSO</Link></Button>
        <Button variant="outline" className="h-auto min-h-12 whitespace-normal" onClick={() => setUpgrade(false)}>CONTINUAR EXPLORANDO</Button>
      </DialogContent>
    </Dialog>
  </>;
}

export function DemoFinancialResult() {
  const incomes = useIncomes();
  const expenses = useExpenses();
  const result = demoResult(incomes.data ?? [], expenses.data ?? []);
  const complete = Boolean(incomes.data?.length && expenses.data?.length);
  return <section className="space-y-4">
    <h2 className="font-display text-lg font-bold">{complete ? "Seu resultado real" : "Seu primeiro resultado"}</h2>
    <div className="grid gap-3 sm:grid-cols-3">
      <Stat label="Faturamento" value={brl(result.income)} tone="positive" />
      <Stat label="Gastos" value={brl(result.expense)} tone="negative" />
      <Stat label="Lucro" value={brl(result.profit)} tone={result.profit >= 0 ? "positive" : "negative"} />
    </div>
    {complete ? <div className="space-y-3 border-l-2 border-accent pl-4"><p className="text-sm">Esses números são seus. Desbloqueie o controle completo e continue de onde parou.</p><Button onClick={openUpgrade}>DESBLOQUEAR MEU ACESSO</Button></div> : <p className="text-sm text-muted-foreground">Registre um ganho e um gasto para ver quanto sobrou.</p>}
  </section>;
}