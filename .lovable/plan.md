# Acesso administrativo sem assinatura

## Objetivo
Permitir que uma conta com a role `admin` registrada no banco opere os próprios dados sem assinatura ativa, mantendo usuários comuns, anônimos e acessos entre contas bloqueados.

## Alterações
- Criar uma única migration aditiva para ajustar somente as políticas RLS de:
  - motos;
  - ganhos;
  - gastos;
  - abastecimentos;
  - manutenções;
  - metas;
  - documentos;
  - notificações.
- Preservar em todas elas a condição obrigatória `auth.uid() = user_id`.
- Trocar apenas o requisito de assinatura por: assinatura ativa **ou** `has_role(auth.uid(), 'admin')`.
- Manter a política de jornadas como está, pois ela já usa exatamente essa regra.
- Não alterar `profiles`, `subscriptions`, `user_roles`, Cakto, autenticação, sincronizações ou código visual.

## Segurança
- A role continuará vindo exclusivamente de `public.user_roles` e sendo consultada por `public.has_role` no banco.
- `user_roles` continuará somente com leitura do próprio registro; não haverá política de inserção, edição ou exclusão para o cliente.
- O administrador continuará limitado aos registros cujo `user_id` seja o próprio `auth.uid()` nas operações comuns.
- RLS permanecerá ativa e nenhuma tabela ganhará acesso público.

## Validação
- Testar no banco, sem persistir dados reais: admin sem assinatura, usuário comum com assinatura, usuário comum sem assinatura e anônimo.
- Em cada perfil aplicável, validar motos, ganhos, gastos, combustível, manutenção, metas e jornadas.
- Testar falsificação de `user_id`, tentativa de alterar a própria role e leitura de dados privados de outro usuário.
- Confirmar que os gatilhos de combustível/manutenção e o vínculo com jornada continuam funcionando sem duplicidade.
- Executar os 27 testes existentes, checagem de tipos e uma verificação autenticada de console/rede.
