import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, createContext, useContext } from "react";
import { ArrowDown, BarChart3, Check, Fuel, MessageCircle, Users, Video, Bike, Wallet, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import creatorImage from "@/assets/ambassador-creator.jpg";
import { ambassadorWhatsAppUrl, type AmbassadorProfile } from "@/lib/ambassador-whatsapp";

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

const PROFILE_OPTIONS: { id: AmbassadorProfile; label: string; icon: typeof Video }[] = [
  { id: "criador", label: "Criador de conteúdo", icon: Video },
  { id: "entregador", label: "Motoboy ou entregador", icon: Bike },
  { id: "comunidade", label: "Influenciador ou dono de comunidade", icon: Users },
];

const ProfileContext = createContext<AmbassadorProfile | null>(null);

function useWhatsAppUrl() {
  return ambassadorWhatsAppUrl(useContext(ProfileContext));
}

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "hidden" | "shown">("idle");
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    setState("hidden");
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${state === "hidden" ? "translate-y-6 opacity-0" : "translate-y-0 opacity-100"} ${className}`}
    >
      {children}
    </div>
  );
}

function WhatsAppButton({ className = "" }: { className?: string }) {
  const href = useWhatsAppUrl();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative inline-flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-lg bg-primary px-6 text-sm font-bold tracking-wide text-primary-foreground shadow-[0_0_30px_-6px_var(--primary)] transition hover:-translate-y-0.5 hover:shadow-[0_0_40px_-4px_var(--primary)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className}`}
    >
      <MessageCircle className="size-5 transition group-hover:rotate-[-8deg]" aria-hidden="true" />
      QUERO SER EMBAIXADOR
    </a>
  );
}

function SectionTitle({ eyebrow, children }: { eyebrow?: string; children: React.ReactNode }) {
  return (
    <div className="max-w-2xl">
      {eyebrow ? (
        <p className="flex items-center gap-2 font-mono text-xs font-bold tracking-[0.2em] text-primary">
          <span className="h-px w-6 bg-primary" aria-hidden="true" />
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-2xl leading-tight font-bold text-balance text-foreground sm:text-4xl">{children}</h2>
    </div>
  );
}

const CARD =
  "rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_10px_40px_-15px_var(--primary)]";

function TechBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="lp-grid absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="absolute -top-40 right-[-10%] size-[36rem] rounded-full bg-primary/15 blur-[120px]" />
      <div className="absolute bottom-[-30%] left-[-15%] size-[28rem] rounded-full bg-primary/5 blur-[100px]" />
    </div>
  );
}

