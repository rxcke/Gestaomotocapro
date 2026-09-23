type AuthenticatedClient = {
  rpc: (
    name: "has_active_subscription" | "has_role",
    args: { _user_id: string; _role?: "admin" },
  ) => PromiseLike<{
    data: boolean | null;
    error: { message: string } | null;
  }>;
};

export async function hasActiveSubscription(supabase: AuthenticatedClient, userId: string) {
  const { data, error } = await supabase.rpc("has_active_subscription", { _user_id: userId });
  if (error) throw new Error("Não foi possível validar sua assinatura.");
  return Boolean(data);
}

export async function requireActiveSubscription(supabase: AuthenticatedClient, userId: string) {
  const [subscriptionResult, adminResult] = await Promise.all([
    supabase.rpc("has_active_subscription", { _user_id: userId }),
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
  ]);
  if (subscriptionResult.error || adminResult.error) {
    throw new Error("Não foi possível validar seu acesso.");
  }
  if (!subscriptionResult.data && !adminResult.data) {
    throw new Error("Esse recurso faz parte do plano premium.");
  }
}
