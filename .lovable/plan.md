# Finalizar webhook da Cakto

## Implementação
- Ajustar o endpoint público `cakto-webhook` para aceitar somente o produto informado e identificar Start, Pro e Elite exclusivamente por `data.offer.id`.
- Validar a autenticação da Cakto antes de qualquer gravação e manter o segredo fora dos registros.
- Processar aprovação, criação/renovação/retomada, atraso/pausa, cancelamento, reembolso e chargeback, com idempotência por evento.
- Registrar eventos aceitos e rejeitados para diagnóstico, preservando apenas dados necessários e sem dados sensíveis.
- Manter a assinatura vinculada ao usuário pelo e-mail, com plano, status, início, vencimento e identificadores da Cakto.

## Configuração
- Salvar `CAKTO_PRODUCT_ID` com o Product ID real fornecido.
- Deixar `CAKTO_START_OFFER_ID`, `CAKTO_PRO_OFFER_ID`, `CAKTO_ELITE_OFFER_ID` e `CAKTO_WEBHOOK_SECRET` pendentes até os valores reais serem informados com segurança.
- Manter os links de checkout separados por oferta, sem usar preço ou nome para identificar planos.

## Validação e publicação
- Verificar respostas para método incorreto, autenticação inválida, produto desconhecido, oferta desconhecida e payload inválido.
- Publicar o aplicativo e confirmar que a URL pública real alcança o endpoint.
- Informar URL, método, eventos, payload esperado, secrets pendentes, teste e consulta dos registros.

## Detalhes técnicos
- O webhook será uma rota pública TanStack Start sob `/api/public/cakto-webhook`, adequada à infraestrutura atual do projeto.
- As alterações no banco continuarão centralizadas na função transacional existente, que impede duplicidade por `event_id`.
