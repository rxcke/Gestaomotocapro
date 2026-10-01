import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/privacidade")({
  head: () => ({ meta: [
    { title: "Política de Privacidade — Gestão Motoca Pro" },
    { name: "description", content: "Como o Gestão Motoca Pro usa dados de navegação e escolhas de publicidade." },
    { property: "og:title", content: "Política de Privacidade — Gestão Motoca Pro" },
    { property: "og:description", content: "Conheça o uso de dados de navegação e suas escolhas de publicidade." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return <main className="min-h-dvh bg-background px-5 py-12 text-foreground"><div className="mx-auto max-w-3xl space-y-6 text-sm leading-7">
    <Button asChild variant="outline"><Link to="/">Voltar</Link></Button>
    <h1 className="font-display text-3xl font-bold">Política de Privacidade</h1>
    <p>O Gestão Motoca Pro usa informações necessárias para sua conta e assinatura. Para publicidade, podemos medir páginas visitadas, origem de campanha (UTMs e fbclid), cliques em botões, cadastro, início de checkout e compras confirmadas pela Cakto.</p>
    <p>Os destinatários de dados de medição publicitária são a Meta Platforms (Pixel e API de Conversões) e, se conectada, a Google (Google Analytics 4). Esses dados servem para medir campanhas e otimizar anúncios. Não enviamos senha, dados financeiros privados, telefone ou e-mail para correspondência de anúncios.</p>
    <p>Em regiões que exigem consentimento, a medição só é ativada após sua aceitação. A escolha, data, região, identificador de visitante e versão deste aviso são registrados para comprovar sua decisão; recusas posteriores são preservadas como nova escolha. Fora dessas regiões, a medição pode funcionar sem o aviso, respeitando escolhas anteriores de recusa. Você pode alterar sua escolha a qualquer momento abaixo.</p>
    <Button variant="outline" onClick={() => window.dispatchEvent(new Event("open-cookie-settings"))}>Configurações de cookies</Button>
    <p>Contato: <a className="underline" href="mailto:contato@gestaomotocapro.com.br">contato@gestaomotocapro.com.br</a>.</p>
  </div></main>;
}