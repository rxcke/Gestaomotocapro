import { supabase } from "@/integrations/supabase/client";
import type { SubscriptionAccess } from "@/lib/subscription.functions";

const NO_ACCESS: SubscriptionAccess = {
  active: false,
  trial: false,
  admin: false,
  ambassador: false,
  hasAppAccess: false,
  subscription: null,
};

export async function fetchSubscriptionAccessWhenAuthenticated(
  fetchAccess: () => Promise<SubscriptionAccess>,
): Promise<SubscriptionAccess> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) return NO_ACCESS;
  try {
    return await fetchAccess();
  } catch (requestError) {
    const message = requestError instanceof Error ? requestError.message : "";
    if (message.includes("Unauthorized") || message.includes("authorization header")) {
      return NO_ACCESS;
    }
    throw requestError;
  }
}