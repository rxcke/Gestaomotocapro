import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, Check, Fuel, Instagram, Mail, Menu, Pause, Play, Square, Wrench, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackClick } from "@/lib/tracking";

const NAV_ITEMS = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "O app", href: "#produto" },
  { label: "Planos", href: "#planos" },
  { label: "Dúvidas", href: "#faq" },
] as const;

const PLANS = [
  { name: "Start", price: "R$ 29,90", period: "/mês", plan: "mensal", charge: "Cobrado todo mês", monthly: null, badge: null },
  { name: "Pro", price: "R$ 69,90", period: "/trimestre", plan: "trimestral", charge: "Cobrado a cada 3 meses", monthly: "≈ R$ 23,30/mês", badge: "Mais popular" },
  { name: "Elite", price: "R$ 199,90", period: "/ano", plan: "anual", charge: "Cobrado uma vez por ano", monthly: "≈ R$ 16,66/mês", badge: "Melhor custo-benefício" },
] as const;

const PLAN_FEATURES = ["Ganhos e gastos", "Jornada com pausas", "Combustível", "Manutenção", "Metas", "Relatórios"];

const FAQS = [
  { q: "O que é o Gestão Motoca Pro?", a: "É um aplicativo para quem trabalha de moto registrar ganhos, gastos, combustível, manutenção e jornadas, e ver quanto realmente sobrou." },
  { q: "Para quem é?", a: "Para motoboys, entregadores, mototaxistas e qualquer pessoa que usa a moto para trabalhar ou no dia a dia." },
  { q: "Preciso instalar algum aplicativo?", a: "Não. Ele funciona direto no navegador do celular ou do computador. Se quiser, dá para adicionar à tela inicial do celular." },
  { q: "Posso testar antes de assinar?", a: "Sim. Toda conta nova ganha uma demonstração gratuita, sem cartão de crédito." },
  { q: "Como funciona a demonstração?", a: "Você tem 24 horas corridas, a partir do cadastro, para usar o app completo. Depois disso, seus dados ficam guardados e você só volta a registrar e editar ao assinar um plano." },
  { q: "Quais são os planos?", a: "Start por R$ 29,90 por mês, Pro por R$ 69,90 por trimestre e Elite por R$ 199,90 por ano. Todos liberam as mesmas funções do app." },
  { q: "Posso cancelar?", a: "Sim. Fale com a gente pelo e-mail contato@gestaomotocapro.com.br ou pela plataforma de pagamento usada na compra." },
  { q: "Como funciona o acesso após a assinatura?", a: "Depois que o pagamento é confirmado, o acesso é liberado na mesma conta usada na compra, com todos os seus registros." },
] as const;

/* ---------- utilidades ---------- */

function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={cn("report-reveal", inView && "is-in", className)}>{children}</div>;
}

function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView] as const;
}

function Count({ to, decimals = 2, prefix = "R$ ", start = true }: { to: number; decimals?: number; prefix?: string; start?: boolean }) {
  const [v, setV] = useState(to);
  useEffect(() => {
    if (!start) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(to); return; }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 900);
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    setV(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, start]);
  return <>{prefix}{v.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>;
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{children}</p>;
}

function Example() {
  return <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">Valores ilustrativos</span>;
}

function StartCta({ label = "Começar agora", className }: { label?: string; className?: string }) {
  return (
    <Button asChild size="lg" className={cn("h-14 rounded-full px-8 text-sm font-bold uppercase tracking-wider transition-transform hover:-translate-y-0.5", className)}>
      <Link to="/auth" search={{ mode: "signup" }} onClick={() => trackClick(label)}>{label}<ArrowRight /></Link>
    </Button>
  );
}

/* ---------- mockup do app ---------- */

