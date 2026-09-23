# Sincronização entre abastecimentos e gastos

## Escopo

Corrigir somente o vínculo financeiro de abastecimentos, preservando autenticação, assinaturas, jornadas, manutenção e demais módulos.

## Diagnóstico confirmado

- A inclusão atual grava primeiro `fuel_records` e depois cria `expenses` no navegador.
- A edição atual altera apenas o abastecimento.
- A exclusão atual remove apenas o abastecimento.
- Existe **1 abastecimento legado** e **1 gasto com correspondência provável**, sem vínculo determinístico. Nenhum registro existente será alterado ou excluído automaticamente.

## Implementação

1. Adicionar `expenses.fuel_record_id` opcional.
2. Proteger o vínculo com chave estrangeira composta por abastecimento e usuário, impedindo associação entre usuários diferentes.
3. Criar unicidade parcial para existir no máximo um gasto automático por abastecimento, inclusive sob concorrência.
4. Sincronizar no banco, na mesma operação:
   - inclusão do abastecimento cria exatamente um gasto;
   - edição atualiza valor, data, moto e descrição derivada;
   - exclusão remove apenas o gasto explicitamente vinculado.
5. Retirar da tela a segunda gravação manual de gasto e usar a exclusão normal do abastecimento, deixando a sincronização atômica a cargo do banco.
6. Atualizar os tipos afetados sem mudar outras funcionalidades.

## Segurança e legado

- O `user_id` do gasto será derivado do próprio abastecimento; não será aceito vínculo cruzado entre usuários.
- RLS e exigência de assinatura permanecem inalteradas.
- Gastos manuais continuam com `fuel_record_id = null` e nunca serão removidos pela exclusão de um abastecimento.
- O registro legado continuará sem vínculo até uma decisão manual posterior; assim evitamos confundir um gasto manual coincidente com um gasto automático.

## Validação

- Testar criação, edições repetidas, valor, data e campos derivados, unicidade e exclusão.
- Testar preservação de gasto manual e bloqueio de vínculo entre usuários.
- Confirmar totais usados pelo dashboard e relatórios.
- Rodar toda a suíte existente e checagem de tipos.
- Não criar nem alterar registros financeiros reais durante os testes; os cenários serão executados de forma isolada e revertidos.
