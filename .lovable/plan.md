# Landing page de conversão — Gestão Motoca Pro

## Objetivo
Substituir a página inicial atual por uma landing page completa, mobile-first e focada em mostrar, de forma simples, quanto realmente sobra para quem trabalha de moto.

## O que será construído
- Cabeçalho fixo e compacto com logo, navegação por seções, acesso à conta e menu móvel.
- Abertura com a mensagem principal, dois botões claros e uma demonstração visual leve do painel com ganhos, gastos e resultado.
- Seções de dores reais, fluxo simples da ferramenta, benefícios, comparação antes/depois e quatro passos de uso.
- Área de planos com Start, Pro e Elite, mantendo preços e fluxo de assinatura já existentes.
- Perguntas frequentes, chamada final e rodapé com links institucionais.
- Animações discretas, estados de foco, contraste e áreas de toque adequadas.

## Fluxo de conversão
- Botões gerais levam ao cadastro/entrada.
- Cada plano leva ao fluxo autenticado já existente, que abre o checkout configurado para o plano escolhido.
- Nenhum link de checkout, plano, regra de acesso ou integração será recriado ou alterado.

## Detalhes técnicos
- A página ficará em `src/routes/index.tsx`, com componentes visuais locais e reutilização do design system atual.
- A navegação interna usará âncoras somente para as seções da própria landing page.
- O painel demonstrativo será feito com HTML/CSS e ícones leves, sem imagens pesadas.
- Serão atualizados os metadados específicos da página inicial: título, descrição, Open Graph, URL canônica e URL social.
- A validação visual cobrirá celular pequeno, celular grande, tablet, notebook, desktop e ultrawide, sem scroll horizontal.

## Fora do escopo
- Banco de dados, autenticação, webhooks, Cakto, assinaturas, rotas internas e funcionalidades do aplicativo não serão alterados.
