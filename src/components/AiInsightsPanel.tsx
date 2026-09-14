import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BrainCircuit, Fuel, Gauge, RefreshCw, Wrench } from "lucide-react";
import { CardHeading, GlassCard } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/app-context";
import { generateAiInsights } from "@/lib/ai-insights.functions";
import { cn } from "@/lib/utils";

const icons = { fuel: Fuel, maintenance: Wrench, cost: Gauge };
const labels = { fuel: "Combustível", maintenance: "Manutenção", cost: "Custo por km" };

export function AiInsightsPanel() {
  const { motoId } = useApp();
  const generate = useServerFn(generateAiInsights);
  const analysis = useMutation({
    mutationFn: () => generate({ data: { motorcycleId: motoId === "all" ? null : motoId } }),
  });

  return (
    <GlassCard>
      <CardHeading
        title={<span className="flex items-center gap-2"><BrainCircuit className="size-4 text-accent" /> Insights com IA</span>}
        action={analysis.data ? (
          <Button variant="ghost" size="icon" aria-label="Atualizar insights" onClick={() => analysis.mutate()} disabled={analysis.isPending}>
            <RefreshCw className={cn("size-4", analysis.isPending && "animate-spin")} />
          </Button>
        ) : undefined}
      />

      {analysis.isPending ? (
        <div className="mt-5 space-y-3" aria-live="polite">
          {[0, 1, 2].map((item) => <div key={item} className="glass-soft h-24 animate-pulse" />)}
        </div>
      ) : analysis.isError ? (
        <div className="mt-5 glass-soft p-4">
          <p className="text-sm text-negative">{analysis.error.message}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => analysis.mutate()}>Tentar novamente</Button>
        </div>
      ) : analysis.data ? (
        <div className="mt-5">
          <p className="text-sm text-muted-foreground">{analysis.data.summary}</p>
          {analysis.data.insights.length ? (
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {analysis.data.insights.map((insight) => {
                const Icon = icons[insight.type];
                return (
                  <article key={`${insight.type}-${insight.title}`} className="glass-soft min-w-0 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Icon className="size-4 text-accent" />{labels[insight.type]}</span>
                      <span className={cn("size-2 rounded-full", insight.priority === "high" ? "bg-negative" : insight.priority === "medium" ? "bg-warning" : "bg-positive")} aria-label={`Prioridade ${insight.priority}`} />
                    </div>
                    <h3 className="mt-3 font-display font-bold">{insight.title}</h3>
                    <p className="mt-2 text-xs text-muted-foreground">{insight.evidence}</p>
                    <p className="mt-3 text-sm font-medium">{insight.recommendation}</p>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Registre dois abastecimentos ou uma despesa para liberar recomendações personalizadas.</p>
          )}
        </div>
      ) : (
        <div className="mt-5 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm text-muted-foreground">Analise consumo, manutenções pendentes e custo por km usando apenas seus registros reais.</p>
          <Button onClick={() => analysis.mutate()}><BrainCircuit className="mr-2 size-4" />Gerar insights</Button>
        </div>
      )}
    </GlassCard>
  );
}