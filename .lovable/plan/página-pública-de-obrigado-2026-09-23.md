# Página pública de obrigado

## Objetivo
Criar a rota pública `/obrigado` como página pós-compra do Gestão Motoca Pro, mantendo intactos autenticação, Cakto, webhook, banco, checkout, planos, dashboard e landing page.

## Implementação
- Criar uma página mobile-first com a logo existente, identidade preta/laranja, confirmação visual e o texto solicitado.
- Direcionar o botão principal para o login existente em `/auth`.
- Não usar parâmetros da URL como prova de pagamento.
- Quando houver uma sessão autenticada, reutilizar a consulta segura de assinatura já existente e atualizar o status por alguns instantes:
  - assinatura ativa: mostrar “ACESSO LIBERADO!”;
  - consulta em andamento: mostrar “Estamos confirmando seu acesso...”;
  - confirmação não recebida após a espera ou erro recuperável: mostrar “Pagamento em processamento” e “TENTAR NOVAMENTE”.
- Quando não houver sessão identificável, mostrar o estado de processamento, sem afirmar que a assinatura está ativa.
- Adicionar metadados exclusivos com `noindex,nofollow`; não incluir a rota no sitemap.

## Validação
- Confirmar acesso público direto a `/obrigado`.
- Validar os três estados visuais sem alterar dados reais.
- Testar o botão para `/auth`.
- Conferir ausência de rolagem horizontal em 360, 390, 430 px e desktop.
- Confirmar que `/` e os links/arquivos do fluxo Cakto não foram modificados.
- Rodar testes existentes e checagem de tipos.

## Detalhes técnicos
- A página será um novo arquivo de rota pública do TanStack Router.
- A confirmação autenticada reutilizará `getSubscriptionAccess`; nenhuma nova lógica de pagamento será criada.
- Estados de prévia/teste serão exercitados sem parâmetros públicos que possam falsificar pagamento.
