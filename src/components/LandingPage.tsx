import { useState, type ElementType } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  Bike,
  Check,
  CircleDollarSign,
  Clock3,
  Fuel,
  Menu,
  Minus,
  ReceiptText,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  WalletCards,
  Wrench,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Benefícios", href: "#beneficios" },
  { label: "Planos", href: "#planos" },
  { label: "FAQ", href: "#faq" },
] as const;

const PAINS = [
  {
    icon: TrendingDown,
    title: "Você fatura, mas não sabe o lucro.",
    text: "Confunde faturamento com o dinheiro que realmente sobrou.",
  },
  {
    icon: Fuel,
    title: "O combustível come uma parte do seu ganho.",
    text: "Mas você sabe quanto ele representa no mês?",
  },
  {
    icon: Wrench,
    title: "Manutenção aparece de surpresa.",
    text: "E quando você não se prepara, pesa no bolso.",
  },
  {
    icon: ReceiptText,
    title: "Anotar tudo no papel dá trabalho.",
    text: "E planilha não foi feita para quem está na rua trabalhando.",
  },
] as const;

const BENEFITS = [
  { icon: TrendingUp, title: "Ganhos", text: "Veja quanto entrou no seu dia, semana e mês." },
  { icon: WalletCards, title: "Gastos", text: "Saiba para onde seu dinheiro está indo." },
  { icon: Fuel, title: "Combustível", text: "Controle seus gastos com combustível." },
  { icon: Wrench, title: "Manutenção", text: "Registre os cuidados e gastos da sua moto." },
  { icon: Target, title: "Metas", text: "Defina objetivos e acompanhe seu progresso." },
] as const;

const STEPS = [
  { number: "01", title: "Registre", text: "Você registra o que ganhou ou gastou." },
  { number: "02", title: "Acompanhe", text: "O app organiza seus números." },
  { number: "03", title: "Entenda", text: "Veja quanto realmente está sobrando." },
  { number: "04", title: "Melhore", text: "Use seus números para tomar decisões melhores." },
] as const;

const PLANS = [
  { name: "Start", price: "R$ 29,90", period: "/mês", plan: "mensal" },
  { name: "Pro", price: "R$ 69,90", period: "/trimestre", plan: "trimestral", featured: true },
  { name: "Elite", price: "R$ 199,90", period: "/ano", plan: "anual" },
] as const;

type LandingPlan = {
  name: string;
  price: string;
  period: string;
  plan: string;
  featured?: boolean;
};

const PLAN_FEATURES = ["Ganhos e gastos", "Combustível", "Manutenção", "Metas", "Relatórios"];

const FAQS = [
  { question: "Preciso entender de planilhas?", answer: "Não. Você só registra o que ganhou ou gastou, e o Gestão Motoca Pro organiza os números para você." },
  { question: "Posso usar pelo celular?", answer: "Sim. O aplicativo foi pensado para funcionar no celular, onde você estiver, sem precisar instalar planilhas." },
  { question: "Consigo controlar combustível?", answer: "Sim. Registre o valor abastecido e, se quiser, litros e quilometragem para acompanhar mais detalhes." },
  { question: "Consigo registrar manutenção?", answer: "Sim. Você registra o tipo e o valor da manutenção e pode adicionar quilometragem, oficina e outras informações." },
  { question: "Posso acompanhar minhas metas?", answer: "Sim. Você define objetivos e acompanha o avanço com base nos seus próprios registros." },
  { question: "Como funciona a assinatura?", answer: "Escolha o período mensal, trimestral ou anual. Depois de entrar na sua conta, você segue para o checkout seguro já configurado." },
] as const;

