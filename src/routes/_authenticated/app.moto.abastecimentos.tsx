import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { FuelDialog } from "@/components/forms/dialogs";
import { EmptyState, GlassCard, PageTitle, Stat } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { useScopedData } from "@/lib/app-context";
import { fuelStats } from "@/lib/calc";
import { useRemove } from "@/lib/data";
import { brl, dateBR, km, num } from "@/lib/format";
import type { FuelRecord } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/app/moto/abastecimentos")({
  head: () => ({ meta: [
    { title: "Abastecimentos — Gestão Motoboy" }, { name: "description", content: "Consumo médio e custo de combustível por quilômetro." },
    { property: "og:title", content: "Abastecimentos — Gestão Motoboy" }, { property: "og:description", content: "Consumo médio e custo de combustível por quilômetro." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: FuelPage,
});

function FuelPage() {
  const data = useScopedData(); const [record,setRecord]=useState<FuelRecord|null|undefined>(undefined); const remove=useRemove("fuel_records","Abastecimento excluído."); const stats=fuelStats(data.fuel);
  return <div className="space-y-6"><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><PageTitle title="Abastecimentos" subtitle="Seu consumo calculado por abastecimentos sucessivos."/><Button size="sm" onClick={()=>setRecord(null)}><Plus className="mr-1 size-4"/>Adicionar</Button></div>
  <div className="grid gap-3 sm:grid-cols-3"><Stat label="Consumo médio" value={`${num(stats.avgKmL)} km/L`}/><Stat label="Custo por km" value={brl(stats.fuelCostPerKm)}/><Stat label="Distância calculada" value={km(stats.distance)}/></div>
  <GlassCard>{data.fuel.length ? <div className="divide-y divide-border/60">{[...data.fuel].sort((a,b)=>b.date.localeCompare(a.date)).map(r=><div key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{brl(r.total)} · {num(r.liters,2)} L</p><p className="truncate text-xs text-muted-foreground">{dateBR(r.date)} · {km(r.km)}{r.station?` · ${r.station}`:""}</p></div><div className="flex gap-1"><Button variant="ghost" size="icon" className="size-8" onClick={()=>setRecord(r)}><Pencil className="size-3.5"/></Button><Button variant="ghost" size="icon" className="size-8 text-negative" onClick={()=>window.confirm("Excluir este abastecimento?")&&remove.mutate(r.id)}><Trash2 className="size-3.5"/></Button></div></div>)}</div>:<EmptyState title="Sem abastecimentos" description="Registre dois abastecimentos para calcular o consumo médio."/>}</GlassCard>
  <FuelDialog open={record!==undefined} onOpenChange={v=>!v&&setRecord(undefined)} record={record??null}/></div>;
}