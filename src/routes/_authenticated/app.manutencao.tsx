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
    { title: "Manutenção — Gestão Motoca Pro" }, { name: "description", content: "Histórico e alertas de manutenção por data e quilometragem." },
    { property: "og:title", content: "Manutenção — Gestão Motoca Pro" }, { property: "og:description", content: "Histórico e alertas de manutenção por data e quilometragem." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: MaintenancePage,
});

function MaintenancePage() {
  const data=useScopedData(); const {activeMoto}=useApp(); const currentKm=activeMotoKm(activeMoto,data.fuel); const [record,setRecord]=useState<MaintenanceRecord|null|undefined>(undefined); const remove=useRemove("maintenance_records","Manutenção excluída.");
  return <div className="space-y-6"><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><PageTitle title="Manutenção" subtitle="Antecipe revisões e preserve sua moto."/><Button size="sm" onClick={()=>setRecord(null)}><Plus className="mr-1 size-4"/>Registrar</Button></div>
  {data.maintenance.length?<div className="grid gap-4 md:grid-cols-2">{[...data.maintenance].sort((a,b)=>b.date.localeCompare(a.date)).map(r=>{const status=maintenanceStatus(r,currentKm);const details=[r.description,r.km!=null?km(r.km):null,r.workshop].filter(Boolean);return <GlassCard key={r.id}><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><div className="min-w-0"><div className="flex min-w-0 items-center gap-2"><StatusDot status={status.status}/><h2 className="truncate font-display font-bold">{r.category}</h2></div><p className="mt-1 text-sm text-muted-foreground">{dateBR(r.date)}</p></div><div className="flex shrink-0 gap-1"><Button variant="ghost" size="icon" className="size-8" onClick={()=>setRecord(r)} aria-label="Editar manutenção"><Pencil className="size-3.5"/></Button><Button variant="ghost" size="icon" className="size-8 text-negative" onClick={()=>window.confirm("Excluir esta manutenção?")&&remove.mutate(r.id)} aria-label="Excluir manutenção"><Trash2 className="size-3.5"/></Button></div></div><p className="num-display mt-4 text-xl">{brl(r.cost)}</p>{details.length?<p className="mt-3 text-sm text-muted-foreground">{details.join(" · ")}</p>:null}{status.label!=="Sem previsão"?<p className="mt-3 text-xs font-medium text-muted-foreground">{status.label}</p>:null}</GlassCard>})}</div>:<EmptyState title="Sem manutenções" description="Registre o tipo e o valor da primeira manutenção."/>}
  <MaintenanceDialog open={record!==undefined} onOpenChange={v=>!v&&setRecord(undefined)} record={record??null}/></div>;
}