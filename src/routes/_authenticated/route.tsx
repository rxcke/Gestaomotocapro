import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      const intendedPath = `${location.pathname}${location.searchStr}${location.hash}`;
      if (typeof window !== "undefined" && intendedPath.startsWith("/") && !intendedPath.startsWith("//")) {
        window.sessionStorage.setItem("auth:returnTo", intendedPath);
      }
      throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
