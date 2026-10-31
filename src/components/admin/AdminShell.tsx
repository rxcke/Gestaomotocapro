import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, CreditCard, Gift, LayoutDashboard, Megaphone, ShieldCheck, Users, Wallet, type LucideIcon } from "lucide-react";
import { AmbientBackground } from "@/components/glass";
import { cn } from "@/lib/utils";

function navClass(active: boolean, orientation: "side" | "top") {
  return cn(
    "flex items-center gap-2 rounded-md text-sm font-medium transition-colors",
    orientation === "side" ? "px-3 py-2.5" : "shrink-0 whitespace-nowrap px-3 py-2",
    active ? "text-accent" : "text-muted-foreground hover:text-foreground",
  );
}

function NavItems({ orientation }: { orientation: "side" | "top" }) {
  const pathname = useRouterState({ select: (router) => router.location.pathname });
  const item = (to: string, label: string, Icon: LucideIcon, exact = false) => {
    const active = exact ? pathname === to : pathname.startsWith(to);
    return { to, label, Icon, active };
  };
  const items = [
    item("/admin", "Visão geral", LayoutDashboard, true),
    item("/admin/usuarios", "Usuários", Users),
    item("/admin/assinaturas", "Assinaturas", CreditCard),
    item("/admin/financeiro", "Financeiro", Wallet),
    item("/admin/recompensas", "Clube de Recompensas", Gift),
    item("/admin/embaixadores", "Embaixadores", Megaphone),
    item("/admin/webhooks", "Webhooks", ShieldCheck),
  ];
  return (
    <>
      {items.map(({ to, label, Icon, active }) => (
        <Link
          key={to}
          to={to}
          aria-current={active ? "page" : undefined}
          className={navClass(active, orientation)}
        >
          <Icon className="size-4 shrink-0" />
          <span>{label}</span>
        </Link>
      ))}
    </>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-canvas text-foreground">
      <AmbientBackground />
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r border-border bg-canvas/80 backdrop-blur lg:flex">
        <div className="border-b border-border px-5 py-5">
          <p className="font-display text-lg font-extrabold leading-tight">Central de<br />Administração</p>
          <p className="mt-1 text-xs text-muted-foreground">Gestão Motoca Pro</p>
        </div>
        <nav aria-label="Módulos da administração" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <NavItems orientation="side" />
        </nav>
        <div className="border-t border-border px-3 py-4">
          <Link to="/app" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-4" />Voltar ao painel
          </Link>
        </div>
      </aside>
      <div className="relative lg:pl-60">
        <header className="sticky top-0 z-10 border-b border-border bg-canvas/85 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="font-display text-base font-extrabold">Administração</p>
            <Link to="/app" className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowLeft className="size-3.5" />Painel
            </Link>
          </div>
          <nav aria-label="Módulos da administração" className="flex gap-1 overflow-x-auto px-3 pb-2">
            <NavItems orientation="top" />
          </nav>
        </header>
        <main className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
