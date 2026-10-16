import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, BarChart3, Fuel, MessageCircle, Wallet } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import creatorImage from "@/assets/ambassador-creator.jpg";

const WHATSAPP_URL =
  "https://wa.me/5531983662706?text=Ol%C3%A1%21%20Tenho%20interesse%20em%20me%20tornar%20embaixador%20do%20Gest%C3%A3o%20Motoca%20Pro.%20Gostaria%20de%20conhecer%20o%20programa%20e%20como%20come%C3%A7ar.";

const TITLE = "Programa de Embaixadores | Gestão Motoca Pro";
const DESCRIPTION =
  "Conheça o Programa de Embaixadores do Gestão Motoca Pro. Divulgue o aplicativo para motoboys e receba comissão pelas vendas elegíveis.";

export const Route = createFileRoute("/embaixador")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://gestaomotocapro.com.br/embaixador" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: "https://gestaomotocapro.com.br/embaixador" }],
  }),
  component: AmbassadorPage,
});

const BENEFITS = [
  { icon: Wallet, title: "Controle de ganhos e despesas", text: "Tudo o que entra e sai do corre, registrado em um só lugar." },
  { icon: Fuel, title: "Combustível e manutenção", text: "Abastecimentos e revisões organizados, sem planilha." },
  { icon: BarChart3, title: "Clareza sobre os resultados", text: "Saber quanto realmente sobra no fim do trabalho." },
];

const STEPS = [
  { n: "01", title: "Entre em contato", text: "Envie uma mensagem pelo WhatsApp e manifeste seu interesse em participar." },
  { n: "02", title: "Conheça as regras", text: "Nossa equipe explicará as condições do programa, a atribuição das vendas e o funcionamento das comissões." },
  { n: "03", title: "Divulgue o aplicativo", text: "Compartilhe o Gestão Motoca Pro com sua audiência, seus seguidores, amigos e outros profissionais do setor." },
  { n: "04", title: "Receba comissões", text: "As vendas elegíveis atribuídas às suas indicações poderão gerar comissões, conforme as regras de aprovação e pagamento do programa." },
];

const PROFILES = [
  "Criadores de conteúdo sobre motos e entregas.",
  "Motoboys e entregadores que desejam compartilhar soluções úteis.",
  "Influenciadores com audiência relacionada ao setor.",
  "Administradores de páginas e comunidades de motoboys.",
  "Pessoas com habilidade para divulgar produtos e gerar indicações.",
];

const REASONS = [
  "Comissão única de 45% sobre a base líquida aplicável.",
  "Oportunidade de monetizar indicações qualificadas.",
  "Divulgação de uma ferramenta desenvolvida para o público de motoboys.",
  "Orientações da equipe para entender como começar.",
];

const FAQS = [
  { q: "O que é o Programa de Embaixadores?", a: "É uma parceria para pessoas interessadas em divulgar o Gestão Motoca Pro e receber comissões pelas vendas elegíveis atribuídas às suas indicações." },
  { q: "Quanto posso ganhar?", a: "A comissão é de 45% sobre o valor líquido definido pela plataforma, conforme as regras do programa. Os ganhos dependem das vendas realizadas e não são garantidos." },
  { q: "Preciso ser influenciador?", a: "Não. Criadores de conteúdo, motoboys, entregadores e outras pessoas com acesso ao público adequado podem manifestar interesse." },
  { q: "Como faço para participar?", a: "Clique em um dos botões desta página e envie uma mensagem pelo WhatsApp. Nossa equipe explicará as condições e os próximos passos." },
  { q: "Como as vendas são identificadas?", a: "A atribuição deve seguir os links, mecanismos de rastreamento e regras disponibilizados pela plataforma de afiliados." },
  { q: "Quando recebo minhas comissões?", a: "Os prazos, as condições de aprovação e a liberação dos valores seguem as regras aplicáveis da plataforma e do programa. A equipe fornecerá essas informações durante o contato." },
  { q: "Existe garantia de ganhos?", a: "Não. As comissões dependem de vendas elegíveis efetivamente realizadas e aprovadas." },
];

