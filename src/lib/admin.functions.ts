import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type AdminOwner = {
  name: string | null;
  email: string | null;
};

export type AdminData = {
  subscriptions: Array<{
    id: string;
    user_id: string;
    email: string;
    plan: "monthly" | "annual";
    status: "pending" | "active" | "canceled" | "expired" | "refunded" | "chargeback";
    kiwify_transaction_id: string | null;
    started_at: string | null;
    expires_at: string | null;
    created_at: string;
  }>;
  webhookEvents: Array<{
    id: string;
    event_type: string;
    transaction_id: string | null;
    processed: boolean;
    error_message: string | null;
    created_at: string;
  }>;
  motorcycles: Array<{
    id: string;
    user_id: string;
    brand: string;
    model: string;
    year: number | null;
    plate: string | null;
    current_km: number;
    created_at: string;
  }>;
  incomes: Array<{
    id: string;
    user_id: string;
    motorcycle_id: string | null;
    category: string;
    amount: number;
    date: string;
    description: string | null;
  }>;
  expenses: Array<{
    id: string;
    user_id: string;
    motorcycle_id: string | null;
    category: string;
    group_name: string;
    amount: number;
    date: string;
    description: string | null;
  }>;
  fuelRecords: Array<{
    id: string;
    user_id: string;
    motorcycle_id: string | null;
    date: string;
    km: number;
    liters: number;
    price_per_liter: number;
    total: number;
    station: string | null;
  }>;
  owners: Record<string, AdminOwner>;
};

export const getAdminData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminData> => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });

    if (roleError || !isAdmin) throw new Error("Acesso administrativo não autorizado.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [motorcyclesResult, incomesResult, expensesResult, fuelResult, profilesResult, subscriptionsResult, eventsResult] =
      await Promise.all([
        supabaseAdmin
          .from("motorcycles")
          .select("id,user_id,brand,model,year,plate,current_km,created_at")
          .order("created_at", { ascending: false })
          .limit(500),
        supabaseAdmin
          .from("incomes")
          .select("id,user_id,motorcycle_id,category,amount,date,description")
          .order("date", { ascending: false })
          .limit(500),
        supabaseAdmin
          .from("expenses")
          .select("id,user_id,motorcycle_id,category,group_name,amount,date,description")
          .order("date", { ascending: false })
          .limit(500),
        supabaseAdmin
          .from("fuel_records")
          .select("id,user_id,motorcycle_id,date,km,liters,price_per_liter,total,station")
          .order("date", { ascending: false })
          .limit(500),
        supabaseAdmin.from("profiles").select("id,name,email").limit(500),
        supabaseAdmin.from("subscriptions").select("id,user_id,email,plan,status,kiwify_transaction_id,started_at,expires_at,created_at").order("created_at", { ascending: false }).limit(500),
        supabaseAdmin.from("webhook_events").select("id,event_type,transaction_id,processed,error_message,created_at").order("created_at", { ascending: false }).limit(100),
      ]);

    const error =
      motorcyclesResult.error ??
      incomesResult.error ??
      expensesResult.error ??
      fuelResult.error ??
      profilesResult.error ??
      subscriptionsResult.error ??
      eventsResult.error;
    if (error) throw new Error("Não foi possível carregar os dados administrativos.");

    const owners = Object.fromEntries(
      (profilesResult.data ?? []).map((profile) => [
        profile.id,
        { name: profile.name, email: profile.email },
      ]),
    );

    return {
      motorcycles: motorcyclesResult.data ?? [],
      incomes: incomesResult.data ?? [],
      expenses: expensesResult.data ?? [],
      fuelRecords: fuelResult.data ?? [],
      subscriptions: subscriptionsResult.data ?? [],
      webhookEvents: eventsResult.data ?? [],
      owners,
    };
  });