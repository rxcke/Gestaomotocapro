# Adicionar WhatsApp ao cadastro e perfil

## Objetivo
Reutilizar o campo `phone` já existente em `profiles`, exigindo um celular brasileiro válido no cadastro por e-mail e quando uma conta Google ainda não tiver telefone. Cakto continuará vinculando assinaturas somente pelo e-mail.

## Implementação
- Criar uma validação única de celular brasileiro para cadastro, onboarding e perfil.
- Exibir máscara `(31) 99999-9999`, aceitar apenas um celular válido e salvar no padrão internacional normalizado, como `+5531999999999`.
- Adicionar **Nome completo**, **WhatsApp / Celular**, **E-mail**, **Senha** e **Confirmar senha** ao cadastro por e-mail; enviar nome e telefone normalizado nos dados do cadastro.
- Atualizar o gatilho que cria/atualiza `profiles` para copiar o telefone do cadastro sem criar perfil duplicado, mantendo o `ON CONFLICT` atual.
- Proteger o banco contra telefones em formato inválido, permitindo `NULL` apenas para contas antigas ou ainda incompletas.
- No fluxo Google, verificar o telefone antes do restante do fluxo: se estiver ausente, abrir o primeiro passo do onboarding; após salvar, continuar para planos ou onboarding normal conforme o acesso atual.
- Não pedir o telefone novamente quando ele já estiver preenchido e válido.
- Adicionar visualização e edição do WhatsApp no perfil, usando a política atual que limita alterações ao próprio usuário.

## Testes
- Cadastro por e-mail com telefone válido e rejeição de número inválido.
- Normalização e máscara de celular brasileiro.
- Conta Google sem telefone e conta Google com telefone já salvo.
- Edição e persistência do telefone após atualizar a página.
- Revisão visual do cadastro, onboarding e perfil em tela de celular.
- Confirmar que autenticação, Cakto, webhook, assinaturas e controle de acesso não foram alterados.
