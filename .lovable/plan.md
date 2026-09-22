# Auditoria e fortalecimento de contas, acesso e Cakto

## O que foi encontrado
- E-mail/senha e Google já estão habilitados; o botão Google e o perfil automático já existem.
- Todas as 5 contas atuais possuem perfil correspondente, e as rotas privadas usam a proteção central do projeto.
- Falta um observador global de sessão para atualizar telas e limpar dados quando login, logout ou conta mudarem.
- Cadastro, login e recuperação exibem alguns erros técnicos; o reset não valida claramente um link expirado e não confirma a senha digitada.
- A confirmação por e-mail volta para a página inicial, sem um retorno dedicado que conclua o acesso e encaminhe o usuário.
- O e-mail salvo no perfil pode ser alterado pelo próprio cliente, embora ele seja usado para vincular compras Cakto. Isso cria risco de uma assinatura ser associada à conta errada.
- O banco impede usuários de alterar plano/status e isola os dados por usuário, mas funções administrativas antigas ainda têm permissões mais amplas que o necessário.
- O webhook valida secret, produto e Offer ID, é idempotente e não usa preço/nome como fallback. O mapeamento Start/Pro/Elite e os checkouts estão corretos.
- Pausa e atraso hoje aparecem apenas como “pendente”, sem distinguir a causa; uma ativação sem vencimento recebido pode ficar sem prazo.
- O fluxo de confirmação de pagamento consulta indefinidamente a cada cinco segundos.
- A dependência principal do servidor possui dois alertas conhecidos em uma dependência transitiva e será atualizada apenas se houver versão compatível.

## Implementação

### 1. Autenticação e sessão
- Manter a tela `/auth`, adicionando suporte direto aos modos de entrar, criar conta e recuperar senha sem duplicar formulários.
- Criar um retorno público `/auth/callback` para confirmação de e-mail e retornos completos do Google, sempre aceitando apenas destinos internos seguros.
- Adicionar um único observador global de autenticação para atualizar a navegação, invalidar dados após login e limpar dados protegidos no logout.
- Preservar sessão entre atualizações e navegação usando o cliente de autenticação atual e a proteção central existente.
- Preservar o destino pretendido quando uma rota privada enviar o usuário para entrar.
- Traduzir erros comuns de cadastro/login, impedir envios duplicados e oferecer reenvio da confirmação de e-mail.
- Fortalecer validação de nome, e-mail e senha; confirmar a senha no cadastro e no reset.
- Validar explicitamente o retorno de recuperação antes de permitir a troca de senha.
- Manter Google pelo OAuth gerenciado do Lovable Cloud, sem segredos no navegador, com tratamento de cancelamento e falha.

### 2. Perfil e segurança do banco
- Tornar o e-mail do perfil somente leitura para o usuário; ele continuará vindo da identidade autenticada.
- Garantir unicidade do e-mail normalizado usado para associar uma compra, evitando associação ambígua.
- Completar novos perfis com nome, e-mail, avatar e provedor quando disponíveis na identidade autenticada, sem campos supérfluos.
- Restringir a execução das funções sensíveis de assinatura ao servidor e remover acesso anônimo indevido às funções auxiliares.
- Manter RLS e as regras atuais que isolam motos, ganhos, gastos, abastecimentos, documentos, metas, jornadas e perfis por usuário.
- Manter papéis administrativos em tabela separada e a validação administrativa no servidor.

### 3. Assinatura e acesso
- Manter `has_active_subscription` como fonte única de verdade no banco e `getSubscriptionAccess` como consulta protegida.
- Distinguir os estados `paused` e `late`, preservando histórico de eventos, cancelamentos, reembolsos e chargebacks.
- Definir vencimento seguro quando a Cakto não enviar a próxima cobrança: mensal +1 mês, trimestral +3 meses e anual +1 ano, usando a data real do evento como base.
- Continuar bloqueando imediatamente pausa, atraso, cancelamento, reembolso e chargeback; reativação e recuperação voltam a ativar.
- Limitar a consulta automática da tela de confirmação e oferecer nova tentativa manual após o prazo.
- Exibir no perfil o plano e todos os estados relevantes de forma clara.

### 4. Cakto e checkout preservados
- Manter exatamente `POST https://gear-gain-guide.lovable.app/api/public/cakto-webhook`.
- Manter a autenticação com `CAKTO_WEBHOOK_SECRET`, sem revelar seu valor.
- Manter o produto `445eb294-73d6-4dd8-b2f7-d2524190c0f9` e os Offer IDs Start `9bnu895_1126693`, Pro `wyjkmbe`, Elite `39vyq8b`.
- Determinar plano exclusivamente por `data.offer.id`; preço e nome permanecem somente na auditoria.
- Manter rejeição de produto/oferta desconhecidos, inclusive o payload genérico de teste da Cakto.
- Manter idempotência e logs sanitizados, sem registrar secret ou dados pessoais desnecessários.
- Manter as três URLs públicas de checkout resolvidas no servidor pelas variáveis atuais e validar HTTPS e o domínio oficial da Cakto.
- Não alterar a integração por causa do bloqueio externo “produto ainda não disponível para venda”.

### 5. Testes e validação
- Testar cadastro, conta duplicada, login, logout, persistência, recuperação e rotas privadas em desktop e celular.
- Testar Google até o limite permitido pelo provedor externo, confirmando início, cancelamento/erro e retorno público sem expor credenciais.
- Testar usuário sem assinatura e usuário ativo, incluindo atualização da tela de perfil e bloqueio no banco.
- Exercitar o webhook com payloads locais assinados para Start, Pro e Elite e para renovação, cancelamento, pausa, reativação, atraso, recuperação, reembolso, chargeback, duplicidade, produto/oferta desconhecidos e assinatura inválida.
- Não simular compra no checkout bloqueado da Cakto; validar o processamento sem concluir venda externa.
- Executar verificações de segurança, banco e dependências após as mudanças.

## Configuração externa que permanecerá
- Google gerenciado pelo Lovable Cloud já está habilitado e não exige Client ID ou Client Secret no frontend.
- Caso futuramente seja usado um cliente Google próprio, as credenciais devem ser cadastradas somente em Cloud → Users → Auth Settings → Google; a URL de retorno será a exibida nessa tela, sem inventar valores.
- A indisponibilidade comercial dos três checkouts continua sendo uma pendência exclusiva da Cakto.

## Limites
- Nenhum Product ID, Offer ID, checkout ou secret será alterado.
- Nenhuma funcionalidade fora de autenticação, perfil, acesso, assinatura, checkout e webhook será modificada.