function SectionHeading({ eyebrow, title, text, centered = false }: { eyebrow: string; title: string; text?: string; centered?: boolean }) {
  return (
    <div className={cn("max-w-3xl", centered && "mx-auto text-center")}>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">{eyebrow}</p>
      <h2 className="mt-3 text-3xl leading-tight font-bold sm:text-4xl lg:text-5xl">{title}</h2>
      {text ? <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">{text}</p> : null}
    </div>
  );
}

function AppPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[560px] lg:ml-auto">
      <div className="absolute inset-x-8 -bottom-8 h-16 bg-accent/15 blur-3xl" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-lg border border-border bg-card shadow-2xl shadow-background">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Boa noite, Carlos</p>
            <p className="truncate font-display text-lg font-bold">Seu resultado de setembro</p>
          </div>
          <div className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-accent">
            <Bike className="size-5" />
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-2 gap-3">
            <PreviewStat label="Ganhos" value="R$ 4.280" icon={TrendingUp} tone="positive" />
            <PreviewStat label="Gastos" value="R$ 1.640" icon={TrendingDown} tone="negative" />
          </div>
          <div className="mt-3 rounded-md border border-accent/35 bg-accent/8 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Resultado do mês</p>
                <p className="num-display mt-1 text-3xl text-foreground">R$ 2.640</p>
              </div>
              <div className="grid size-11 place-items-center rounded-md bg-accent text-accent-foreground">
                <CircleDollarSign className="size-6" />
              </div>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-[73%] rounded-full bg-accent" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">73% da meta mensal alcançada</p>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-md border border-border bg-secondary/55 p-3">
              <Fuel className="size-5 shrink-0 text-accent" />
              <div className="min-w-0"><p className="text-xs text-muted-foreground">Combustível</p><p className="num-display truncate">R$ 680</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-md border border-border bg-secondary/55 p-3">
              <Wrench className="size-5 shrink-0 text-accent" />
              <div className="min-w-0"><p className="text-xs text-muted-foreground">Manutenção</p><p className="num-display truncate">R$ 240</p></div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -right-2 -bottom-5 hidden items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold shadow-xl sm:flex">
        <Check className="size-4 text-positive" /> Registro salvo
      </div>
    </div>
  );
}

function PreviewStat({ label, value, icon: Icon, tone }: { label: string; value: string; icon: ElementType; tone: "positive" | "negative" }) {
  return (
    <div className="rounded-md border border-border bg-secondary/55 p-4">
      <Icon className={cn("size-4", tone === "positive" ? "text-positive" : "text-negative")} />
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p className="num-display mt-0.5 text-lg sm:text-xl">{value}</p>
    </div>
  );
}

