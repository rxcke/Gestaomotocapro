type AuthenticatedClient = {
  rpc: (name: "has_active_subscription", args: { _user_id: string }) => PromiseLike<{
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
  if (!(await hasActiveSubscription(supabase, userId))) {
    throw new Error("Esse recurso faz parte do plano premium.");
  }
}
