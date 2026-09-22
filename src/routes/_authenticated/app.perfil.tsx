import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CreditCard } from "lucide-react";
import { SignOutButton } from "@/components/AppShell";
import { GlassCard, PageTitle } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useProfile, useUpdateProfile } from "@/lib/data";
import { useTheme } from "@/lib/theme";
import { dateBR } from "@/lib/format";
import { getSubscriptionAccess } from "@/lib/subscription.functions";
import { fetchSubscriptionAccessWhenAuthenticated } from "@/lib/subscription-access";

export const Route = createFileRoute("/_authenticated/app/perfil")({head:()=>({meta:[{title:"Perfil — Gestão Motoboy"},{name:"description",content:"Conta e preferências do Gestão Motoboy."},{property:"og:title",content:"Perfil — Gestão Motoboy"},{property:"og:description",content:"Conta e preferências do Gestão Motoboy."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:ProfilePage});

const STATUS_LABELS = { pending: "Pendente", active: "Ativo", canceled: "Cancelado", expired: "Expirado", refunded: "Reembolsado", chargeback: "Chargeback", paused: "Pausado", late: "Em atraso" } as const;

function ProfilePage(){
  const p=useProfile();const save=useUpdateProfile();const{theme,toggle}=useTheme();
  const fetchAccess=useServerFn(getSubscriptionAccess);
  const access=useQuery({queryKey:["subscription","access"],queryFn:()=>fetchSubscriptionAccessWhenAuthenticated(fetchAccess)});
  const[name,setName]=useState<string|undefined>(undefined);const[pro,setPro]=useState<boolean|undefined>(undefined);
  const currentName=name??p.data?.name??"";const currentPro=pro??p.data?.is_professional??false;
  const subscription=access.data?.subscription;
  return <div className="space-y-6"><PageTitle title="Perfil" subtitle="Conta, assinatura e preferências."/>
    <GlassCard><h2 className="font-display text-lg font-bold">Conta</h2><div className="mt-4 space-y-4"><div className="space-y-1.5"><Label htmlFor="profile-name">Nome</Label><Input id="profile-name" className="h-12 text-base" value={currentName} onChange={e=>setName(e.target.value)}/></div><div className="space-y-1.5"><Label htmlFor="profile-email">E-mail da conta</Label><Input id="profile-email" className="h-12 text-base" value={p.data?.email??""} readOnly disabled/></div><div className="glass-soft flex items-center justify-between gap-3 p-4"><div><p className="text-sm font-semibold">Modo profissional</p><p className="text-xs text-muted-foreground">Ativa jornada e indicadores de lucro por hora.</p></div><Switch checked={currentPro} onCheckedChange={setPro}/></div><Button onClick={()=>save.mutate({name:currentName,is_professional:currentPro})} disabled={save.isPending}>Salvar perfil</Button></div></GlassCard>
    <GlassCard><div className="flex items-center gap-2"><CreditCard className="size-5 text-accent"/><h2 className="font-display text-lg font-bold">Minha assinatura</h2></div>{access.isLoading?<p className="mt-4 text-sm text-muted-foreground">Consultando assinatura...</p>:subscription?<div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="glass-soft p-3"><p className="text-xs text-muted-foreground">Plano</p><p className="mt-1 font-semibold">{subscription.plan==="monthly"?"Start · Mensal":subscription.plan==="quarterly"?"Pro · Trimestral":"Elite · Anual"}</p></div><div className="glass-soft p-3"><p className="text-xs text-muted-foreground">Status</p><p className="mt-1 font-semibold">{STATUS_LABELS[subscription.providerStatus]}</p></div><div className="glass-soft p-3"><p className="text-xs text-muted-foreground">Início</p><p className="mt-1 font-semibold">{dateBR(subscription.startedAt)}</p></div><div className="glass-soft p-3"><p className="text-xs text-muted-foreground">Renovação ou expiração</p><p className="mt-1 font-semibold">{dateBR(subscription.expiresAt)}</p></div>{subscription.subscriptionId?<div className="glass-soft p-3 sm:col-span-2"><p className="text-xs text-muted-foreground">ID da assinatura</p><p className="mt-1 break-all font-mono text-xs">{subscription.subscriptionId}</p></div>:null}</div>:<p className="mt-4 text-sm text-muted-foreground">Você ainda não possui uma assinatura.</p>}<div className="mt-5 flex flex-col gap-2 sm:flex-row"><Button asChild><Link to="/planos">{subscription?"Ver planos":"Assinar agora"}</Link></Button></div></GlassCard>
    <GlassCard><h2 className="font-display text-lg font-bold">Preferências</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><Button variant="outline" className="h-12" onClick={toggle}>Tema {theme==="dark"?"claro":"escuro"}</Button><Button asChild variant="outline" className="h-12"><Link to="/app/metas">Gerenciar metas</Link></Button><Button asChild variant="outline" className="h-12"><Link to="/app/documentos">Documentos</Link></Button><Button asChild variant="outline" className="h-12"><Link to="/app/moto">Minhas motos</Link></Button></div></GlassCard><GlassCard><SignOutButton full/></GlassCard></div>}