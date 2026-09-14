import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { DocumentDialog } from "@/components/forms/dialogs";
import { EmptyState, GlassCard, PageTitle, StatusDot } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { useDocuments, useRemove } from "@/lib/data";
import { daysUntil } from "@/lib/calc";
import { brl, dateBR } from "@/lib/format";
import type { AppDocument } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/app/documentos")({
  head:()=>({meta:[{title:"Documentos — MotoFinance"},{name:"description",content:"Vencimentos de documentos da moto e do motociclista."},{property:"og:title",content:"Documentos — MotoFinance"},{property:"og:description",content:"Vencimentos de documentos da moto e do motociclista."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}), component:DocumentsPage,
});
function DocumentsPage(){const q=useDocuments();const[record,setRecord]=useState<AppDocument|null|undefined>(undefined);const remove=useRemove("documents","Documento excluído.");return <div className="space-y-6"><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><PageTitle title="Documentos" subtitle="IPVA, licenciamento, seguro e CNH sob controle."/><Button size="sm" onClick={()=>setRecord(null)}><Plus className="mr-1 size-4"/>Adicionar</Button></div>{q.data?.length?<div className="grid gap-4 md:grid-cols-2">{q.data.map(d=>{const left=d.expiration_date?daysUntil(d.expiration_date):null;const status=left==null||left>30?"ok":left>=0?"soon":"late";return <GlassCard key={d.id}><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><div><div className="flex items-center gap-2"><StatusDot status={status}/><h2 className="font-display font-bold">{d.name}</h2></div><p className="mt-2 text-sm text-muted-foreground">Vencimento: {dateBR(d.expiration_date)}</p>{d.amount!=null?<p className="num-display mt-2">{brl(d.amount)}</p>:null}</div><div className="flex"><Button variant="ghost" size="icon" className="size-8" onClick={()=>setRecord(d)}><Pencil className="size-3.5"/></Button><Button variant="ghost" size="icon" className="size-8 text-negative" onClick={()=>window.confirm("Excluir este documento?")&&remove.mutate(d.id)}><Trash2 className="size-3.5"/></Button></div></div></GlassCard>})}</div>:<EmptyState title="Nenhum documento" description="Adicione vencimentos para receber alertas visuais."/>}<DocumentDialog open={record!==undefined} onOpenChange={v=>!v&&setRecord(undefined)} record={record??null}/></div>}