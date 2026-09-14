import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/app/moto")({
  component: MotoLayout,
});

function MotoLayout() {
  return <Outlet />;
}