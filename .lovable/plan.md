# Auditoria e melhoria do fluxo pós-compra

## Objetivo
Tornar a entrada no aplicativo previsível: autenticar, verificar assinatura no servidor, concluir o cadastro quando necessário e abrir o painel, sem tocar na integração Cakto ou na lógica financeira.

## Ajustes propostos
- Centralizar a decisão de destino após login, Google e confirmação de e-mail: assinatura ativa + cadastro incompleto vai ao onboarding; ativa + cadastro completo vai ao painel; sem acesso ativo vai aos planos.
- Preservar uma rota privada originalmente solicitada apenas quando ela for compatível com o estado atual da conta, evitando retorno indevido ao checkout ou ao onboarding.
- Corrigir o pós-cadastro por e-mail para usar a mesma decisão de acesso, em vez de sempre abrir os planos.
- Fazer a confirmação de pagamento encaminhar contas completas ao painel e contas incompletas ao onboarding.
- Impedir que contas com cadastro já concluído voltem ao onboarding; contas sem assinatura continuam nos planos.
- Tornar o onboarding recuperável: salvar cada etapa concluída, restaurar o progresso após sair e validar nome, marca, modelo, ano, placa e quilometragem com mensagens claras.
- Evitar gravação parcial no encerramento do onboarding e mostrar falhas sem tela vazia ou botão travado.
- Manter e-mail somente leitura e derivado da identidade autenticada.

## Experiência no celular
- Preservar campos e botões de 48 px, melhorar alvos das escolhas de uso e garantir que estados de carregamento, erro e salvamento sejam claros.
- Revisar login, callback, planos, confirmação, onboarding e painel em viewport móvel.

## Validação
- Exercitar os cenários A–M com sessões controladas e estados já existentes, sem compras ou assinaturas novas.
- Confirmar acesso negado no servidor/banco para assinatura ausente ou inativa e acesso normal para assinatura ativa.
- Verificar atualização da página, logout/login, rota privada sem sessão e Google conforme o fluxo gerenciado disponível.
- Confirmar por inspeção final que webhook, Product ID, Offer IDs, segredo e processamento financeiro não foram alterados.

## Detalhes técnicos
- Criar um resolvedor autenticado de destino baseado em perfil + `getSubscriptionAccess`, reutilizado pelas telas de autenticação e retorno.
- Manter as rotas sob o layout protegido existente e o middleware de autorização do servidor.
- Não alterar tabelas, migrações, endpoint Cakto ou funções de processamento de assinatura.
