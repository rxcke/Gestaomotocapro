import type { ReactNode } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ADMIN_PAGE_SIZE } from "@/lib/admin-view";

export function AdminError({ title = "Não foi possível carregar este módulo" }: { title?: string }) {
  const router = useRouter();
  return (
    <div role="alert" className="space-y-4 py-12 text-center">
      <h1 className="font-display text-xl font-bold">{title}</h1>
      <p className="text-sm text-muted-foreground">Tente novamente em instantes.</p>
      <Button variant="outline" onClick={() => void router.invalidate()}>
        <RefreshCw className="size-4" />Tentar novamente
      </Button>
    </div>
  );
}

export function AdminEmpty({ label, action }: { label: string; action?: ReactNode }) {
  return (
    <div className="border-y border-border py-12 text-center">
      <Inbox className="mx-auto mb-3 size-8 text-accent" />
      <p className="text-sm text-muted-foreground">{label}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function AdminPagination({ page, total }: { page: number; total: number }) {
  const pages = Math.ceil(total / ADMIN_PAGE_SIZE);
  if (pages <= 1) return null;
  return (
    <nav aria-label="Paginação" className="flex items-center justify-between gap-3 py-4">
      <Button variant="outline" size="icon" aria-label="Página anterior" disabled={page === 1} asChild={page > 1}>
        {page > 1 ? (
          <Link to="." search={(prev) => ({ ...prev, page: page - 1 })}><ArrowLeft className="size-4" /></Link>
        ) : (
          <ArrowLeft className="size-4" />
        )}
      </Button>
      <span className="text-xs text-muted-foreground">Página {page} de {pages} · {total} registros</span>
      <Button variant="outline" size="icon" aria-label="Próxima página" disabled={page >= pages} asChild={page < pages}>
        {page < pages ? (
          <Link to="." search={(prev) => ({ ...prev, page: page + 1 })}><ArrowRight className="size-4" /></Link>
        ) : (
          <ArrowRight className="size-4" />
        )}
      </Button>
    </nav>
  );
}
