import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { MaintenanceDialog } from "@/components/forms/dialogs";
import { EmptyState, GlassCard, PageTitle, StatusDot } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { useApp, useScopedData } from "@/lib/app-context";
import { activeMotoKm, maintenanceStatus } from "@/lib/calc";
import { useRemove } from "@/lib/data";
import { brl, dateBR, km } from "@/lib/format";
import type { MaintenanceRecord } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/app/manutencao")({
  head: () => ({ meta: [
    { title: "Manutenção — MotoFinance" }, { name: "description", content: "Histórico e alertas de manutenção por data e quilometragem." },
    { property: "og:title", content: "Manutenção — MotoFinance" }, { property: "og:description", content: "Histórico e alertas de manutenção por data e quilometragem." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: MaintenancePage,
});

function MaintenancePage() {
  const data=useScopedData(); const {activeMoto}=useApp(); const currentKm=activeMotoKm(activeMoto,data.fuel); const [record,setRecord]=useState<MaintenanceRecord|null|undefined>(undefined); const remove=useRemove("maintenance_records","Manutenção excluída.");
  return <div className="space-y-6"><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><PageTitle title="Manutenção" subtitle="Antecipe revisões e preserve sua moto."/><Button size="sm" onClick={()=>setRecord(null)}><Plus className="mr-1 size-4"/>Registrar</Button></div>
  {data.maintenance.length?<div className="grid gap-4 md:grid-cols-2">{[...data.maintenance].sort((a,b)=>b.date.localeCompare(a.date)).map(r=>{const status=maintenanceStatus(r,currentKm);return <GlassCard key={r.id}><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><div><div className="flex items-center gap-2"><StatusDot status={status.status}/><h2 className="font-display font-bold">{r.category}</h2></div><p className="mt-1 text-sm text-muted-foreground">{r.description||"Sem descrição"}</p></div><div className="flex gap-1"><Button variant="ghost" size="icon" className="size-8" onClick={()=>setRecord(r)}><Pencil className="size-3.5"/></Button><Button variant="ghost" size="icon" className="size-8 text-negative" onClick={()=>window.confirm("Excluir esta manutenção?")&&remove.mutate(r.id)}><Trash2 className="size-3.5"/></Button></div></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div className="glass-soft p-3"><p className="text-xs text-muted-foreground">Realizada</p><p className="mt-1 font-semibold">{dateBR(r.date)}{r.km?` · ${km(r.km)}`:""}</p></div><div className="glass-soft p-3"><p className="text-xs text-muted-foreground">Custo</p><p className="num-display mt-1">{brl(r.cost)}</p></div></div><p className="mt-3 text-xs font-medium text-muted-foreground">{status.label}</p></GlassCard>})}</div>:<EmptyState title="Sem manutenções" description="Registre uma revisão e informe a próxima data ou quilometragem."/>}
  <MaintenanceDialog open={record!==undefined} onOpenChange={v=>!v&&setRecord(undefined)} record={record??null}/></div>;
}