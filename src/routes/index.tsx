import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/LandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gestão Motoca Pro — Controle ganhos, gastos e o que realmente sobra" },
      {
        name: "description",
        content:
          "Controle ganhos, gastos, combustível e manutenção pelo celular. Descubra quanto realmente sobra do seu trabalho com moto.",
      },
      { property: "og:title", content: "Você sabe quanto realmente sobra? — Gestão Motoca Pro" },
      {
        property: "og:description",
        content: "Uma forma simples de registrar ganhos e gastos e entender o resultado real do seu trabalho com moto.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://gear-gain-guide.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://gear-gain-guide.lovable.app/" }],
  }),
  component: LandingPage,
});
