# Gestão Motoboy MVP

- [x] Base visual, autenticação, onboarding e banco protegido
- [x] Dashboard e lançamentos financeiros
- [x] Motos, abastecimentos, manutenção e documentos
- [x] Metas, jornada, relatórios, insights e perfil
- [x] Validação autenticada dos fluxos principais no celular
- [x] Área administrativa segura para consultar motos, ganhos, gastos e abastecimentos de todos os usuários
- [x] Substituir integralmente Kiwify por Cakto: confirmar contrato oficial, migrar banco/configurações, endpoint seguro, processamento idempotente, logs e administração
- [x] Configurar os planos Cakto da imagem: Start mensal R$ 29,90, Pro trimestral R$ 69,90 e Elite anual R$ 199,90
- [ ] Validar o endpoint POST público da Cakto, respostas HTTP 200, bloqueios e logs; informar a URL completa
- [x] Confirmar o backend conectado e funções existentes; documentar o endpoint compatível com a infraestrutura atual
- [x] Confirmação concluída; integração Cakto retomada por solicitação
- [x] Reavaliar payload oficial: um produto Cakto com três ofertas; usar `data.offer.id` para identificar cada plano
- [ ] Publicar `cakto-webhook` sem exigir o segredo na etapa de publicação e confirmar a URL pública exata
