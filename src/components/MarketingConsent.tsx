import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { readConsent, requiresConsent, saveConsent, type ConsentChoice } from "@/lib/marketing-consent";
import { recordMarketingChoice } from "@/lib/marketing-consent.functions";
import { refreshTracking, setTrackingRegion, trackPage } from "@/lib/tracking";
import { supabase } from "@/integrations/supabase/client";

export function MarketingConsent() {
  const path = useRouterState({ select: state => state.location.pathname });
  const save = useServerFn(recordMarketingChoice);
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [region, setRegion] = useState("XX");
  const [settings, setSettings] = useState(false);
  useEffect(() => {
    setChoice(readConsent());
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2000);
    void fetch("/cdn-cgi/trace", { signal: controller.signal }).then(async response => {
      if (!response.ok) return;
      const match = (await response.text()).match(/^loc=([A-Z0-9]{2})$/m);
      if (match?.[1]) { setRegion(match[1]); setTrackingRegion(match[1]); }
    }).catch(() => {}).finally(() => window.clearTimeout(timeout));
    const onChange = () => { setChoice(readConsent()); refreshTracking(); };
    window.addEventListener("storage", onChange);
    window.addEventListener("marketing-consent-change", onChange);
    window.addEventListener("open-cookie-settings", () => setSettings(true));
    return () => { controller.abort(); window.clearTimeout(timeout); window.removeEventListener("storage", onChange); window.removeEventListener("marketing-consent-change", onChange); };
  }, []);
  useEffect(() => { trackPage(path); }, [path]);
  useEffect(() => {
    if (!choice) return;
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) void save({ data: choice }).catch(() => {});
    });
  }, [choice, save]);
  const decide = (accepted: boolean) => {
    const next = saveConsent(accepted, region);
    setChoice(next);
    setSettings(false);
    refreshTracking();
  };
  const visible = settings || (requiresConsent(region) && !choice);
  if (!visible) return null;
  return <aside role="dialog" aria-label="Preferências de privacidade" className="fixed inset-x-0 bottom-0 z-[100] border-t border-border bg-background p-5 text-foreground shadow-xl sm:p-6">
    <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="max-w-2xl"><h2 className="font-display text-lg font-bold">Sua privacidade</h2><p className="mt-1 text-sm text-muted-foreground">Usamos Meta e, quando conectado, Google Analytics para medir visitas, campanhas, cadastros e assinaturas e otimizar anúncios. Você pode aceitar ou recusar; sua escolha pode ser alterada a qualquer momento. <Link to="/privacidade" className="underline">Política de Privacidade</Link></p></div>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row"><Button variant="outline" onClick={() => decide(false)}>Recusar</Button><Button onClick={() => decide(true)}>Aceitar</Button>{settings && <Button variant="ghost" onClick={() => setSettings(false)}>Fechar</Button>}</div>
    </div>
  </aside>;
}