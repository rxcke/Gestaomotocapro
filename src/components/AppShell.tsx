import { useEffect, useState, type ReactNode } from "react";
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
  ShieldCheck,
  MoreHorizontal,
  Target,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Logo } from "./Logo";
import { AmbientBackground } from "./glass";
import { useApp, ALL_MOTOS } from "@/lib/app-context";
import { useAccess } from "@/lib/use-access";
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
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { authErrorMessage } from "@/lib/auth-errors";

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
  const access = useAccess();
  const isPro = (profile.data?.is_professional ?? false) || Boolean(access.data?.demo || access.data?.demoExpired);

  const jornada = { to: "/app/jornada", label: "Jornada", icon: Timer, exact: false };
  const relatorios = { to: "/app/relatorios", label: "Relatórios", icon: BarChart3, exact: false };
  const navGroups = [
    { label: "", items: [NAV[0]] },
    { label: "Seu corre", items: [...(isPro ? [jornada] : []), NAV[1]] },
    { label: "Sua moto", items: [NAV[2], NAV[3]] },
    { label: "Seu resultado", items: [relatorios] },
    { label: "Conta", items: [NAV[4]] },
  ];

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  const mobileNav = [NAV[0], isPro ? jornada : NAV[1], isPro ? NAV[1] : NAV[2], relatorios];
  const moreGroups = [
    { label: "Sua moto", items: isPro ? [NAV[2], NAV[3]] : [NAV[3]] },
    { label: "Seu resultado", items: [{ to: "/app/metas", label: "Metas", icon: Target, exact: false }] },
    { label: "Conta", items: [NAV[4]] },
  ];
  const moreActive = moreGroups.some((g) => g.items.some((item) => isActive(item.to, false)));

  return (
    <div className="relative min-h-dvh w-full bg-canvas text-foreground">
      <AmbientBackground />
      <div className="relative mx-auto flex min-h-dvh max-w-7xl">
        <aside className="hidden w-64 shrink-0 flex-col gap-6 p-6 lg:flex">
          <Link to="/app">
            <Logo />
          </Link>
          <nav className="flex flex-col gap-1">
            {navGroups.map((group) => (
              <div key={group.label || "home"} className="flex flex-col gap-1">
                {group.label ? (
                  <p className="px-4 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                    {group.label}
                  </p>
                ) : null}
                {group.items.map((item) => {
                  const active = isActive(item.to, item.exact);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                        active
                          ? "bg-accent/10 font-semibold text-foreground"
                          : "text-muted-foreground hover:bg-glass hover:text-foreground",
                      )}
                    >
                      <item.icon className={cn("size-4 shrink-0", active && "text-accent")} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
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
          {mobileNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition active:scale-95",
                isActive(item.to, item.exact) ? "text-accent" : "text-muted-foreground",
                isActive(item.to, item.exact) && "font-bold",
              )}
            >
              <item.icon className="size-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition active:scale-95",
                  moreActive ? "text-accent" : "text-muted-foreground",
                )}
              >
                <MoreHorizontal className="size-5" />
                <span>Mais</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <SheetHeader><SheetTitle>Mais opções</SheetTitle></SheetHeader>
              <div className="mt-2 space-y-3">
                {moreGroups.map((group) => (
                  <div key={group.label}>
                    <p className="px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">{group.label}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {group.items.map((item) => (
                        <SheetClose asChild key={item.to}>
                          <Link
                            to={item.to}
                            className={cn(
                              "flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition active:scale-[0.98]",
                              isActive(item.to, false) ? "bg-accent/10 font-semibold text-foreground" : "bg-muted/50 text-foreground",
                            )}
                          >
                            <item.icon className={cn("size-5 shrink-0", isActive(item.to, false) && "text-accent")} />
                            {item.label}
                          </Link>
                        </SheetClose>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </div>
  );
}

function SidebarFooter() {
  const profile = useProfile();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: allowed } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
      setIsAdmin(Boolean(allowed));
    });
  }, []);
  const initials = (profile.data?.name ?? "Piloto")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="mt-auto space-y-2">
      {isAdmin ? <Button asChild variant="outline" className="w-full justify-start"><Link to="/admin"><ShieldCheck className="mr-2 size-4" />Administração</Link></Button> : null}
      <div className="glass-soft flex items-center gap-3 p-3">
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
    </div>
  );
}

/** Moto selecionada e km atual — mesma seleção usada em todo o app. */
export function MotoContext({ subtle = false }: { subtle?: boolean }) {
  const { motorcycles, motoId, setMotoId, activeMoto } = useApp();
  if (subtle && motorcycles.length === 0) return null;
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {motorcycles.length > 1 ? (
        <Select value={motoId} onValueChange={setMotoId}>
          <SelectTrigger className={cn("glass-soft h-9 w-auto gap-2 border-0 font-display font-bold", subtle ? "text-xs" : "text-sm")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_MOTOS}>Todas as motos</SelectItem>
            {motorcycles.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.brand} {m.model}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : subtle ? (
        <span className="truncate text-sm font-semibold text-muted-foreground">🏍️ {activeMoto ? `${activeMoto.brand} ${activeMoto.model}` : "Sua moto"}</span>
      ) : (
        <h2 className="truncate font-display text-lg font-bold">{activeMoto ? `${activeMoto.brand} ${activeMoto.model}` : "Sua moto"}</h2>
      )}
      {activeMoto ? (
        <span className={cn("rounded-full text-xs font-semibold text-muted-foreground", subtle ? "" : "glass-soft px-2.5 py-0.5")}>{subtle ? "· " : ""}{fmtKm(activeMoto.current_km)}</span>
      ) : null}
    </div>
  );
}

function TopBar() {
  const profile = useProfile();
  const { theme, toggle } = useTheme();
  const pathname = useRouterState({ select: (st) => st.location.pathname });
  const isHome = pathname === "/app" || pathname === "/app/";

  return (
    <header className="mb-6 flex items-start justify-between gap-3">
      {isHome ? <div className="min-w-0" /> : (
      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground">
          Olá, {profile.data?.name?.split(" ")[0] ?? "piloto"} 👋
        </p>
        <div className="mt-1"><MotoContext /></div>
      </div>
      )}
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
    try {
      await qc.cancelQueries();
      qc.clear();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await navigate({ to: "/auth", replace: true });
    } catch (error) {
      toast.error(authErrorMessage(error, "Não foi possível sair da conta. Tente novamente."));
      void qc.invalidateQueries();
    } finally {
      setLoading(false);
    }
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