function WhatsAppButton({ className = "" }: { className?: string }) {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold tracking-wide text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className}`}
    >
      <MessageCircle className="size-5" aria-hidden="true" />
      QUERO SER EMBAIXADOR
    </a>
  );
}

function SectionTitle({ eyebrow, children }: { eyebrow?: string; children: React.ReactNode }) {
  return (
    <div className="max-w-2xl">
      {eyebrow ? <p className="text-xs font-bold tracking-[0.18em] text-primary">{eyebrow}</p> : null}
      <h2 className="mt-3 text-2xl leading-tight font-bold text-balance text-foreground sm:text-4xl">{children}</h2>
    </div>
  );
}

function AmbassadorPage() {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" aria-label="Gestão Motoca Pro — página inicial">
            <Logo subtitle={null} />
          </Link>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden min-h-11 items-center gap-2 rounded-lg border border-primary px-4 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground sm:inline-flex"
          >
            <MessageCircle className="size-4" aria-hidden="true" /> Falar no WhatsApp
          </a>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="lp-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-primary">PROGRAMA DE EMBAIXADORES</p>
              <h1 className="mt-4 text-3xl leading-[1.1] font-bold text-balance sm:text-5xl">
                Transforme suas indicações em <span className="text-primary">oportunidade de ganhos.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                Você conhece motoboys, cria conteúdo ou tem contato com profissionais que vivem sobre duas rodas? Faça parte do
                Programa de Embaixadores do Gestão Motoca Pro e receba comissões pelas vendas elegíveis realizadas através das
                suas indicações.
              </p>
              <div className="mt-6 inline-flex max-w-full flex-col rounded-xl border border-primary/40 bg-primary/10 px-5 py-4">
                <p className="num-display text-2xl text-primary sm:text-3xl">45% DE COMISSÃO</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Comissão calculada sobre o valor líquido definido pela plataforma, conforme as regras do programa.
                </p>
              </div>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <WhatsAppButton />
                <a
                  href="#como-funciona"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border px-6 text-sm font-bold tracking-wide text-foreground transition hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  CONHECER O PROGRAMA <ArrowDown className="size-4" aria-hidden="true" />
                </a>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="lp-glow absolute -inset-6" aria-hidden="true" />
              <img
                src={creatorImage}
                alt="Criador de conteúdo gravando um vídeo com o celular ao lado da moto, em uma oficina de motos"
                width={900}
                height={1125}
                className="relative aspect-[4/5] w-full rounded-2xl border border-border object-cover"
              />
            </div>
          </div>
        </section>

        {/* App */}
        <section className="border-t border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <SectionTitle eyebrow="O APLICATIVO">Uma ferramenta criada para quem vive sobre duas rodas.</SectionTitle>
            <div className="mt-5 max-w-2xl space-y-3 text-base leading-relaxed text-muted-foreground">
              <p>
                O Gestão Motoca Pro ajuda motoboys e entregadores a registrarem seus ganhos, despesas, combustível e manutenção,
                acompanhando melhor o resultado financeiro do próprio trabalho.
              </p>
              <p>Nosso objetivo é ajudar esses profissionais a terem mais controle sobre o dinheiro que ganham todos os dias.</p>
              <p>Como embaixador, você pode apresentar essa solução para pessoas que realmente precisam dela.</p>
            </div>
            <ul className="mt-10 grid gap-4 sm:grid-cols-3">
              {BENEFITS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="rounded-xl border border-border bg-card p-5">
                  <Icon className="size-6 text-primary" aria-hidden="true" />
                  <h3 className="mt-4 text-base font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Como funciona */}
        <section id="como-funciona" className="scroll-mt-20 border-t border-border">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <SectionTitle eyebrow="COMO FUNCIONA">Começar é simples.</SectionTitle>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => (
                <li key={s.n} className="rounded-xl border border-border bg-card p-5">
                  <p className="num-display text-3xl text-primary">{s.n}</p>
                  <h3 className="mt-3 text-base font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Comissão */}
        <section className="border-t border-border bg-secondary/40">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[auto_1fr] lg:gap-16">
            <p className="num-display text-7xl leading-none text-primary sm:text-9xl" aria-label="45 por cento">45%</p>
            <div>
              <h2 className="text-2xl leading-tight font-bold sm:text-4xl">Sua indicação pode valer comissão.</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Comissão única para todos os embaixadores, calculada sobre o valor líquido considerado pela plataforma, de acordo
                com as condições do programa.
              </p>
              <p className="mt-3 text-base leading-relaxed text-foreground">
                Não existem níveis ou categorias de embaixadores. Todos seguem o mesmo percentual de comissão.
              </p>
              <p className="mt-5 border-l-2 border-primary pl-3 text-xs leading-relaxed text-muted-foreground">
                Os ganhos dependem das vendas efetivamente realizadas, da atribuição correta das indicações e das condições de
                aprovação e pagamento. Não há garantia de renda.
              </p>
            </div>
          </div>
        </section>

        {/* Quem pode */}
        <section className="border-t border-border">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2">
            <div>
              <SectionTitle eyebrow="QUEM PODE PARTICIPAR">Esse programa é para você?</SectionTitle>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                Buscamos pessoas que queiram divulgar uma ferramenta útil para a comunidade de motoboys e entregadores.
              </p>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Você não precisa ter milhares de seguidores. O importante é conhecer o público, ter interesse em divulgar o
                aplicativo e seguir as regras do programa.
              </p>
            </div>
            <ul className="space-y-3">
              {PROFILES.map((p) => (
                <li key={p} className="flex gap-3 rounded-xl border border-border bg-card p-4 text-sm leading-relaxed">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Por que */}
        <section className="border-t border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <SectionTitle eyebrow="POR QUE PARTICIPAR">Cresça junto com o Gestão Motoca Pro.</SectionTitle>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {REASONS.map((r, i) => (
                <li key={r} className="flex gap-4 rounded-xl border border-border bg-card p-5">
                  <span className="num-display text-lg text-primary">{String(i + 1).padStart(2, "0")}</span>
                  <p className="text-sm leading-relaxed sm:text-base">{r}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
            <SectionTitle eyebrow="DÚVIDAS">Perguntas frequentes</SectionTitle>
            <Accordion type="single" collapsible className="mt-8">
              {FAQS.map((f, i) => (
                <AccordionItem key={f.q} value={`faq-${i}`}>
                  <AccordionTrigger className="min-h-12 text-left text-base">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA final */}
        <section className="border-t border-border bg-secondary/40">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
            <h2 className="text-3xl leading-tight font-bold sm:text-5xl">
              Vamos crescer <span className="text-primary">juntos?</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Quer divulgar o Gestão Motoca Pro e conhecer as condições para se tornar embaixador?
              <br className="hidden sm:block" /> Envie uma mensagem para nossa equipe e descubra como começar.
            </p>
            <WhatsAppButton className="mt-8 w-full sm:w-auto" />
            <p className="mt-3 text-xs text-muted-foreground">Fale diretamente com nossa equipe pelo WhatsApp.</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border pb-24 sm:pb-0">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-10 sm:px-6">
          <Logo subtitle={null} />
          <p className="text-sm text-muted-foreground">
            Gestão Motoca Pro — mais controle financeiro para quem vive sobre duas rodas.
          </p>
          <nav aria-label="Links do rodapé" className="flex flex-wrap gap-x-6 text-sm text-muted-foreground">
            <Link to="/" className="min-h-11 content-center hover:text-foreground">Página principal</Link>
            <Link to="/privacidade" className="min-h-11 content-center hover:text-foreground">Política de Privacidade</Link>
          </nav>
          <p className="text-xs text-muted-foreground">
            Os resultados e ganhos do Programa de Embaixadores não são garantidos e dependem de vendas elegíveis efetivamente
            realizadas e aprovadas.
          </p>
        </div>
      </footer>

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Quero ser embaixador — abrir WhatsApp"
        className="fixed right-4 bottom-4 z-40 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg sm:hidden"
      >
        <MessageCircle className="size-6" aria-hidden="true" />
      </a>
    </div>
  );
}