function PlanCard({ name, price, period, plan, featured = false }: LandingPlan) {
  return (
    <article className={cn("relative flex h-full flex-col rounded-lg border bg-card p-5 sm:p-6", featured ? "border-accent shadow-lg shadow-accent/10" : "border-border")}>
      {featured ? <span className="absolute top-0 right-5 -translate-y-1/2 rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase text-accent-foreground">Mais escolhido</span> : null}
      <h3 className="text-sm font-bold uppercase text-accent">{name}</h3>
      <p className="mt-4 flex items-end gap-1"><span className="num-display text-3xl sm:text-4xl">{price}</span><span className="pb-1 text-sm text-muted-foreground">{period}</span></p>
      <div className="my-6 h-px bg-border" />
      <ul className="flex-1 space-y-3">
        {PLAN_FEATURES.map((feature) => <li key={feature} className="flex items-center gap-2 text-sm"><Check className="size-4 shrink-0 text-accent" />{feature}</li>)}
      </ul>
      <Button asChild variant={featured ? "default" : "outline"} className="mt-7 h-12 w-full">
        <Link to="/planos" aria-label={`Escolher plano ${name} ${plan}`}>Escolher {name}<ArrowRight /></Link>
      </Button>
    </article>
  );
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh overflow-x-clip bg-canvas text-foreground selection:bg-accent selection:text-accent-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/92 backdrop-blur-xl">
        <div className="mx-auto grid min-h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6 lg:flex lg:h-[76px] lg:px-8">
          <a href="#inicio" aria-label="Gestão Motoca Pro — início" className="flex min-h-12 min-w-0 items-center"><Logo /></a>
          <nav className="ml-auto hidden items-center gap-7 lg:flex" aria-label="Navegação principal">
            {NAV_ITEMS.map((item) => <a key={item.href} href={item.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{item.label}</a>)}
          </nav>
          <div className="ml-4 hidden items-center gap-2 lg:flex">
            <Button asChild variant="ghost" className="h-12"><Link to="/auth">Entrar</Link></Button>
            <Button asChild className="h-12 px-5"><Link to="/auth" search={{ mode: "signup" }}>Começar agora</Link></Button>
          </div>
          <Button type="button" variant="ghost" size="icon" className="size-12 shrink-0 lg:hidden" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
        {menuOpen ? (
          <div className="border-t border-border bg-background px-4 py-4 lg:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col" aria-label="Navegação móvel">
              {NAV_ITEMS.map((item) => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center border-b border-border text-sm font-semibold">{item.label}</a>)}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button asChild variant="outline" className="h-12"><Link to="/auth">Entrar</Link></Button>
                <Button asChild className="h-12"><Link to="/auth" search={{ mode: "signup" }}>Começar agora</Link></Button>
              </div>
            </nav>
          </div>
        ) : null}
      </header>

      <main>
        <section id="inicio" className="relative scroll-mt-24 border-b border-border">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-accent/70" aria-hidden="true" />
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] lg:px-8 lg:py-24 xl:gap-20">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-2 text-xs font-semibold text-muted-foreground">
                <Bike className="size-4 text-accent" /> Feito para quem vive sobre duas rodas
              </div>
              <h1 className="mt-6 max-w-3xl text-4xl leading-[1.08] font-bold sm:text-5xl lg:text-6xl xl:text-7xl">
                Você trabalha o dia inteiro. Mas sabe quanto <span className="text-accent">realmente sobra?</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                O Gestão Motoca Pro ajuda você a controlar seus ganhos, gastos, combustível e manutenção em poucos segundos. Sem planilhas e sem complicação.
              </p>
              <div className="mt-8 grid gap-3 sm:flex">
                <Button asChild size="lg" className="h-14 w-full px-7 text-base sm:w-auto"><Link to="/auth" search={{ mode: "signup" }}>Quero assinar<ArrowRight /></Link></Button>
                <Button asChild size="lg" variant="outline" className="h-14 w-full px-7 text-base sm:w-auto"><a href="#como-funciona">Ver como funciona<ArrowDown /></a></Button>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-xs font-medium text-muted-foreground">
                <span className="flex items-center gap-2"><Check className="size-4 text-positive" /> Fácil de usar</span>
                <span className="flex items-center gap-2"><Check className="size-4 text-positive" /> Feito para celular</span>
                <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-positive" /> Seus dados protegidos</span>
              </div>
            </div>
            <AppPreview />
          </div>
        </section>

        <section className="border-b border-border bg-background py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="A realidade de quem está na rua" title="Controle seus ganhos, gastos e lucro" text="Quem trabalha como motoboy, entregador ou mototaxista precisa saber mais do que o faturamento: precisa entender quanto realmente sobra." />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PAINS.map(({ icon: Icon, title, text }) => (
                <article key={title} className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-accent/35 sm:p-6">
                  <div className="grid size-10 place-items-center rounded-md bg-secondary text-accent"><Icon className="size-5" /></div>
                  <h3 className="mt-5 text-lg leading-snug font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="scroll-mt-20 border-b border-border py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Sem complicação" title="Feito para quem vive sobre duas rodas" text="Registre ganhos, gastos e custos da moto em poucos segundos. O aplicativo organiza o controle financeiro sem planilhas complicadas." centered />
            <div className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-2">
              {[{ icon: TrendingUp, label: "Ganhos" }, { icon: TrendingDown, label: "Gastos" }, { icon: Fuel, label: "Combustível" }, { icon: Wrench, label: "Manutenção" }, { icon: BarChart3, label: "Resultado" }].map(({ icon: Icon, label }, index) => (
                <div key={label} className={cn("relative flex min-h-28 flex-col items-center justify-center rounded-lg border p-3 text-center", index === 4 ? "col-span-2 border-accent bg-accent/8 sm:col-span-1" : "border-border bg-card")}>
                  <Icon className="size-6 text-accent" /><h3 className="mt-3 text-xs font-bold uppercase sm:text-sm">{label}</h3>
                  {index < 4 ? <ArrowRight className="absolute top-1/2 -right-3 z-10 hidden size-5 -translate-y-1/2 text-muted-foreground sm:block" /> : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="beneficios" className="scroll-mt-20 border-b border-border bg-background py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Tudo que importa" title="Controle seu combustível e manutenção" text="Acompanhe os custos da moto junto com ganhos, gastos e metas para tomar decisões mais seguras no dia a dia." />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              {BENEFITS.map(({ icon: Icon, title, text }, index) => (
                <article key={title} className={cn("rounded-lg border border-border bg-card p-5 sm:p-6 lg:col-span-2", index >= 3 && "lg:col-span-3")}>
                  <Icon className="size-6 text-accent" /><h3 className="mt-5 text-lg font-bold uppercase">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Clareza muda o jogo" title="Saiba quanto realmente sobra" text="Veja seu resultado e lucro com base no que entrou e no que você gastou para trabalhar." centered />
            <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-2">
              <article className="rounded-lg border border-border bg-card p-5 sm:p-7">
                <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-md bg-secondary text-muted-foreground"><Minus /></div><h3 className="text-xl font-bold">Antes</h3></div>
                <ul className="mt-6 space-y-4 text-sm text-muted-foreground sm:text-base">{["Acho que esse mês ganhei bem.", "Não sei quanto gastei de combustível.", "Depois eu vejo os gastos.", "Não sei se realmente valeu a pena trabalhar tanto."].map((text) => <li key={text} className="flex gap-3"><X className="mt-0.5 size-5 shrink-0 text-negative" /><span>{text}</span></li>)}</ul>
              </article>
              <article className="rounded-lg border border-accent/55 bg-accent/8 p-5 sm:p-7">
                <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-md bg-accent text-accent-foreground"><Check /></div><h3 className="text-xl font-bold">Depois</h3></div>
                <ul className="mt-6 space-y-4 text-sm sm:text-base">{["Hoje fiz R$ 280.", "Gastei R$ 60.", "Meu resultado foi R$ 220.", "Estou acompanhando minha meta."].map((text) => <li key={text} className="flex gap-3"><Check className="mt-0.5 size-5 shrink-0 text-positive" /><span>{text}</span></li>)}</ul>
              </article>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Simples assim" title="Como funciona" text="Um controle financeiro para motoboy e entregador que acompanha a rotina sem tomar seu tempo." centered />
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step) => <article key={step.number} className="border-t-2 border-accent bg-card p-5 sm:p-6"><span className="num-display text-3xl text-accent">{step.number}</span><h3 className="mt-5 text-lg font-bold uppercase">{step.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p></article>)}
            </div>
          </div>
        </section>

        <section id="planos" className="scroll-mt-20 border-b border-border py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Escolha o melhor período" title="Planos" text="Todos os planos dão acesso ao controle de ganhos, gastos, combustível, manutenção, metas e relatórios." centered />
            <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3 md:items-stretch">{PLANS.map((plan) => <PlanCard key={plan.name} {...plan} />)}</div>
            <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground"><ShieldCheck className="size-4" /> Pagamento processado em ambiente seguro.</p>
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 border-b border-border bg-background py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
            <SectionHeading eyebrow="Respostas diretas" title="Perguntas frequentes" text="O que motoboys e profissionais de moto precisam saber antes de começar." />
            <Accordion type="single" collapsible className="border-t border-border">
              {FAQS.map((item, index) => <AccordionItem key={item.question} value={`faq-${index}`}><AccordionTrigger className="min-h-16 text-left text-base font-semibold hover:no-underline">{item.question}</AccordionTrigger><AccordionContent className="pr-8 leading-6 text-muted-foreground">{item.answer}</AccordionContent></AccordionItem>)}
            </Accordion>
          </div>
        </section>

        <section className="relative overflow-hidden py-20 sm:py-28">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-accent/70" aria-hidden="true" />
          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
            <Clock3 className="mx-auto size-9 text-accent" />
            <h2 className="mt-6 text-3xl leading-tight font-bold sm:text-5xl">Você já coloca a moto na rua todos os dias. Agora coloque seu dinheiro sob controle.</h2>
            <p className="mt-5 text-muted-foreground">Gestão Motoca Pro — Seu corre sob controle.</p>
            <Button asChild size="lg" className="mt-8 h-14 w-full px-8 text-base sm:w-auto"><Link to="/auth" search={{ mode: "signup" }}>Começar agora<ArrowRight /></Link></Button>
          </div>
        </section>
      </main>

      <footer id="contato" className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Logo />
          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground" aria-label="Links institucionais">
            <a href="#faq" className="min-h-12 content-center transition-colors hover:text-foreground">Termos de Uso</a>
            <a href="#faq" className="min-h-12 content-center transition-colors hover:text-foreground">Política de Privacidade</a>
            <a href="#contato" className="min-h-12 content-center transition-colors hover:text-foreground">Contato</a>
          </nav>
        </div>
        <div className="border-t border-border px-4 py-5 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Gestão Motoca Pro. Todos os direitos reservados.</div>
      </footer>
    </div>
  );
}