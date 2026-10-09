import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { exportUsersCsv } from "@/lib/admin.functions";
import type { DemoFilter, ExportPeriod, SubscriptionFilter } from "@/lib/user-export";

const PERIODS: Array<[ExportPeriod, string]> = [["all", "Todos"], ["today", "Hoje"], ["7d", "Últimos 7 dias"], ["30d", "Últimos 30 dias"], ["custom", "Personalizado"]];
const SUBS: Array<[SubscriptionFilter, string]> = [["all", "Todas"], ["active", "Com assinatura ativa"], ["none", "Sem assinatura ativa"]];
const DEMOS: Array<[DemoFilter, string]> = [["all", "Todas"], ["active", "Ativa"], ["expired", "Expirada"], ["none", "Sem demonstração"]];

function Chips<T extends string>({ label, options, value, onChange }: { label: string; options: Array<[T, string]>; value: T; onChange: (v: T) => void }) {
  return <div className="space-y-2"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><div className="flex flex-wrap gap-2">{options.map(([v, l]) => <Button key={v} type="button" size="sm" variant={value === v ? "default" : "outline"} onClick={() => onChange(v)}>{l}</Button>)}</div></div>;
}

export function ExportUsersDialog() {
  const run = useServerFn(exportUsersCsv);
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<ExportPeriod>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [subscription, setSubscription] = useState<SubscriptionFilter>("all");
  const [demo, setDemo] = useState<DemoFilter>("all");
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const customReady = period !== "custom" || (from && to && from <= to);
  const input = { period, from: from || undefined, to: to || undefined, subscription, demo };

  useEffect(() => {
    if (!open || !customReady) { setCount(null); return; }
    let alive = true;
    setCount(null);
    run({ data: { ...input, countOnly: true } }).then((r) => alive && setCount(r.count)).catch(() => alive && setCount(null));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, period, from, to, subscription, demo]);

  async function exportNow() {
    setBusy(true);
    try {
      const r = await run({ data: { ...input, countOnly: false } });
      if (!r.csv) { toast.info("Nenhum usuário encontrado com esses filtros."); return; }
      const url = URL.createObjectURL(new Blob([r.csv], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `usuarios-gestao-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${r.count} usuário${r.count === 1 ? "" : "s"} exportado${r.count === 1 ? "" : "s"}.`);
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível exportar.");
    } finally { setBusy(false); }
  }

  return <>
    <Button onClick={() => setOpen(true)} className="h-12"><Download className="mr-2 size-4" />Exportar usuários</Button>
    <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
        <DialogHeader><DialogTitle>Exportar usuários</DialogTitle><DialogDescription>Arquivo CSV pronto para importar no seu CRM. O e-mail é a primeira coluna.</DialogDescription></DialogHeader>
        <div className="space-y-5">
          <Chips label="Cadastro (horário de Brasília)" options={PERIODS} value={period} onChange={setPeriod} />
          {period === "custom" && <div className="grid grid-cols-2 gap-2"><label className="text-xs text-muted-foreground">De<Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label><label className="text-xs text-muted-foreground">Até<Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label></div>}
          <Chips label="Assinatura" options={SUBS} value={subscription} onChange={setSubscription} />
          <Chips label="Demonstração" options={DEMOS} value={demo} onChange={setDemo} />
          <p className="text-sm" aria-live="polite">{!customReady ? "Escolha as duas datas." : count === null ? "Contando usuários..." : count === 0 ? "Nenhum usuário com esses filtros." : `${count} usuário${count === 1 ? "" : "s"} no arquivo.`}</p>
        </div>
        <DialogFooter><Button disabled={busy || !customReady || count === 0} onClick={exportNow} className="h-12 w-full sm:w-auto"><Download className="mr-2 size-4" />{busy ? "Gerando..." : "Baixar CSV"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
