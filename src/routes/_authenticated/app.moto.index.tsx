import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Fuel, Gauge, Pencil, Plus, Trash2 } from "lucide-react";
import { MotoDialog } from "@/components/forms/dialogs";
import { EmptyState, ErrorBlock, GlassCard, LoadingBlock, PageTitle } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/app-context";
import { useRemove } from "@/lib/data";
import { brl, km } from "@/lib/format";
import type { Motorcycle } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/app/moto/")({
  head: () => ({ meta: [
    { title: "Minha Moto — Gestão Motoboy" },
    { name: "description", content: "Gerencie suas motos, quilometragem e custos." },
    { property: "og:title", content: "Minha Moto — Gestão Motoboy" },
    { property: "og:description", content: "Gerencie suas motos, quilometragem e custos." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: MotoPage,
});

function MotoPage() {
  const { motorcycles, loading, error } = useApp();
  const [record, setRecord] = useState<Motorcycle | null | undefined>(undefined);
  const remove = useRemove("motorcycles", "Moto excluída.");
  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock />;

  return <div className="space-y-6">
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
      <PageTitle title="Minha Moto" subtitle="Até três motos, cada uma com seu próprio histórico." />
      <Button size="sm" disabled={motorcycles.length >= 3} onClick={() => setRecord(null)}><Plus className="mr-1 size-4" /> Moto</Button>
    </div>
    {motorcycles.length ? <div className="grid gap-4 md:grid-cols-2">{motorcycles.map((m) => <GlassCard key={m.id}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
        <div className="min-w-0"><p className="text-xs font-semibold text-accent">{m.year ?? "Ano não informado"}</p><h2 className="truncate font-display text-xl font-bold">{m.brand} {m.model}</h2><p className="mt-1 text-sm text-muted-foreground">{m.plate ?? "Sem placa"}</p></div>
        <div className="flex gap-1"><Button size="icon" variant="ghost" aria-label="Editar moto" onClick={() => setRecord(m)}><Pencil className="size-4" /></Button><Button size="icon" variant="ghost" className="text-negative" aria-label="Excluir moto" onClick={() => window.confirm("Excluir esta moto e todo o histórico dela?") && remove.mutate(m.id)}><Trash2 className="size-4" /></Button></div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3"><div className="glass-soft p-3"><Gauge className="size-4 text-accent"/><p className="mt-2 text-xs text-muted-foreground">Quilometragem</p><p className="num-display mt-0.5">{km(m.current_km)}</p></div><div className="glass-soft p-3"><p className="text-xs text-muted-foreground">Valor de compra</p><p className="num-display mt-5">{m.purchase_value ? brl(m.purchase_value) : "—"}</p></div></div>
      <Button asChild variant="outline" className="mt-4 w-full"><Link to="/app/moto/abastecimentos"><Fuel className="mr-2 size-4"/>Abastecimentos</Link></Button>
    </GlassCard>)}</div> : <EmptyState title="Nenhuma moto cadastrada" description="Cadastre uma moto para começar os cálculos." action={<Button onClick={() => setRecord(null)}>Cadastrar moto</Button>} />}
    <div className="grid gap-3 sm:grid-cols-2"><Button asChild variant="outline" className="h-12"><Link to="/app/documentos">Documentos e vencimentos</Link></Button><Button asChild variant="outline" className="h-12"><Link to="/app/moto/abastecimentos">Consumo e abastecimentos</Link></Button></div>
    <MotoDialog open={record !== undefined} onOpenChange={(v) => !v && setRecord(undefined)} record={record ?? null} />
  </div>;
}