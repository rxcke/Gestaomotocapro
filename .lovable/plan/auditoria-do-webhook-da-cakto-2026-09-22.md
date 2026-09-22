# Auditoria do webhook da Cakto

## Implementação
- Manter Product ID, Offer IDs, secret e regras atuais sem alterações.
- Ampliar o payload sanitizado de auditoria para registrar `product.id`, `offer.id`, `offer.name`, `offer.price` e o tipo do evento.
- Preservar o status de processamento já registrado em `processed`, `processed_at` e `error_message`.
- Continuar bloqueando produto ou oferta não reconhecidos, sem fallback por preço ou nome.

## Validação
- Confirmar que eventos reconhecidos seguem para ativação e que IDs divergentes permanecem sem acesso.
- Verificar que secrets, e-mail e outros dados sensíveis não entram no payload de auditoria.