function AmbassadorPage() {
  const [profile, setProfile] = useState<AmbassadorProfile | null>(null);
  const whatsappUrl = ambassadorWhatsAppUrl(profile);
  const activeLabel = PROFILE_OPTIONS.find((o) => o.id === profile)?.label;

  return (
    <ProfileContext.Provider value={profile}>
      <div className="dark min-h-screen overflow-x-clip bg-background text-foreground">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/75 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
            <Link to="/" aria-label="Gestão Motoca Pro — página inicial">
              <Logo subtitle={null} />
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden min-h-11 items-center gap-2 rounded-lg border border-primary/70 px-4 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground sm:inline-flex"
            >
              <MessageCircle className="size-4" aria-hidden="true" /> Falar no WhatsApp
            </a>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" aria-hidden="true" />
        </header>

        <main>
          {/* Hero */}
          <section className="relative overflow-hidden">
            <TechBackdrop />
            <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-16 sm:px-6 sm:pt-20 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-[11px] font-bold tracking-[0.2em] text-primary">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full rounded-full bg-primary opacity-60 motion-safe:animate-ping" />
                    <span className="relative inline-flex size-2 rounded-full bg-primary" />
                  </span>
                  PROGRAMA DE EMBAIXADORES
                </p>
                <h1 className="mt-5 text-3xl leading-[1.08] font-bold text-balance sm:text-5xl lg:text-6xl">
                  Transforme suas indicações em{" "}
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">oportunidade de ganhos.</span>
                </h1>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                  Você conhece motoboys, cria conteúdo ou tem contato com profissionais que vivem sobre duas rodas? Faça parte do
                  Programa de Embaixadores do Gestão Motoca Pro e receba comissões pelas vendas elegíveis realizadas através das
                  suas indicações.
                </p>
                <div className="relative mt-7 inline-flex max-w-full flex-col overflow-hidden rounded-xl border border-primary/40 bg-gradient-to-br from-primary/15 to-card/40 px-5 py-4">
                  <span className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden="true" />
                  <p className="num-display text-2xl text-primary sm:text-3xl">45% DE COMISSÃO</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Comissão calculada sobre o valor líquido definido pela plataforma, conforme as regras do programa.
                  </p>
                </div>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <WhatsAppButton />
                  <a
                    href="#como-funciona"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border bg-card/40 px-6 text-sm font-bold tracking-wide text-foreground transition hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    CONHECER O PROGRAMA <ArrowDown className="size-4 motion-safe:animate-bounce" aria-hidden="true" />
                  </a>
                </div>
              </div>
              <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                <div className="absolute -inset-8 rounded-[2rem] bg-primary/20 blur-3xl" aria-hidden="true" />
                <div className="relative rounded-2xl border border-primary/30 bg-card/40 p-2 backdrop-blur">
                  <img
                    src={creatorImage}
                    alt="Criador de conteúdo gravando um vídeo com o celular ao lado da moto, em uma oficina de motos"
                    width={900}
                    height={1125}
                    className="aspect-[4/5] w-full rounded-xl object-cover"
                  />
                  <div className="pointer-events-none absolute inset-2 rounded-xl bg-gradient-to-t from-background/70 via-transparent to-transparent" aria-hidden="true" />
                  {(["top-0 left-0 border-t-2 border-l-2", "top-0 right-0 border-t-2 border-r-2", "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"] as const).map((c) => (
                    <span key={c} className={`absolute size-5 rounded-sm border-primary ${c}`} aria-hidden="true" />
                  ))}
                  <span className="absolute top-5 left-5 inline-flex items-center gap-1.5 rounded-md bg-background/80 px-2 py-1 font-mono text-[10px] font-bold tracking-widest text-foreground backdrop-blur" aria-hidden="true">
                    <span className="size-1.5 rounded-full bg-primary motion-safe:animate-pulse" /> REC
                  </span>
                  <span className="absolute right-5 bottom-5 grid size-11 place-items-center rounded-lg border border-primary/40 bg-background/80 text-primary backdrop-blur" aria-hidden="true">
                    <Sparkles className="size-5" />
                  </span>
                </div>
              </div>
            </div>
            <div className="relative flex justify-center pb-8" aria-hidden="true">
              <span className="flex h-9 w-5 justify-center rounded-full border border-muted-foreground/40 pt-1.5">
                <span className="h-2 w-0.5 rounded-full bg-primary motion-safe:animate-bounce" />
              </span>
            </div>
          </section>

          {/* Perfil */}
          <section className="relative border-t border-border/60" aria-labelledby="perfil-titulo">
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
              <Reveal>
                <h2 id="perfil-titulo" className="text-xl font-bold sm:text-3xl">Qual é o seu perfil?</h2>
              </Reveal>
              <div role="radiogroup" aria-labelledby="perfil-titulo" className="mt-6 grid gap-3 sm:grid-cols-3">
                {PROFILE_OPTIONS.map(({ id, label, icon: Icon }, i) => {
                  const active = profile === id;
                  return (
                    <Reveal key={id} delay={i * 80}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setProfile(active ? null : id)}
                        className={`group relative flex min-h-20 w-full items-center gap-4 rounded-xl border p-4 text-left transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] ${
                          active
                            ? "border-primary bg-primary/10 shadow-[0_0_35px_-12px_var(--primary)]"
                            : "border-border/70 bg-card/60 hover:border-primary/40"
                        }`}
                      >
                        <span
                          className={`grid size-12 shrink-0 place-items-center rounded-lg transition duration-300 ${
                            active ? "scale-105 bg-primary text-primary-foreground" : "bg-secondary text-primary group-hover:scale-105"
                          }`}
                        >
                          <Icon className="size-6" aria-hidden="true" />
                        </span>
                        <span className="text-sm font-semibold sm:text-base">{label}</span>
                        <span
                          className={`ml-auto grid size-6 shrink-0 place-items-center rounded-full border transition ${
                            active ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent"
                          }`}
                          aria-hidden="true"
                        >
                          <Check className="size-3.5" />
                        </span>
                      </button>
                    </Reveal>
                  );
                })}
              </div>
              <p className="mt-4 min-h-5 text-xs text-muted-foreground" aria-live="polite">
                {activeLabel ? `Perfil selecionado: ${activeLabel}. Toque novamente para desmarcar.` : null}
              </p>
            </div>
          </section>

          {/* App */}
          <section className="border-t border-border/60 bg-secondary/30">
            <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
              <Reveal>
                <SectionTitle eyebrow="O APLICATIVO">Uma ferramenta criada para quem vive sobre duas rodas.</SectionTitle>
                <div className="mt-5 max-w-2xl space-y-3 text-base leading-relaxed text-muted-foreground">
                  <p>
                    O Gestão Motoca Pro ajuda motoboys e entregadores a registrarem seus ganhos, despesas, combustível e manutenção,
                    acompanhando melhor o resultado financeiro do próprio trabalho.
                  </p>
                  <p>Nosso objetivo é ajudar esses profissionais a terem mais controle sobre o dinheiro que ganham todos os dias.</p>
                  <p>Como embaixador, você pode apresentar essa solução para pessoas que realmente precisam dela.</p>
                </div>
              </Reveal>
              <ul className="mt-10 grid gap-4 sm:grid-cols-3">
                {BENEFITS.map(({ icon: Icon, title, text }, i) => (
                  <li key={title}>
                    <Reveal delay={i * 90} className="h-full">
                      <div className={`group h-full p-5 ${CARD}`}>
                        <span className="grid size-11 place-items-center rounded-lg border border-primary/30 bg-primary/10 transition group-hover:bg-primary group-hover:text-primary-foreground">
                          <Icon className="size-5 text-primary transition group-hover:text-primary-foreground" aria-hidden="true" />
                        </span>
                        <h3 className="mt-4 text-base font-semibold">{title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                      </div>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Como funciona */}
          <section id="como-funciona" className="scroll-mt-20 border-t border-border/60">
            <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
              <Reveal>
                <SectionTitle eyebrow="COMO FUNCIONA">Começar é simples.</SectionTitle>
              </Reveal>
              <ol className="relative mt-10 grid gap-6 lg:grid-cols-4 lg:gap-4">
                <span className="absolute top-6 bottom-6 left-6 w-px bg-gradient-to-b from-primary via-primary/40 to-transparent lg:top-6 lg:right-6 lg:bottom-auto lg:left-6 lg:h-px lg:w-auto lg:bg-gradient-to-r" aria-hidden="true" />
                {STEPS.map((s, i) => (
                  <li key={s.n} className="relative pl-16 lg:pt-16 lg:pl-0">
                    <Reveal delay={i * 120}>
                      <span className="absolute top-0 left-0 grid size-12 place-items-center rounded-xl border border-primary/50 bg-background font-mono text-sm font-bold text-primary shadow-[0_0_20px_-6px_var(--primary)]">
                        {s.n}
                      </span>
                      <h3 className="text-base font-semibold">{s.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                    </Reveal>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* Comissão */}
          <section className="relative overflow-hidden border-t border-border/60 bg-secondary/30">
            <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[auto_1fr] lg:gap-16">
              <Reveal>
                <div className="relative rounded-2xl border border-primary/40 bg-gradient-to-br from-card to-background p-6 shadow-[0_0_60px_-20px_var(--primary)] sm:p-8">
                  <div className="flex items-center justify-between gap-6 font-mono text-[10px] tracking-[0.2em] text-muted-foreground" aria-hidden="true">
                    <span>COMISSÃO</span>
                    <span className="flex gap-1">
                      <span className="size-1.5 rounded-full bg-primary" />
                      <span className="size-1.5 rounded-full bg-primary/50" />
                      <span className="size-1.5 rounded-full bg-primary/25" />
                    </span>
                  </div>
                  <p className="num-display mt-3 text-7xl leading-none text-primary sm:text-9xl" aria-label="45 por cento">45%</p>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
                    <div className="h-full w-[45%] rounded-full bg-gradient-to-r from-primary/60 to-primary" />
                  </div>
                </div>
              </Reveal>
              <Reveal delay={120}>
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
              </Reveal>
            </div>
          </section>

          {/* Quem pode */}
          <section className="border-t border-border/60">
            <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2">
              <Reveal>
                <SectionTitle eyebrow="QUEM PODE PARTICIPAR">Esse programa é para você?</SectionTitle>
                <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                  Buscamos pessoas que queiram divulgar uma ferramenta útil para a comunidade de motoboys e entregadores.
                </p>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  Você não precisa ter milhares de seguidores. O importante é conhecer o público, ter interesse em divulgar o
                  aplicativo e seguir as regras do programa.
                </p>
              </Reveal>
              <ul className="space-y-3">
                {PROFILES.map((p, i) => (
                  <li key={p}>
                    <Reveal delay={i * 70}>
                      <div className={`flex gap-3 p-4 text-sm leading-relaxed ${CARD}`}>
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" aria-hidden="true" />
                        {p}
                      </div>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Por que */}
          <section className="border-t border-border/60 bg-secondary/30">
            <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
              <Reveal>
                <SectionTitle eyebrow="POR QUE PARTICIPAR">Cresça junto com o Gestão Motoca Pro.</SectionTitle>
              </Reveal>
              <ul className="mt-10 grid gap-4 sm:grid-cols-2">
                {REASONS.map((r, i) => (
                  <li key={r}>
                    <Reveal delay={i * 80} className="h-full">
                      <div className={`flex h-full gap-4 p-5 ${CARD}`}>
                        <span className="num-display text-lg text-primary">{String(i + 1).padStart(2, "0")}</span>
                        <p className="text-sm leading-relaxed sm:text-base">{r}</p>
                      </div>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* FAQ */}
          <section className="border-t border-border/60">
            <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
              <Reveal>
                <SectionTitle eyebrow="DÚVIDAS">Perguntas frequentes</SectionTitle>
              </Reveal>
              <Accordion type="single" collapsible className="mt-8 space-y-3">
                {FAQS.map((f, i) => (
                  <AccordionItem
                    key={f.q}
                    value={`faq-${i}`}
                    className="rounded-xl border border-border/70 bg-card/50 px-4 transition data-[state=open]:border-primary/50 data-[state=open]:bg-card"
                  >
                    <AccordionTrigger className="min-h-12 text-left text-base hover:no-underline">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>

          {/* CTA final */}
          <section className="relative overflow-hidden border-t border-border/60">
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <div className="absolute bottom-[-60%] left-1/2 h-[30rem] w-[50rem] max-w-[200%] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
              <div className="lp-grid absolute inset-0 opacity-20 [mask-image:linear-gradient(to_top,black,transparent)]" />
            </div>
            <Reveal className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
              <h2 className="text-3xl leading-tight font-bold sm:text-5xl">
                Vamos crescer <span className="text-primary">juntos?</span>
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                Quer divulgar o Gestão Motoca Pro e conhecer as condições para se tornar embaixador?
                <br className="hidden sm:block" /> Envie uma mensagem para nossa equipe e descubra como começar.
              </p>
              <WhatsAppButton className="mt-8 w-full sm:w-auto" />
              <p className="mt-3 text-xs text-muted-foreground">Fale diretamente com nossa equipe pelo WhatsApp.</p>
            </Reveal>
          </section>
        </main>

        <footer className="border-t border-border/60 pb-24 sm:pb-0">
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
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Quero ser embaixador — abrir WhatsApp"
          className="fixed right-4 bottom-4 z-40 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_0_30px_-4px_var(--primary)] transition active:scale-95 sm:hidden"
        >
          <MessageCircle className="size-6" aria-hidden="true" />
        </a>
      </div>
    </ProfileContext.Provider>
  );
}
