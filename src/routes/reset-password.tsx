import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AmbientBackground, GlassCard } from "@/components/glass";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Redefinir senha — Gestão Motoboy" },
      { name: "description", content: "Defina uma nova senha para sua conta Gestão Motoboy." },
      { property: "og:title", content: "Redefinir senha — Gestão Motoboy" },
      { property: "og:description", content: "Defina uma nova senha para sua conta Gestão Motoboy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password"));
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Senha atualizada!");
    navigate({ to: "/app", replace: true });
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-canvas px-5 text-foreground">
      <AmbientBackground />
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <GlassCard>
          <h1 className="font-display text-2xl font-bold">Nova senha</h1>
          <form className="mt-5 space-y-4" onSubmit={submit}>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" minLength={6} required className="h-12 text-base" />
            </div>
            <Button type="submit" className="h-12 w-full text-base" disabled={loading}>
              {loading ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
