import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, CheckCircle2, CreditCard, RefreshCw } from "lucide-react";
import { SignOutButton } from "@/components/AppShell";
import { ErrorBlock, GlassCard, LoadingBlock, PageTitle } from "@/components/glass";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useProfile, useUpdateProfile } from "@/lib/data";
import { useTheme } from "@/lib/theme";
import { dateBR } from "@/lib/format";
import { getSubscriptionAccess, type SubscriptionAccess, type SubscriptionView } from "@/lib/subscription.functions";
import { fetchSubscriptionAccessWhenAuthenticated } from "@/lib/subscription-access";
import { formatBrazilianMobile, normalizeBrazilianMobile } from "@/lib/phone";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/perfil")({head:()=>({meta:[{title:"Perfil — Gestão Motoca Pro"},{name:"description",content:"Conta e preferências do Gestão Motoca Pro."},{property:"og:title",content:"Perfil — Gestão Motoca Pro"},{property:"og:description",content:"Conta e preferências do Gestão Motoca Pro."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:ProfilePage});

const STATUS_LABELS = { pending: "Pendente", active: "Ativa", canceled: "Cancelada", expired: "Expirada", refunded: "Reembolsada", chargeback: "Chargeback", paused: "Pausada", late: "Em atraso" } as const;
const PLAN_DETAILS = {
  monthly: { plan: "Start", offer: "Plano Start", period: "Mensal" },
  quarterly: { plan: "Pro", offer: "Plano Pro", period: "Trimestral" },
  annual: { plan: "Elite", offer: "Plano Elite", period: "Anual" },
} as const;

function SubscriptionField({ label, value }: { label: string; value: string }) {
  return <div className="glass-soft min-w-0 p-4"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 break-words font-semibold">{value}</p></div>;
}

function SubscriptionSection({ access }: { access: UseQueryResult<SubscriptionAccess, Error> }) {
  const subscription=access.data?.subscription;
  const active=Boolean(access.data?.active);

  return <GlassCard><div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3"><div className="flex min-w-0 items-center gap-2"><CreditCard className="size-5 shrink-0 text-accent"/><div className="min-w-0"><h2 className="font-display text-lg font-bold">Minha assinatura</h2><p className="mt-0.5 text-sm text-muted-foreground">Dados confirmados pela sua conta.</p></div></div>{active?<Badge className="shrink-0 border-transparent bg-positive/15 text-positive hover:bg-positive/15"><CheckCircle2 className="mr-1 size-3.5"/>Ativa</Badge>:null}</div>
    {access.isLoading?<div className="mt-4"><LoadingBlock label="Consultando sua assinatura..."/></div>:access.isError?<div className="mt-4 space-y-3"><ErrorBlock message="Não foi possível carregar sua assinatura."/><Button className="h-11 w-full sm:w-auto" variant="outline" disabled={access.isFetching} onClick={()=>void access.refetch()}><RefreshCw className={access.isFetching?"animate-spin":""}/>{access.isFetching?"Tentando novamente...":"Tentar novamente"}</Button></div>:subscription?<SubscriptionDetails subscription={subscription} active={active}/>:access.data?.ambassador?<div className="mt-5 text-sm text-muted-foreground">Seu acesso de embaixador está liberado. Você não possui uma assinatura.</div>:<NoSubscription/>}
  </GlassCard>;
}

function SubscriptionDetails({ subscription, active }: { subscription: SubscriptionView; active: boolean }) {
  const details=PLAN_DETAILS[subscription.plan];
  const status=STATUS_LABELS[subscription.providerStatus];
  const statusTone=subscription.providerStatus==="active"?"text-positive":subscription.providerStatus==="late"||subscription.providerStatus==="paused"?"text-warning":"text-negative";
  return <div className="mt-5"><div className="grid gap-3 sm:grid-cols-2"><SubscriptionField label="Plano atual" value={details.plan}/><SubscriptionField label="Nome da oferta" value={details.offer}/><div className="glass-soft min-w-0 p-4"><p className="text-xs font-medium text-muted-foreground">Status atual</p><p className={`mt-1 font-semibold ${statusTone}`}>{status}</p></div><SubscriptionField label="Periodicidade" value={details.period}/><SubscriptionField label="Data de início" value={dateBR(subscription.startedAt)}/><div className="glass-soft min-w-0 p-4"><div className="flex items-center gap-2"><CalendarDays className="size-4 shrink-0 text-muted-foreground"/><p className="text-xs font-medium text-muted-foreground">{active?"Próxima renovação ou vencimento":"Vencimento"}</p></div><p className="mt-1 font-semibold">{dateBR(subscription.expiresAt)}</p></div>{subscription.canceledAt?<SubscriptionField label="Cancelamento" value={dateBR(subscription.canceledAt)}/>:null}</div>{!active?<div className="mt-5"><Button asChild className="h-12 w-full sm:w-auto"><Link to="/planos">Visualizar planos</Link></Button></div>:null}</div>;
}

