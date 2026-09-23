import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/LandingPage";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Gestão Motoca Pro | Controle seus ganhos, gastos e lucro" },
      {
        name: "description",
        content:
          "Controle seus ganhos, gastos, combustível, manutenção e metas em um só lugar. O Gestão Motoca Pro ajuda motoboys e profissionais de moto a entender quanto realmente sobra.",
      },
      { property: "og:title", content: "Gestão Motoca Pro | Controle seus ganhos, gastos e lucro" },
      {
        property: "og:description",
        content: "Controle seus ganhos, gastos, combustível, manutenção e metas em um só lugar.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://gestaomotocapro.com.br/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Gestão Motoca Pro | Controle seus ganhos, gastos e lucro" },
      { name: "twitter:description", content: "Controle seus ganhos, gastos, combustível, manutenção e metas em um só lugar." },
    ],
    links: [{ rel: "canonical", href: "https://gestaomotocapro.com.br/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Gestão Motoca Pro",
          description: "Controle de ganhos, gastos, combustível, manutenção e metas para motoboys e profissionais de moto.",
          url: "https://gestaomotocapro.com.br/",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Web",
          offers: [
            { "@type": "Offer", name: "Start", price: "29.90", priceCurrency: "BRL", description: "Plano mensal" },
            { "@type": "Offer", name: "Pro", price: "69.90", priceCurrency: "BRL", description: "Plano trimestral" },
            { "@type": "Offer", name: "Elite", price: "199.90", priceCurrency: "BRL", description: "Plano anual" },
          ],
        }),
      },
    ],
  }),
  component: LandingPage,
});
