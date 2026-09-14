import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bike,
  Home,
  Moon,
  Sun,
  User,
  Wallet,
  Wrench,
  Timer,
  BarChart3,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Logo } from "./Logo";
import { AmbientBackground } from "./glass";
import { useApp, ALL_MOTOS } from "@/lib/app-context";
import { useProfile } from "@/lib/data";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { km as fmtKm } from "@/lib/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/app", label: "Início", icon: Home, exact: true },
  { to: "/app/dinheiro", label: "Dinheiro", icon: Wallet, exact: false },
  { to: "/app/moto", label: "Minha Moto", icon: Bike, exact: false },
  { to: "/app/manutencao", label: "Manutenção", icon: Wrench, exact: false },
  { to: "/app/perfil", label: "Perfil", icon: User, exact: false },
] as const;


export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const profile = useProfile();
  const isPro = profile.data?.is_professional ?? false;

  const items = [...NAV];
  const extra = [
    ...(isPro ? [{ to: "/app/jornada", label: "Jornada", icon: Timer, exact: false }] : []),
    { to: "/app/relatorios", label: "Relatórios", icon: BarChart3, exact: false },
  ];

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <div className="relative min-h-dvh w-full bg-canvas text-foreground">
      <AmbientBackground />
      <div className="relative mx-auto flex min-h-dvh max-w-7xl">
        <aside className="hidden w-64 shrink-0 flex-col gap-6 p-6 lg:flex">
          <Link to="/app">
            <Logo />
          </Link>
          <nav className="flex flex-col gap-1">
            {[...items, ...extra].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                  isActive(item.to, item.exact)
                    ? "glass-soft font-semibold text-foreground"
                    : "text-muted-foreground hover:bg-glass hover:text-foreground",
                )}

              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            ))}
          </nav>
          <SidebarFooter />
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 pb-28 sm:px-6 lg:px-10 lg:py-8 lg:pb-10">
          <TopBar />
          {children}
        </main>
      </div>

      <nav className="glass-soft fixed inset-x-0 bottom-0 z-20 rounded-none border-x-0 border-b-0 lg:hidden">
        <div
          className="grid grid-cols-5 px-1 py-1.5"
          style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
        >
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium",
                isActive(item.to, item.exact) ? "text-accent" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

function SidebarFooter() {
  const profile = useProfile();
  const initials = (profile.data?.name ?? "Piloto")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="glass-soft mt-auto flex items-center gap-3 p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold">
        {initials || "P"}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{profile.data?.name ?? "Piloto"}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {profile.data?.is_professional ? "Motociclista profissional" : "Uso pessoal"}
        </p>
      </div>
    </div>
  );
}

function TopBar() {
  const { motorcycles, motoId, setMotoId, activeMoto } = useApp();
  const profile = useProfile();
  const { theme, toggle } = useTheme();

  return (
    <header className="mb-6 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground">
          Olá, {profile.data?.name?.split(" ")[0] ?? "piloto"} 👋
        </p>
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
          {motorcycles.length > 1 ? (
            <Select value={motoId} onValueChange={setMotoId}>
              <SelectTrigger className="glass-soft h-9 w-auto gap-2 border-0 font-display text-sm font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_MOTOS}>Todas as motos</SelectItem>
                {motorcycles.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.brand} {m.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <h2 className="truncate font-display text-lg font-bold">
              {activeMoto ? `${activeMoto.brand} ${activeMoto.model}` : "Sua moto"}
            </h2>
          )}
          {activeMoto ? (
            <span className="glass-soft rounded-full px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
              {fmtKm(activeMoto.current_km)}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="glass-soft size-10"
          onClick={toggle}
          aria-label="Alternar tema"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        <SignOutButton />
      </div>
    </header>
  );
}

export function SignOutButton({ full = false }: { full?: boolean }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);

  const signOut = async () => {
    setLoading(true);
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (full) {
    return (
      <Button variant="outline" className="w-full" onClick={signOut} disabled={loading}>
        <LogOut className="mr-2 size-4" /> Sair da conta
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="glass-soft size-10"
      onClick={signOut}
      disabled={loading}
      aria-label="Sair"
    >
      <LogOut className="size-4" />
    </Button>
  );
}
