import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AmbientBackground, ErrorBlock, GlassCard, LoadingBlock } from "@/components/glass";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { USAGE_TYPES } from "@/lib/constants";
import { useMotorcycles, useProfile, useUpdateProfile, useUpsert } from "@/lib/data";
import { cn } from "@/lib/utils";
import { getSubscriptionAccess } from "@/lib/subscription.functions";
import { fetchSubscriptionAccessWhenAuthenticated } from "@/lib/subscription-access";
import { formatBrazilianMobile, needsPhoneCompletion, normalizeBrazilianMobile } from "@/lib/phone";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [
    { title: "Configurar conta — Gestão Motoboy" },
    { name: "description", content: "Configure seu perfil e cadastre sua primeira moto." },
    { property: "og:title", content: "Configurar conta — Gestão Motoboy" },
    { property: "og:description", content: "Configure seu perfil e cadastre sua primeira moto." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "robots", content: "noindex" },
  ] }),
  component: Onboarding,
});

function Onboarding() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const profile = useProfile();
  const motorcycles = useMotorcycles();
  const updateProfile = useUpdateProfile("");
  const createMoto = useUpsert("motorcycles", "motorcycles", {});
  const fetchAccess = useServerFn(getSubscriptionAccess);
  const access = useQuery({ queryKey: ["subscription", "access"], queryFn: () => fetchSubscriptionAccessWhenAuthenticated(fetchAccess) });

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [usage, setUsage] = useState<string[]>([]);
  const [pro, setPro] = useState(false);
  const [moto, setMoto] = useState({ brand: "", model: "", year: "", plate: "", km: "" });
  const [saving, setSaving] = useState(false);
  const draftKey = `onboarding:draft:${user.id}`;

  const displayName = name || profile.data?.name || "";
  const displayPhone = phone || formatBrazilianMobile(profile.data?.phone);

  const phoneMissing = needsPhoneCompletion(profile.data?.phone);
  const blocked = access.isSuccess && !access.data.active && !access.data.admin && !phoneMissing;
  const completed = profile.isSuccess && Boolean(profile.data?.onboarding_completed) && !phoneMissing;

  useEffect(() => {
    if (!profile.isSuccess || typeof window === "undefined") return;
    const saved = window.localStorage.getItem(draftKey);
    if (saved) {
      try {
        const draft = JSON.parse(saved) as { step?: number; name?: string; phone?: string; usage?: string[]; pro?: boolean; moto?: typeof moto };
        setStep(Math.min(2, Math.max(0, draft.step ?? 0)));
        setName(draft.name ?? profile.data?.name ?? "");
        setPhone(draft.phone ?? formatBrazilianMobile(profile.data?.phone));
        setUsage(draft.usage ?? profile.data?.usage_types ?? []);
        setPro(draft.pro ?? profile.data?.is_professional ?? false);
        if (draft.moto) setMoto(draft.moto);
        return;
      } catch {
        window.localStorage.removeItem(draftKey);
      }
    }
    setName(profile.data?.name ?? "");
    setPhone(formatBrazilianMobile(profile.data?.phone));
    setUsage(profile.data?.usage_types ?? []);
    setPro(profile.data?.is_professional ?? false);
  }, [draftKey, profile.data, profile.isSuccess]);

  useEffect(() => {
    if (typeof window === "undefined" || completed) return;
    window.localStorage.setItem(draftKey, JSON.stringify({ step, name: displayName, phone: displayPhone, usage, pro, moto }));
  }, [completed, displayName, displayPhone, draftKey, moto, pro, step, usage]);

  useEffect(() => {
    if (blocked) navigate({ to: "/planos", replace: true });
  }, [blocked, navigate]);

  useEffect(() => {
    if (completed) navigate({ to: "/app", replace: true });
  }, [completed, navigate]);

  if (access.isLoading || profile.isLoading || motorcycles.isLoading || blocked || completed) {
    return <div className="flex min-h-dvh items-center justify-center bg-canvas p-6"><LoadingBlock label="Verificando sua assinatura..." /></div>;
  }

  if (access.isError || profile.isError || motorcycles.isError) {
    return <div className="flex min-h-dvh items-center justify-center bg-canvas p-6"><ErrorBlock message="Não foi possível preparar seu cadastro. Atualize a página para tentar novamente." /></div>;
  }

  if (blocked) return null;

  const toggleUsage = (u: string) =>
    setUsage((prev) => (prev.includes(u) ? prev.filter((x) => x !== u) : [...prev, u]));

  const saveIdentityStep = async () => {
    const normalizedName = displayName.trim();
    const normalizedPhone = normalizeBrazilianMobile(displayPhone);
    if (normalizedName.length < 2 || normalizedName.length > 100) {
      toast.error("Informe seu nome com 2 a 100 caracteres.");
      return;
    }
    if (!normalizedPhone) {
      toast.error("Informe um celular brasileiro válido com DDD.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile.mutateAsync({ name: normalizedName, phone: normalizedPhone });
      setName(normalizedName);
      setPhone(formatBrazilianMobile(normalizedPhone));
      if (!access.data?.active && !access.data?.admin) {
        window.localStorage.removeItem(draftKey);
        await navigate({ to: "/planos", replace: true });
        return;
      }
      setStep(1);
    } catch {
      toast.error("Não foi possível salvar seu nome. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const saveUsageStep = async () => {
    setSaving(true);
    try {
      await updateProfile.mutateAsync({ usage_types: usage, is_professional: pro });
      setStep(2);
    } catch {
      toast.error("Não foi possível salvar suas preferências. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const finish = async () => {
    if (saving) return;
    const brand = moto.brand.trim();
    const model = moto.model.trim();
    const year = moto.year ? Number(moto.year) : null;
    const currentKm = moto.km ? Number(moto.km) : 0;
    const currentYear = new Date().getFullYear() + 1;
    if (brand.length < 2 || model.length < 2) {
      toast.error("Informe a marca e o modelo da sua moto.");
      return;
    }
    if (year !== null && (!Number.isInteger(year) || year < 1900 || year > currentYear)) {
      toast.error("Informe um ano válido para a moto.");
      return;
    }
    if (!Number.isFinite(currentKm) || currentKm < 0) {
      toast.error("Informe uma quilometragem válida.");
      return;
    }
    setSaving(true);
    try {
      const refreshedMotorcycles = await motorcycles.refetch();
      if ((refreshedMotorcycles.data?.length ?? 0) === 0) {
        await createMoto.mutateAsync({
          brand,
          model,
          year,
          plate: moto.plate.trim().toUpperCase() || null,
          current_km: currentKm,
        });
      }
      await updateProfile.mutateAsync({
        name: displayName.trim(),
        usage_types: usage,
        is_professional: pro,
        onboarding_completed: true,
      });
      window.localStorage.removeItem(draftKey);
      await profile.refetch();
      await navigate({ to: "/app", replace: true });
    } catch {
      toast.error("Não foi possível concluir seu cadastro. Seus passos anteriores foram salvos.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-canvas px-5 py-10 text-foreground">
      <AmbientBackground />
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <GlassCard>
          <div className="mb-5 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-accent" : "bg-border")}
              />
            ))}
          </div>

          {step === 0 ? (
            <div className="space-y-4">
              <div>
                <h1 className="font-display text-2xl font-bold">Bem-vindo!</h1>
                <p className="mt-1 text-sm text-muted-foreground">Complete seus dados de contato.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome completo *</Label>
                <Input
                  id="name"
                  className="h-12 text-base"
                  value={displayName}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  minLength={2}
                  maxLength={100}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="onboarding-phone">WhatsApp / Celular *</Label>
                <Input id="onboarding-phone" type="tel" inputMode="tel" autoComplete="tel-national" className="h-12 text-base" value={displayPhone} onChange={(event) => setPhone(formatBrazilianMobile(event.target.value))} placeholder="(31) 99999-9999" maxLength={15} required />
              </div>
              <Button className="h-12 w-full text-base" disabled={saving} onClick={saveIdentityStep}>
                {saving ? "Salvando..." : "Continuar"}
              </Button>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <h1 className="font-display text-2xl font-bold">Como você usa a moto?</h1>
                <p className="mt-1 text-sm text-muted-foreground">Escolha uma ou mais opções.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {USAGE_TYPES.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => toggleUsage(u)}
                    className={cn(
                      "min-h-11 rounded-full px-4 py-2.5 text-sm font-medium transition",
                      usage.includes(u) ? "bg-accent text-accent-foreground" : "glass-soft text-muted-foreground",
                    )}
                  >
                    {u}
                  </button>
                ))}
              </div>
              <div className="glass-soft flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Uso a moto para gerar renda</p>
                  <p className="text-xs text-muted-foreground">Libera jornada de trabalho e lucro por hora.</p>
                </div>
                <Switch checked={pro} onCheckedChange={setPro} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="h-12 flex-1" onClick={() => setStep(0)}>
                  Voltar
                </Button>
                <Button className="h-12 flex-1 text-base" disabled={saving} onClick={saveUsageStep}>
                  {saving ? "Salvando..." : "Continuar"}
                </Button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div>
                <h1 className="font-display text-2xl font-bold">Sua moto</h1>
                <p className="mt-1 text-sm text-muted-foreground">Você pode cadastrar outras depois.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  className="h-12 text-base"
                  value={moto.brand}
                  onChange={(e) => setMoto({ ...moto, brand: e.target.value })}
                  placeholder="Honda"
                  minLength={2}
                  maxLength={80}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="model">Modelo</Label>
                <Input
                  id="model"
                  className="h-12 text-base"
                  value={moto.model}
                  onChange={(e) => setMoto({ ...moto, model: e.target.value })}
                  placeholder="CG 160"
                  minLength={2}
                  maxLength={80}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="year">Ano</Label>
                  <Input
                    id="year"
                    type="number"
                    inputMode="numeric"
                    className="h-12 text-base"
                    value={moto.year}
                    onChange={(e) => setMoto({ ...moto, year: e.target.value })}
                    min={1900}
                    max={new Date().getFullYear() + 1}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="plate">Placa</Label>
                  <Input
                    id="plate"
                    className="h-12 text-base"
                    value={moto.plate}
                    onChange={(e) => setMoto({ ...moto, plate: e.target.value })}
                    maxLength={8}
                    autoCapitalize="characters"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="km">Quilometragem atual</Label>
                <Input
                  id="km"
                  type="number"
                  inputMode="decimal"
                  className="h-12 text-base"
                  value={moto.km}
                  onChange={(e) => setMoto({ ...moto, km: e.target.value })}
                  placeholder="32500"
                  min={0}
                  step="0.1"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="h-12 flex-1" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button
                  className="h-12 flex-1 text-base"
                  disabled={saving}
                  onClick={finish}
                >
                  {saving ? "Salvando..." : "Concluir"}
                </Button>
              </div>
            </div>
          ) : null}
        </GlassCard>
      </div>
    </div>
  );
}
