type AuthenticatedClient = {
  rpc: (
    name: "has_active_subscription" | "has_app_access",
    args: { _user_id: string },
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
  const access = await supabase.rpc("has_app_access", { _user_id: userId });
  if (access.error) {
    throw new Error("Não foi possível validar seu acesso.");
  }
  if (!access.data) {
    throw new Error("Esse recurso faz parte do plano premium.");
  }
}
