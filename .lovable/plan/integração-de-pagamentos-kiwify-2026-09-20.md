# Integração de pagamentos Kiwify

## Objetivo
Adicionar assinaturas Mensal (R$ 29,90/mês) e Anual (R$ 99,90/ano) ao aplicativo existente, renomeando a marca visível para **Gestão Motoboy** e preservando autenticação, dados financeiros, motos, manutenção, metas, relatórios, insights e administração.

## Decisões confirmadas
- Cadastro → página de planos → confirmação do pagamento → onboarding da moto.
- Todas as áreas do aplicativo exigem assinatura, exceto autenticação, planos, retorno do pagamento e perfil básico.
- Administradores continuam acessando a área administrativa.
- Cancelamento não apaga dados e mantém acesso até o fim do período já pago; reembolso e chargeback bloqueiam o acesso.
- Acesso premium será decidido pelo backend, nunca por parâmetros do navegador ou pelo simples retorno do checkout.

## Banco e regras de acesso
- Criar `subscriptions` com vínculo único ao usuário, e-mail normalizado, plano, estado, identificadores Kiwify, início, fim do período, cancelamento e timestamps.
- Criar `webhook_events` para auditoria e idempotência, com identificador único derivado do evento/transação, tipo, transação, payload protegido, processamento, erro e timestamps.
- Aplicar permissões explícitas, RLS e índices. Usuários leem apenas a própria assinatura; gravações de pagamento ficam restritas ao backend verificado.
- Criar uma função central `has_active_subscription(user_id)` que considera `active` e, para cancelamentos, o período pago ainda vigente. Estados: `pending`, `active`, `canceled`, `expired`, `refunded`, `chargeback`.
- Não alterar nem duplicar usuários, papéis administrativos ou dados históricos.

## Webhook Kiwify
- Criar `POST /api/public/webhooks/kiwify`, sem autenticação de usuário e com validação própria antes de qualquer gravação privilegiada.
- Usar somente eventos documentados pela Kiwify: `compra_aprovada`, `subscription_renewed`, `subscription_canceled`, `subscription_late`, `compra_reembolsada` e `chargeback`.
- Validar corpo, produto configurado, comprador e e-mail; localizar a conta existente pelo e-mail normalizado. E-mail desconhecido gera log não processado e nunca cria usuário ou acesso.
- Garantir idempotência com chave única estável por evento/tipo/transação e transação atômica no banco.
- Compra aprovada e renovação ativam/atualizam o período; cancelamento registra a data e preserva o acesso até o vencimento; reembolso e chargeback bloqueiam; atraso não inventa expiração e será tratado conforme os campos oficiais recebidos.
- Responder com códigos HTTP apropriados e mensagens sem dados sensíveis.
- Como a documentação pública do webhook comercial não expõe de forma inequívoca o algoritmo de autenticação nem o payload completo, o endpoint ficará em modo seguro: nenhum evento será aceito até o segredo/token e uma amostra oficial do “Testar Webhook” confirmarem o método e os campos. Não será copiado o esquema Ed25519 da Conta Digital, pois ele pertence a outro produto da Kiwify.

## Backend e segurança
- Criar funções autenticadas para consultar a própria assinatura e verificar novamente o pagamento.
- Centralizar a regra TypeScript `hasActiveSubscription(userId)` sobre a função segura do banco e reutilizá-la em operações premium do backend.
- Proteger também as mutações premium existentes no servidor/banco, não apenas esconder telas.
- Validar entradas, limitar tamanho do payload, aplicar comparação segura do segredo quando o método oficial for confirmado e nunca expor chaves no navegador.
- Manter a proteção administrativa existente e ampliar a consulta admin para assinaturas, após validar o papel no backend.

## Planos, retorno e paywall
- Criar página autenticada de planos com Mensal e Anual, destaque “ECONOMIZE” no anual e URLs reais lidas de configuração segura pelo backend.
- Não criar links falsos: enquanto as URLs não forem cadastradas, os botões informarão que o checkout ainda não foi configurado.
- Pré-preencher o e-mail no checkout somente conforme parâmetros oficialmente suportados pela Kiwify.
- Criar tela de retorno que consulta o backend e mostra “Pagamento confirmado” ou “Estamos confirmando seu pagamento”, com botão “Verificar pagamento novamente”.
- Adicionar uma proteção central no layout das áreas premium. Sem assinatura, o usuário vê “Esse recurso faz parte do plano premium.” e “Ver planos”.
- Ajustar cadastro para ir aos planos; após ativação, encaminhar ao onboarding. Usuários existentes sem assinatura serão direcionados aos planos, sem perda de dados.

## Perfil e administração
- Adicionar “Minha assinatura” ao perfil: plano, estado traduzido, início, renovação/expiração e identificador quando existir.
- “Gerenciar assinatura” explicará que o link oficial é enviado por e-mail pela Kiwify; só redirecionará se houver URL oficial segura disponível.
- Adicionar “Assinaturas” ao painel administrativo com totais por plano/estado e últimas assinaturas, sem mostrar payloads completos ou dados sensíveis.
- Disponibilizar logs resumidos para diagnóstico administrativo, mantendo o payload completo somente no banco protegido.

## Marca e conteúdo
- Renomear textos, títulos, metadados, logo textual e mensagens de **MotoFinance** para **Gestão Motoboy**, preservando a direção visual Frosted Glass e as funcionalidades atuais.
- Adicionar metadados próprios às novas páginas de planos e retorno.

## Configuração necessária
- Secrets do backend: `KIWIFY_API_KEY` (somente se a API for usada) e `KIWIFY_WEBHOOK_SECRET`/token oficial.
- Configuração de produto/checkout: `KIWIFY_MONTHLY_PRODUCT_ID`, `KIWIFY_ANNUAL_PRODUCT_ID`, `KIWIFY_MONTHLY_CHECKOUT_URL`, `KIWIFY_ANNUAL_CHECKOUT_URL`.
- Primeiro criar e disponibilizar o endpoint. Depois solicitar o segredo/token pelo formulário seguro e configurar, na Kiwify, a URL estável publicada com os seis eventos documentados.

## Testes e entrega
- Testar mensal e anual com eventos oficiais de teste; aprovação, renovação, cancelamento, reembolso, chargeback, atraso e e-mail inexistente.
- Reenviar o mesmo evento e confirmar uma única assinatura/alteração.
- Rejeitar segredo inválido, produto desconhecido e payload inválido sem liberar acesso.
- Verificar usuário sem assinatura, ativo, cancelado ainda vigente e expirado, em celular e desktop.
- Confirmar que dados históricos permanecem após bloqueio e que a administração exige papel admin.
- Entregar resumo dos arquivos, tabelas, endpoint, variáveis, configuração da Kiwify, eventos, compra de teste, logs, cancelamento e reembolso.

## Dependência externa explícita
A ativação real exige os dois links de checkout, IDs dos produtos, segredo/token do webhook e uma amostra oficial enviada por “Testar Webhook”. A estrutura e o modo seguro podem ser implementados antes; o processamento real só será habilitado após esses valores confirmarem o contrato oficial.