function PhoneMock() {
  return (
    <div className="lp-phone relative mx-auto w-[260px] sm:w-[290px]">
      <div className="rounded-[2.6rem] border border-border bg-card p-2.5 shadow-2xl">
        <div className="lp-screen relative overflow-hidden rounded-[2.1rem] px-4 pt-8 pb-5">
          <div className="absolute top-2.5 left-1/2 h-5 w-20 -translate-x-1/2 rounded-full bg-card" />
          <p className="text-xs text-muted-foreground">Boa tarde 👋</p>
          <p className="font-display text-sm font-bold">Bora ver como está seu corre.</p>
          <div className="mt-4 rounded-3xl bg-secondary/70 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Lucro deste mês</p>
            <p className="num-display mt-1 text-3xl"><Count to={2846.9} /></p>
            <p className="text-[11px] text-muted-foreground">foi o que sobrou do seu corre</p>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[["Fez", "286", "text-foreground"], ["Gastou", "72", "text-negative"], ["Sobrou", "214", "text-positive"]].map(([l, v, c]) => (
              <div key={l} className="rounded-2xl bg-secondary/60 px-1 py-2.5">
                <p className="text-[9px] font-bold uppercase text-muted-foreground">{l}</p>
                <p className={cn("num-display text-sm", c)}>R$ {v}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-3xl border border-positive/30 bg-positive/10 p-3.5">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-positive"><span className="home-pulse size-1.5 rounded-full bg-positive" />Jornada em andamento</div>
            <p className="num-display mt-1 text-2xl">02:47:12</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <span className="flex items-center justify-center gap-1 rounded-full bg-secondary py-2 text-[10px] font-bold"><Pause className="size-3" />Pausar</span>
              <span className="flex items-center justify-center gap-1 rounded-full bg-secondary py-2 text-[10px] font-bold"><Square className="size-3" />Encerrar</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {["Ganho", "Gasto", "Abasteci", "Manut."].map((l, i) => (
              <span key={l} className={cn("rounded-2xl py-2 text-center text-[9px] font-bold", i === 0 ? "bg-accent text-accent-foreground" : "bg-secondary")}>{l}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Floating({ className, label, value, tone, delay }: { className: string; label: string; value: string; tone?: string; delay: number }) {
  return (
    <div className={cn("lp-pop absolute rounded-2xl border border-border bg-card/90 px-3.5 py-2.5 shadow-xl backdrop-blur-md", className)} style={{ animationDelay: `${delay}ms` }}>
      <p className={cn("num-display text-base leading-tight sm:text-lg", tone)}>{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

/* ---------- página ---------- */

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [jRef, jIn] = useInView<HTMLDivElement>();
  const [rRef, rIn] = useInView<HTMLDivElement>();
  const [mRef, mIn] = useInView<HTMLDivElement>();

  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-dvh overflow-x-clip bg-canvas text-foreground selection:bg-accent selection:text-accent-foreground">
      {/* Cabeçalho */}
      <header className="dark sticky top-0 z-50 border-b border-border bg-background/85 text-foreground backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:h-[72px] lg:px-8">
          <a href="#inicio" aria-label="Gestão Motoca Pro — início" className="flex min-h-12 min-w-0 items-center"><Logo /></a>
          <nav className="ml-auto hidden items-center gap-7 lg:flex" aria-label="Navegação principal">
            {NAV_ITEMS.map((i) => <a key={i.href} href={i.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{i.label}</a>)}
          </nav>
          <div className="ml-4 hidden items-center gap-2 lg:flex">
            <Button asChild variant="ghost" className="h-11 rounded-full"><Link to="/auth" onClick={() => trackClick("Entrar")}>Entrar</Link></Button>
            <Button asChild className="h-11 rounded-full px-5 font-bold"><Link to="/auth" search={{ mode: "signup" }} onClick={() => trackClick("Começar agora")}>Começar agora</Link></Button>
          </div>
          <Button type="button" variant="ghost" size="icon" className="ml-auto size-12 shrink-0 lg:hidden" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
        {menuOpen ? (
          <div className="border-t border-border bg-background px-4 py-4 lg:hidden">
            <nav className="flex flex-col" aria-label="Navegação móvel">
              {NAV_ITEMS.map((i) => <a key={i.href} href={i.href} onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center border-b border-border text-sm font-semibold">{i.label}</a>)}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button asChild variant="outline" className="h-12 rounded-full"><Link to="/auth">Entrar</Link></Button>
                <Button asChild className="h-12 rounded-full"><Link to="/auth" search={{ mode: "signup" }}>Começar agora</Link></Button>
              </div>
            </nav>
          </div>
        ) : null}
      </header>

      <main>
        {/* HERO */}
        <section id="inicio" className="dark relative scroll-mt-24 overflow-hidden bg-background text-foreground">
          <div className="lp-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
          <div className="lp-glow pointer-events-none absolute top-1/3 left-1/2 size-[520px] -translate-x-1/2 lg:left-[72%]" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pt-24 lg:pb-28">
            <div className="home-rise text-center lg:text-left">
              <Eyebrow>Seu corre sob controle.</Eyebrow>
              <h1 className="mt-5 text-[2.5rem] leading-[1.02] font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
                Você trabalha o dia inteiro.<br />
                <span className="text-muted-foreground">Mas sabe quanto </span>
                <span className="text-accent">realmente sobra?</span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg lg:mx-0">
                O Gestão Motoca Pro ajuda você a controlar ganhos, gastos, combustível, manutenção e jornadas em um só lugar.
              </p>
              <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <StartCta />
                <Button asChild size="lg" variant="ghost" className="h-14 rounded-full px-7 text-sm font-bold uppercase tracking-wider">
                  <a href="#como-funciona">Ver como funciona<ArrowDown /></a>
                </Button>
              </div>
              <p className="mt-5 text-xs text-muted-foreground">24 horas grátis para testar. Sem cartão.</p>
            </div>

            <div className="relative mx-auto h-[560px] w-full max-w-[420px] sm:h-[600px]">
              <PhoneMock />
              <Floating className="top-10 -left-1 sm:-left-8" label="ganhos" value="R$ 286,40" delay={500} />
              <Floating className="top-44 -right-1 sm:-right-10" label="gastos" value="R$ 72,30" tone="text-negative" delay={700} />
              <Floating className="bottom-36 -left-1 sm:-left-12" label="lucro" value="R$ 214,10" tone="text-positive" delay={900} />
              <Floating className="right-0 bottom-12 sm:-right-6" label="de corre" value="02h 47min" delay={1100} />
              <div className="absolute right-0 -bottom-2 left-0 text-center"><Example /></div>
            </div>
          </div>
        </section>

        {/* PROBLEMA */}
        <section className="dark relative border-t border-border bg-background py-24 text-foreground sm:py-32">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <h2 className="text-3xl leading-tight font-bold text-muted-foreground sm:text-5xl">
                Você corre.<br />O dinheiro entra.<br />O dinheiro sai.<br />E no fim do mês...
              </h2>
            </Reveal>
            <Reveal delay={150}>
              <p className="mt-8 font-display text-5xl leading-[0.95] font-extrabold tracking-tight sm:text-7xl lg:text-8xl">
                Quanto realmente <span className="text-accent">sobrou?</span>
              </p>
            </Reveal>
            <Reveal delay={250} className="mt-14 flex flex-wrap gap-2.5">
              {["combustível", "óleo", "ganhos", "pneu", "corridas", "alimentação", "contas", "manutenção", "entregas", "IPVA"].map((w, i) => (
                <span key={w} className={cn("rounded-full border border-border px-4 py-2 text-sm text-muted-foreground", i % 3 === 0 && "rotate-[-3deg]", i % 3 === 1 && "rotate-[2deg]")}>{w}</span>
              ))}
            </Reveal>
            <Reveal delay={300}>
              <p className="mt-16 max-w-2xl text-xl leading-snug font-semibold sm:text-2xl">
                Seu corre não precisa ser complicado.<br /><span className="text-accent">Sua gestão também não.</span>
              </p>
            </Reveal>
          </div>
        </section>

        {/* TRANSFORMAÇÃO */}
        <section className="bg-background py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <Reveal><Eyebrow>Da dúvida para a clareza</Eyebrow></Reveal>
            <h2 className="sr-only">Saiba quanto realmente sobra</h2>
            <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-0">
              <Reveal className="md:border-r md:border-border md:pr-12">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Antes</p>
                <ul className="mt-6 space-y-5">
                  {["Quanto eu fiz hoje?", "Quanto eu gastei?", "Será que valeu a pena?", "Quanto sobrou?"].map((q) => (
                    <li key={q} className="font-display text-2xl text-muted-foreground/70 italic sm:text-3xl">{q}</li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={200} className="md:pl-12">
                <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Depois</p><Example /></div>
                <dl className="mt-6 divide-y divide-border">
                  {[["faturados", "R$ 286,40", ""], ["gastos", "R$ 72,30", "text-negative"], ["de lucro", "R$ 214,10", "text-positive"], ["por hora", "R$ 35,90", "text-accent"]].map(([l, v, c]) => (
                    <div key={l} className="flex items-baseline justify-between gap-4 py-3">
                      <dd className={cn("num-display text-3xl sm:text-4xl", c)}>{v}</dd>
                      <dt className="text-sm text-muted-foreground">{l}</dt>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" className="scroll-mt-20 border-t border-border bg-background py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal><Eyebrow>Como funciona</Eyebrow><h2 className="mt-3 text-3xl font-bold sm:text-5xl">Quatro passos. Nenhuma planilha.</h2></Reveal>
            <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {[["01", "Registre", "Ganhos, gastos, combustível e manutenção."], ["02", "Trabalhe", "Faça seu corre normalmente."], ["03", "Entenda", "Veja quanto realmente sobrou."], ["04", "Evolua", "Acompanhe suas metas e resultados."]].map(([n, t, d], i) => (
                <li key={n}>
                  <Reveal delay={i * 120} className="border-t-2 border-foreground pt-5">
                    <p className="num-display text-5xl text-accent">{n}</p>
                    <h3 className="mt-4 text-2xl font-bold">{t}</h3>
                    <p className="mt-2 text-muted-foreground">{d}</p>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* PRODUTO */}
        <section id="produto" className="dark scroll-mt-20 overflow-hidden bg-background py-24 text-foreground sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal className="max-w-2xl">
              <Eyebrow>O app</Eyebrow>
              <h2 className="mt-3 text-3xl font-bold sm:text-5xl">Tudo do seu corre, num lugar só.</h2>
              <p className="mt-4 text-muted-foreground">Feito para usar no celular, entre uma entrega e outra.</p>
            </Reveal>
            <div className="mt-12 -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
              {[["🏍️", "Jornada", "Início, pausas e fim do seu dia"], ["💰", "Dinheiro", "Ganhos e gastos com ou sem moto"], ["⛽", "Combustível", "Quanto vai no tanque"], ["🔧", "Manutenção", "Cuidados e custos da moto"], ["🎯", "Metas", "Quanto falta para chegar lá"], ["📊", "Relatórios", "O que seus números dizem"]].map(([e, t, d], i) => (
                <Reveal key={t} delay={i * 80} className="w-[70%] shrink-0 snap-start sm:w-auto">
                  <div className="glass-panel h-full p-5 transition-transform hover:-translate-y-1">
                    <span className="text-3xl" aria-hidden="true">{e}</span>
                    <h3 className="mt-6 text-lg font-bold">{t}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* FUNCIONALIDADES (assimétrico) */}
        <section className="bg-background py-24 sm:py-32">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
            <Reveal className="lg:col-span-7">
              <div className="home-hero h-full rounded-[2rem] p-7 sm:p-10">
                <div className="flex items-center justify-between"><Eyebrow>Resultado</Eyebrow><Example /></div>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Saiba quanto realmente sobra.</h2>
                <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8">
                  {[["Faturamento", "R$ 4.280"], ["Gastos", "R$ 1.433"], ["Lucro", "R$ 2.847"], ["Lucro/hora", "R$ 31,60"]].map(([l, v], i) => (
                    <div key={l}><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{l}</p><p className={cn("num-display mt-1 text-3xl sm:text-4xl", i === 2 && "text-positive", i === 1 && "text-negative")}>{v}</p></div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={120} className="lg:col-span-5">
              <div className="h-full rounded-[2rem] border border-border p-7 sm:p-10">
                <Eyebrow>Custos da moto</Eyebrow>
                <h3 className="mt-3 text-2xl font-bold sm:text-3xl">Controle o que pesa no seu bolso.</h3>
                <div className="mt-8 space-y-5">
                  {[[Fuel, "Combustível", 62], [Wrench, "Manutenção", 28]].map(([Icon, l, p]) => {
                    const I = Icon as typeof Fuel;
                    return (
                      <div key={l as string}>
                        <div className="flex items-center justify-between text-sm font-semibold"><span className="flex items-center gap-2"><I className="size-4 text-accent" />{l as string}</span><span className="text-muted-foreground">{p as number}% dos gastos</span></div>
                        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted"><div className="report-grow h-full rounded-full bg-foreground" style={{ width: `${p}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6"><Example /></div>
              </div>
            </Reveal>
            <Reveal delay={200} className="lg:col-span-12">
              <div className="dark flex flex-col gap-6 rounded-[2rem] bg-background p-7 text-foreground sm:p-10 md:flex-row md:items-center md:justify-between">
                <div><Eyebrow>Evolução</Eyebrow><h3 className="mt-3 text-2xl font-bold sm:text-3xl">Veja como está sua evolução.</h3></div>
                <div className="flex gap-3"><span className="rounded-full bg-secondary px-5 py-3 text-sm font-bold">🎯 Metas</span><span className="rounded-full bg-secondary px-5 py-3 text-sm font-bold">📊 Relatórios</span></div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* JORNADA */}
        <section className="dark bg-background py-24 text-foreground sm:py-32">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <Reveal>
              <Eyebrow>Jornada</Eyebrow>
              <h2 className="mt-3 text-4xl leading-tight font-bold sm:text-5xl">Seu corre também tem hora para começar e terminar.</h2>
              <p className="mt-5 max-w-md text-muted-foreground">Comece, pause e encerre com um toque. O app desconta as pausas e mostra quanto vale sua hora.</p>
            </Reveal>
            <div ref={jRef} className="glass-panel p-6 sm:p-8">
              <div className="flex items-center justify-between"><Eyebrow>Linha do dia</Eyebrow><Example /></div>
              <ol className="relative mt-6 space-y-5 border-l border-border pl-6">
                {[[Play, "Início", "08:12", "text-positive"], [Pause, "Pausa", "10:45", "text-warning"], [Play, "Retomada", "11:20", "text-positive"], [Square, "Fim", "14:30", "text-foreground"]].map(([Icon, l, h, c], i) => {
                  const I = Icon as typeof Play;
                  return (
                    <li key={l as string} className={cn("report-reveal flex items-center justify-between", jIn && "is-in")} style={{ transitionDelay: `${i * 150}ms` }}>
                      <span className="absolute -left-[7px] size-3.5 rounded-full border-2 border-background bg-accent" style={{ marginTop: 2 }} />
                      <span className="flex items-center gap-2 text-sm font-semibold"><I className={cn("size-4", c as string)} />{l as string}</span>
                      <span className="num-display text-xl">{h as string}</span>
                    </li>
                  );
                })}
              </ol>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="glass-soft p-4"><p className="text-[11px] font-bold uppercase text-muted-foreground">Tempo efetivo</p><p className="num-display mt-1 text-2xl">05h 43min</p></div>
                <div className="glass-soft p-4"><p className="text-[11px] font-bold uppercase text-muted-foreground">Lucro/hora</p><p className="num-display mt-1 text-2xl text-positive"><Count to={37.4} start={jIn} /></p></div>
              </div>
            </div>
          </div>
        </section>

        {/* RELATÓRIOS + METAS */}
        <section className="bg-background py-24 sm:py-32">
          <div className="mx-auto grid max-w-7xl gap-16 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div ref={rRef}>
              <Reveal>
                <Eyebrow>Relatórios</Eyebrow>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Pare de olhar só para o quanto entrou.</h2>
                <p className="mt-3 text-lg text-muted-foreground">Entenda quanto realmente ficou.</p>
              </Reveal>
              <div className="mt-10 flex h-48 items-end gap-2 sm:gap-3" aria-hidden="true">
                {[52, 70, 44, 88, 63, 96, 74].map((h, i) => (
                  <div key={i} className="flex flex-1 flex-col justify-end gap-1">
                    <div className={cn("rounded-t-md bg-foreground transition-all duration-700 ease-out", i === 5 && "bg-accent")} style={{ height: rIn ? `${h}%` : "0%", transitionDelay: `${i * 70}ms` }} />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between text-[11px] font-semibold text-muted-foreground">{["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => <span key={d} className="flex-1 text-center">{d}</span>)}</div>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {["Faturamento", "Gastos", "Lucro", "Horas", "Lucro/hora"].map((l) => <span key={l} className="flex items-center gap-1.5"><Check className="size-4 text-accent" />{l}</span>)}
              </div>
              <div className="mt-4"><Example /></div>
            </div>

            <div ref={mRef} className="lg:pl-10">
              <Reveal>
                <Eyebrow>Metas</Eyebrow>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Trabalhar sem meta é só correr.</h2>
              </Reveal>
              <div className="mt-10 rounded-[2rem] border border-border p-7 sm:p-9">
                <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Meta do mês</p><Example /></div>
                <p className="mt-4"><span className="num-display text-5xl sm:text-6xl"><Count to={3420} decimals={0} start={mIn} /></span></p>
                <p className="mt-1 text-muted-foreground">de R$ 5.000</p>
                <div className="mt-6 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent transition-all duration-1000 ease-out" style={{ width: mIn ? "68%" : "0%" }} /></div>
                <div className="mt-3 flex justify-between text-sm font-semibold"><span>68%</span><span className="text-muted-foreground">Faltam R$ 1.580</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFÍCIOS */}
        <section className="dark bg-background py-24 text-foreground sm:py-32">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <Reveal><h2 className="text-5xl leading-[0.95] font-extrabold tracking-tight sm:text-7xl">Mais controle.<br /><span className="text-muted-foreground">Menos dúvida.</span></h2></Reveal>
            <div className="mt-14 space-y-1">
              {["Você entende seu lucro.", "Você sabe para onde seu dinheiro está indo.", "Você acompanha seu custo.", "Você sabe quanto vale sua hora.", "Você consegue tomar decisões melhores."].map((t, i) => (
                <Reveal key={t} delay={i * 90}>
                  <p className="border-b border-border py-5 text-xl font-semibold sm:text-3xl"><span className="mr-4 text-accent">—</span>{t}</p>
                </Reveal>
              ))}
            </div>
            <Reveal delay={200} className="mt-16">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Vem por aí</p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {["🏆 Evolução", "👥 Comunidade", "🎁 Recompensas", "🛒 Vantagens"].map((t) => (
                  <span key={t} className="rounded-full border border-dashed border-border px-4 py-2 text-sm text-muted-foreground">{t} <span className="ml-1 text-[10px] font-bold uppercase">Em breve</span></span>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* PLANOS */}
        <section id="planos" className="scroll-mt-20 bg-background py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center">
              <Eyebrow>Planos</Eyebrow>
              <h2 className="mt-3 text-3xl font-bold sm:text-5xl">Escolha como quer pagar.</h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground">Todos os planos liberam o app completo. Muda só o período.</p>
            </Reveal>
            <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-3 md:items-stretch">
              {PLANS.map((p, i) => {
                const featured = p.name === "Pro";
                return (
                  <Reveal key={p.name} delay={i * 100} className={cn(featured && "md:-my-4")}>
                    <article className={cn("relative flex h-full flex-col rounded-[2rem] p-7", featured ? "dark bg-background text-foreground shadow-2xl" : "border border-border bg-card")}>
                      {p.badge ? <span className={cn("absolute -top-3 left-7 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider", featured ? "bg-accent text-accent-foreground" : "bg-foreground text-background")}>{p.badge}</span> : null}
                      <h3 className="text-sm font-bold uppercase tracking-[0.2em]">{p.name}</h3>
                      <p className="mt-5 flex items-end gap-1"><span className="num-display text-4xl">{p.price}</span><span className="pb-1 text-sm text-muted-foreground">{p.period}</span></p>
                      <p className="mt-1 h-5 text-sm font-semibold text-accent">{p.monthly ?? ""}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{p.charge}</p>
                      <ul className="mt-7 flex-1 space-y-3">
                        {PLAN_FEATURES.map((f) => <li key={f} className="flex items-center gap-2 text-sm"><Check className="size-4 shrink-0 text-accent" />{f}</li>)}
                      </ul>
                      <Button asChild variant={featured ? "default" : "outline"} className="mt-8 h-12 w-full rounded-full font-bold">
                        <Link to="/planos" onClick={() => trackClick(`Escolher ${p.name}`)} aria-label={`Escolher plano ${p.name} ${p.plan}`}>Escolher {p.name}<ArrowRight /></Link>
                      </Button>
                    </article>
                  </Reveal>
                );
              })}
            </div>
            <p className="mt-10 text-center text-sm text-muted-foreground">Ainda não decidiu? Crie sua conta e use tudo grátis por 24 horas, sem cartão.</p>
          </div>
        </section>

        {/* CONFIANÇA */}
        <section className="border-y border-border bg-background py-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
            {[["Teste antes de pagar", "24 horas com o app completo, sem cartão."], ["Seus dados são seus", "Cada conta vê só os próprios registros."], ["Pagamento seguro", "Checkout por plataforma de pagamento especializada."], ["Fale com gente", "contato@gestaomotocapro.com.br"]].map(([t, d]) => (
              <div key={t}><h3 className="font-bold">{t}</h3><p className="mt-1 text-sm break-words text-muted-foreground">{d}</p></div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 bg-background py-24 sm:py-28">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <div><Eyebrow>Dúvidas</Eyebrow><h2 className="mt-3 text-3xl font-bold sm:text-5xl">Perguntas frequentes</h2></div>
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((f, i) => (
                <AccordionItem key={f.q} value={`f-${i}`} className="border-border">
                  <AccordionTrigger className="min-h-16 text-left text-base font-semibold hover:no-underline">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-base leading-7 text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="dark relative overflow-hidden bg-background py-28 text-center text-foreground sm:py-36">
          <div className="lp-glow pointer-events-none absolute top-1/2 left-1/2 size-[600px] -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
          <Reveal className="relative mx-auto max-w-4xl px-4">
            <h2 className="text-4xl leading-[1.02] font-extrabold tracking-tight sm:text-6xl lg:text-7xl">Seu corre já é difícil.<br /><span className="text-accent">Sua gestão não precisa ser.</span></h2>
            <p className="mx-auto mt-6 max-w-md text-lg text-muted-foreground">Comece a entender hoje quanto realmente sobra.</p>
            <div className="mt-10"><StartCta /></div>
          </Reveal>
        </section>
      </main>

      <footer id="contato" className="dark border-t border-border bg-background pb-24 text-foreground lg:pb-0">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Logo />
          <div className="flex flex-col gap-4 lg:items-end">
            <nav className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground" aria-label="Links institucionais">
              <a href="#faq" className="min-h-12 content-center hover:text-foreground">Termos de Uso</a>
              <Link to="/privacidade" className="min-h-12 content-center hover:text-foreground">Política de Privacidade</Link>
              <a href="#contato" className="min-h-12 content-center hover:text-foreground">Contato</a>
            </nav>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:gap-x-6">
              <a href="https://www.instagram.com/gestaomotocapro/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 hover:text-accent"><Instagram className="size-4" aria-hidden="true" />@gestaomotocapro</a>
              <a href="mailto:contato@gestaomotocapro.com.br" className="inline-flex min-h-12 items-center gap-2 break-all hover:text-accent"><Mail className="size-4 shrink-0" aria-hidden="true" />contato@gestaomotocapro.com.br</a>
            </div>
          </div>
        </div>
        <div className="border-t border-border px-4 py-5 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Gestão Motoca Pro. Seu corre sob controle.</div>
      </footer>

      {/* CTA fixo no celular */}
      <div className={cn("dark fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur-xl transition-transform duration-300 lg:hidden", showSticky ? "translate-y-0" : "translate-y-full")}>
        <Button asChild className="h-12 w-full rounded-full font-bold uppercase tracking-wider">
          <Link to="/auth" search={{ mode: "signup" }} onClick={() => trackClick("Começar agora (fixo)")} tabIndex={showSticky ? 0 : -1}>Começar agora<ArrowRight /></Link>
        </Button>
      </div>
    </div>
  );
}