function NoSubscription(){return <div className="mt-5"><div className="glass-soft px-5 py-7 text-center"><p className="font-display font-bold">Nenhuma assinatura ativa</p><p className="mt-2 text-sm text-muted-foreground">Conheça os planos disponíveis para liberar todos os recursos.</p></div><Button asChild className="mt-4 h-12 w-full sm:w-auto"><Link to="/planos">Visualizar planos</Link></Button></div>}

function ProfilePage(){
  const p=useProfile();const save=useUpdateProfile();const{theme,toggle}=useTheme();
  const fetchAccess=useServerFn(getSubscriptionAccess);
  const access=useQuery({queryKey:["subscription","access"],queryFn:()=>fetchSubscriptionAccessWhenAuthenticated(fetchAccess)});
  const[name,setName]=useState<string|undefined>(undefined);const[phone,setPhone]=useState<string|undefined>(undefined);const[pro,setPro]=useState<boolean|undefined>(undefined);
  const currentName=name??p.data?.name??"";const currentPhone=phone??formatBrazilianMobile(p.data?.phone);const currentPro=pro??p.data?.is_professional??false;
  const saveProfile=()=>{const normalizedPhone=normalizeBrazilianMobile(currentPhone);if(!normalizedPhone){toast.error("Informe um celular brasileiro válido com DDD.");return;}save.mutate({name:currentName.trim(),phone:normalizedPhone,is_professional:currentPro},{onSuccess:()=>setPhone(formatBrazilianMobile(normalizedPhone))});};
  return <div className="space-y-6"><PageTitle title="Perfil" subtitle="Conta, assinatura e preferências."/>
    <GlassCard><h2 className="font-display text-lg font-bold">Conta</h2><div className="mt-4 space-y-4"><div className="space-y-1.5"><Label htmlFor="profile-name">Nome completo</Label><Input id="profile-name" className="h-12 text-base" value={currentName} onChange={e=>setName(e.target.value)}/></div><div className="space-y-1.5"><Label htmlFor="profile-phone">WhatsApp / Celular</Label><Input id="profile-phone" type="tel" inputMode="tel" autoComplete="tel-national" className="h-12 text-base" placeholder="(31) 99999-9999" maxLength={15} value={currentPhone} onChange={e=>setPhone(formatBrazilianMobile(e.target.value))}/></div><div className="space-y-1.5"><Label htmlFor="profile-email">E-mail da conta</Label><Input id="profile-email" className="h-12 text-base" value={p.data?.email??""} readOnly disabled/></div><div className="glass-soft flex items-center justify-between gap-3 p-4"><div><p className="text-sm font-semibold">Modo profissional</p><p className="text-xs text-muted-foreground">Ativa jornada e indicadores de lucro por hora.</p></div><Switch checked={currentPro} onCheckedChange={setPro}/></div><Button onClick={saveProfile} disabled={save.isPending}>{save.isPending?"Salvando...":"Salvar perfil"}</Button></div></GlassCard>
    <SubscriptionSection access={access}/>
    <GlassCard><h2 className="font-display text-lg font-bold">Preferências</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><Button variant="outline" className="h-12" onClick={toggle}>Tema {theme==="dark"?"claro":"escuro"}</Button><Button asChild variant="outline" className="h-12"><Link to="/app/metas">Gerenciar metas</Link></Button><Button asChild variant="outline" className="h-12"><Link to="/app/documentos">Documentos</Link></Button><Button asChild variant="outline" className="h-12"><Link to="/app/moto">Minhas motos</Link></Button></div></GlassCard><GlassCard><SignOutButton full/></GlassCard></div>}