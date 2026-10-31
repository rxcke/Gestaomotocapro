# Central de Administração por módulos

## Objetivo
Transformar a página única `/admin` em uma Central de Administração com layout próprio (menu lateral no desktop, navegação adaptada no celular) e módulos independentes, reutilizando todas as funcionalidades existentes e mantendo a identidade visual (fundo escuro, destaque laranja, tokens semânticos já existentes).

## Estrutura de rotas

`admin.tsx` vira um **layout** (só `<Outlet />` + shell administrativo). O gate `beforeLoad` com `has_role('admin')` sobe para o layout e protege todos os filhos; cada server function mantém a verificação de administrador no servidor (segurança real continua no backend).

| Rota | Módulo | Origem |
|---|---|---|
| `/admin` | Visão geral | novo (admin.index.tsx) |
| `/admin/usuarios` | Usuários | extraído da aba "Usuários" |
| `/admin/assinaturas` | Assinaturas | extraído da aba "Assinaturas" |
| `/admin/financeiro` | Financeiro | agregados das abas Ganhos/Gastos/Abastecimentos/Motos |
| `/admin/recompensas` | Clube de Recompensas | `admin_.recompensas.tsx` renomeado para `admin.recompensas.tsx` (passa a herdar o layout) |
| `/admin/embaixadores` | Embaixadores | extraído (lista + ação "Tornar embaixador" + indicações) |
| `/admin/webhooks` | Webhooks | extraído da aba "Webhooks" + filtros |

**Configurações**: não existe funcionalidade real hoje → módulo fica oculto (conforme o requisito de não criar módulos vazios).

## Camada de dados (sem migrações, sem mudar RLS)

Hoje `getAdminData` baixa tudo de uma vez. Será dividida em server functions por módulo, todas com `requireSupabaseAuth` + `has_role('admin')` no servidor e `supabaseAdmin` carregado dentro do handler:

- `getAdminOverview` — contadores: total de usuários, assinaturas ativas, novos cadastros por período (7d/30d/tudo), canceladas/expiradas, eventos de webhook com atenção (não processados/com erro), resgates pendentes (de `reward_redemptions`).
- `getAdminUsers` — busca por nome/e-mail, filtros de acesso (admin/embaixador/assinante/demonstração) e situação da assinatura, paginação no servidor.
- `getAdminSubscriptions` — filtros por status e plano, busca por e-mail; planos históricos (trimestral/Pro) preservados.
- `getAdminFinancial` — somente agregados: totais e quantidades de ganhos, gastos, abastecimentos e motos, com rótulo claro de "dados registrados pelos usuários, não faturamento da plataforma".
- `getAdminWebhooks` — filtros por tipo de evento e status, busca por transação, detalhe do evento; reprocessamento autorizado preservado.
- Clube: reutiliza `rewards-admin.functions.ts` sem alteração.

## Telas

- **Visão geral**: cards de indicadores, filtro de período para novos cadastros, atividade recente (últimos cadastros e eventos de webhook), alertas (webhooks com atenção, resgates pendentes) e atalhos para os módulos.
- **Usuários**: tabela com busca, filtros, paginação, identificação Admin/Embaixador/Assinante/Demonstração, ação "Tornar embaixador" com confirmação (inalterada) e exportação CSV restrita a administradores (inalterada).
- **Assinaturas**: distribuição por plano, listas por status, busca; regras de assinatura e integração Cakto intocadas.
- **Financeiro**: agregados com aviso explícito de que são registros dos usuários; sem cálculo de receita comercial.
- **Embaixadores**: identificação, situação, código de indicação e link de WhatsApp existente; sem comissões ou vendas inventadas.
- **Webhooks**: painel atual + filtros, busca, visualização detalhada e marcação de eventos que exigem atenção; idempotência e segurança preservadas.

## Componentes reutilizáveis

`src/components/admin/`: `AdminShell` (menu lateral desktop + navegação mobile), `AdminTable`, `FilterBar`, `EmptyState`, estados de carregamento/erro. Tokens semânticos existentes (`bg-canvas`, `accent`, `border` etc.) — nenhuma cor fixa nova.

## O que NÃO muda

- Autenticação, recuperação de senha, assinaturas, webhooks Cakto, registros financeiros dos usuários.
- Ledger de pontos, regras do Clube, RLS, funções protegidas.
- Nenhuma migração de banco; nenhuma permissão ampliada.
- Link "Clube de Recompensas" e demais referências a `/admin/recompensas` continuam válidos.

## Testes e validação

- Testes de unidade para helpers novos (filtros/paginação/rotulos) em `src/lib/admin-view.test.ts`.
- `bun test` completo + `tsgo` + build.
- Playwright no preview com a sessão do administrador: cada módulo em desktop e 360px, busca/filtros/paginação, estados vazio/erro, e confirmação de que um não-admin continua redirecionado.
- Sem publicação automática.
