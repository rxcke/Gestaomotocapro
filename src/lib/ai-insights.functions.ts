import { createServerFn } from "@tanstack/react-start";
import { Output, NoObjectGeneratedError, streamText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { KM_ALERT_THRESHOLD, DAYS_ALERT_THRESHOLD } from "./constants";
import { requireActiveSubscription } from "./subscription-access.server";

const InputSchema = z.object({ motorcycleId: z.string().nullable() });

const InsightSchema = z.object({
  summary: z.string(),
  insights: z.array(
    z.object({
      type: z.enum(["fuel", "maintenance", "cost"]),
      priority: z.enum(["high", "medium", "low"]),
      title: z.string(),
      evidence: z.string(),
      recommendation: z.string(),
    }),
  ),
});

type GatewayError = Error & { statusCode?: number; status?: number; responseBody?: string };

function monthBounds(offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}

function messageForGatewayError(error: unknown) {
  const gatewayError = error as GatewayError;
  const status = gatewayError.statusCode ?? gatewayError.status;
  if (status === 402) return "Os créditos de IA acabaram. O proprietário pode adicionar créditos em Planos e créditos.";
  if (status === 403) return "A análise com IA está indisponível pelas regras do espaço de trabalho.";
  if (status === 429) return "A IA está recebendo muitas solicitações. Aguarde um pouco e tente novamente.";
  if (status === 401) return "A análise com IA ainda não está configurada corretamente.";
  if (status != null && status >= 500) return "A IA está temporariamente indisponível. Tente novamente em instantes.";
  return gatewayError.message || "Não foi possível gerar os insights.";
}

export const generateAiInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireActiveSubscription(context.supabase, context.userId);
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("A análise com IA ainda não está configurada corretamente.");

    const selectedMoto = data.motorcycleId;
    const scope = <T extends { eq: (column: string, value: string) => T }>(query: T) =>
      selectedMoto ? query.eq("motorcycle_id", selectedMoto) : query;

    const current = monthBounds();
    const previous = monthBounds(-1);
    const [motosResult, fuelsResult, maintenanceResult, expensesResult] = await Promise.all([
      context.supabase.from("motorcycles").select("id, brand, model, current_km"),
      scope(context.supabase.from("fuel_records").select("motorcycle_id, date, km, liters, price_per_liter, total")).order("km"),
      scope(context.supabase.from("maintenance_records").select("motorcycle_id, category, next_km, next_date")).order("date", { ascending: false }),
      scope(context.supabase.from("expenses").select("motorcycle_id, date, category, group_name, amount")).gte("date", previous.start).lte("date", current.end),
    ]);

    const firstError = [motosResult.error, fuelsResult.error, maintenanceResult.error, expensesResult.error].find(Boolean);
    if (firstError) throw new Error(firstError.message);

    const motos = motosResult.data ?? [];
    const fuels = fuelsResult.data ?? [];
    const maintenance = maintenanceResult.data ?? [];
    const expenses = expensesResult.data ?? [];
    const currentKm = Math.max(
      0,
      ...motos.filter((m) => !selectedMoto || m.id === selectedMoto).map((m) => Number(m.current_km)),
      ...fuels.flatMap((fuel) => fuel.km == null ? [] : [Number(fuel.km)]),
    );

    let distance = 0;
    let measuredLiters = 0;
    let measuredFuelCost = 0;
    const validFuels = fuels.filter((fuel) => fuel.km != null && fuel.liters != null);
    const sortedFuels = [...validFuels].sort((a, b) => Number(a.km) - Number(b.km));
    for (let index = 1; index < sortedFuels.length; index += 1) {
      const previousFuel = sortedFuels[index - 1];
      const fuel = sortedFuels[index];
      if (!previousFuel || !fuel || previousFuel.motorcycle_id !== fuel.motorcycle_id) continue;
      const interval = Number(fuel.km) - Number(previousFuel.km);
      if (interval > 0 && Number(fuel.liters) > 0) {
        distance += interval;
        measuredLiters += Number(fuel.liters);
        measuredFuelCost += Number(fuel.total);
      }
    }

    const currentExpenses = expenses.filter((expense) => expense.date >= current.start && expense.date <= current.end);
    const previousExpenses = expenses.filter((expense) => expense.date >= previous.start && expense.date <= previous.end);
    const total = (rows: typeof expenses) => rows.reduce((sum, row) => sum + Number(row.amount), 0);
    const motorcycleCost = total(currentExpenses.filter((expense) => expense.group_name === "Moto"));
    const categoryTotals = Object.entries(
      currentExpenses.reduce<Record<string, number>>((acc, expense) => {
        acc[expense.category] = (acc[expense.category] ?? 0) + Number(expense.amount);
        return acc;
      }, {}),
    ).sort((a, b) => b[1] - a[1]);

    const today = Date.now();
    const maintenanceDue = maintenance.map((record) => {
      const kmLeft = record.next_km == null ? null : Number(record.next_km) - currentKm;
      const daysLeft = record.next_date
        ? Math.ceil((new Date(`${record.next_date}T12:00:00`).getTime() - today) / 86400000)
        : null;
      const late = (kmLeft != null && kmLeft <= 0) || (daysLeft != null && daysLeft < 0);
      const soon = !late && ((kmLeft != null && kmLeft <= KM_ALERT_THRESHOLD) || (daysLeft != null && daysLeft <= DAYS_ALERT_THRESHOLD));
      return { category: record.category, kmLeft, daysLeft, status: late ? "late" : soon ? "soon" : "ok" };
    }).filter((record) => record.status !== "ok");

    const payload = {
      motorcycle: selectedMoto
        ? motos.find((m) => m.id === selectedMoto) ?? null
        : { fleetSize: motos.length, currentKm },
      fuel: {
        records: fuels.length,
        measuredIntervals: distance > 0 ? sortedFuels.length - 1 : 0,
        averageKmPerLiter: measuredLiters > 0 ? distance / measuredLiters : null,
        fuelCostPerKm: distance > 0 ? measuredFuelCost / distance : null,
        averageLiterPrice: (() => {
          const prices = fuels.flatMap((fuel) => fuel.price_per_liter == null ? [] : [Number(fuel.price_per_liter)]);
          return prices.length ? prices.reduce((sum, price) => sum + price, 0) / prices.length : null;
        })(),
      },
      cost: {
        monthMotorcycleExpenses: motorcycleCost,
        previousMonthExpenses: total(previousExpenses.filter((expense) => expense.group_name === "Moto")),
        distanceMeasuredKm: distance,
        realCostPerKm: distance > 0 ? motorcycleCost / distance : null,
        largestCategories: categoryTotals.slice(0, 3),
      },
      maintenanceDue,
    };

    if (fuels.length < 2 && currentExpenses.length === 0 && maintenanceDue.length === 0) {
      return {
        summary: "Ainda faltam dados para uma análise confiável.",
        insights: [],
      };
    }

    try {
      const { createInsightsModel } = await import("./ai-gateway.server");
      const result = streamText({
        model: createInsightsModel(apiKey),
        maxRetries: 2,
        output: Output.object({ schema: InsightSchema }),
        system: "Você é o analista financeiro do Gestão Motoca Pro. Escreva em português do Brasil, de forma direta, responsável e sem inventar dados. Trate as manutenções marcadas como late/soon como fatos calculados pelo sistema. Não dê diagnóstico mecânico. Valores monetários devem usar R$ e vírgula decimal.",
        prompt: `Analise este resumo real: ${JSON.stringify(payload)}. Gere no máximo 3 insights, priorizando combustível, manutenção e custo por km. Só mencione economia quantificada quando os dados sustentarem o cálculo; caso contrário, recomende o próximo registro necessário. A evidência deve citar números do resumo e a recomendação deve ser uma ação curta.`,
        providerOptions: {
          openai: {
            forceReasoning: true,
            reasoningEffort: "medium",
            reasoningSummary: "auto",
            store: false,
            include: ["reasoning.encrypted_content"],
          },
        },
      });
      return await result.output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("A IA não conseguiu organizar os insights. Tente gerar novamente.");
      }
      throw new Error(messageForGatewayError(error));
    }
  });