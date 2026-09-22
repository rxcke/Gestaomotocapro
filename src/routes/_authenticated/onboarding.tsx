import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AmbientBackground, GlassCard, LoadingBlock } from "@/components/glass";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { USAGE_TYPES } from "@/lib/constants";
import { useProfile, useUpdateProfile, useUpsert } from "@/lib/data";
import { cn } from "@/lib/utils";
import { getSubscriptionAccess } from "@/lib/subscription.functions";
import { fetchSubscriptionAccessWhenAuthenticated } from "@/lib/subscription-access";

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
  const navigate = useNavigate();
  const profile = useProfile();
  const updateProfile = useUpdateProfile("");
  const createMoto = useUpsert("motorcycles", "motorcycles", {});
  const fetchAccess = useServerFn(getSubscriptionAccess);
  const access = useQuery({ queryKey: ["subscription", "access"], queryFn: () => fetchSubscriptionAccessWhenAuthenticated(fetchAccess) });

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [usage, setUsage] = useState<string[]>([]);
  const [pro, setPro] = useState(false);
  const [moto, setMoto] = useState({ brand: "", model: "", year: "", plate: "", km: "" });
  const [saving, setSaving] = useState(false);

  const displayName = name || profile.data?.name || "";

  const blocked = access.isSuccess && !access.data.active && !access.data.admin;
  useEffect(() => {
    if (blocked) navigate({ to: "/planos", replace: true });
  }, [blocked, navigate]);

  if (access.isLoading) {
    return <div className="flex min-h-dvh items-center justify-center bg-canvas p-6"><LoadingBlock label="Verificando sua assinatura..." /></div>;
  }

  if (blocked) return null;

  const toggleUsage = (u: string) =>
    setUsage((prev) => (prev.includes(u) ? prev.filter((x) => x !== u) : [...prev, u]));

  const finish = async () => {
    setSaving(true);
    try {
      await createMoto.mutateAsync({
        brand: moto.brand,
        model: moto.model,
        year: moto.year ? Number(moto.year) : null,
        plate: moto.plate || null,
        current_km: Number(moto.km || 0),
      });
      await updateProfile.mutateAsync({
        name: displayName,
        usage_types: usage,
        is_professional: pro,
        onboarding_completed: true,
      });
      navigate({ to: "/app", replace: true });
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
                <p className="mt-1 text-sm text-muted-foreground">Como podemos te chamar?</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">Seu nome</Label>
                <Input
                  id="name"
                  className="h-12 text-base"
                  value={displayName}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: Lucas"
                />
              </div>
              <Button className="h-12 w-full text-base" disabled={!displayName} onClick={() => setStep(1)}>
                Continuar
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
                      "rounded-full px-4 py-2 text-sm font-medium transition",
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
                <Button className="h-12 flex-1 text-base" onClick={() => setStep(2)}>
                  Continuar
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
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="plate">Placa</Label>
                  <Input
                    id="plate"
                    className="h-12 text-base"
                    value={moto.plate}
                    onChange={(e) => setMoto({ ...moto, plate: e.target.value })}
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
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="h-12 flex-1" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button
                  className="h-12 flex-1 text-base"
                  disabled={!moto.brand || !moto.model || saving}
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
