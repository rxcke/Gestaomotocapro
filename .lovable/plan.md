# Sincronização entre manutenções e gastos

## Objetivo
Garantir que cada nova manutenção tenha exatamente um gasto automático vinculado, sincronizado e removido junto com sua origem, sem tocar em registros financeiros antigos ou manuais.

## Diagnóstico atual
- `expenses.maintenance_record_id` já existe e possui índice único, mas a chave usa `ON DELETE SET NULL`; por isso a exclusão da manutenção deixa o gasto órfão.
- A aplicação cria o gasto em uma segunda operação no navegador; na edição, apenas atualiza um gasto já vinculado. Isso não é atômico e pode deixar manutenção sem gasto.
- Não há função ou gatilho de sincronização para manutenções.
- Existem **3 manutenções legadas sem vínculo determinístico** e **0 gastos vinculados**. Cada manutenção tem um gasto com campos coincidentes, mas a correspondência é apenas provável e será preservada sem alteração.

## Implementação mínima
1. Criar uma migration aditiva para:
   - garantir unicidade de `(id, user_id)` em `maintenance_records`;
   - substituir a referência simples por uma referência composta `(maintenance_record_id, user_id)`, com `ON DELETE CASCADE`, impedindo vínculos entre usuários;
   - manter o índice único de `maintenance_record_id`, garantindo no máximo um gasto por manutenção;
   - criar um gatilho transacional em novas manutenções para inserir o gasto automático com reutilização segura em conflito;
   - sincronizar valor, data, moto, categoria e descrição nas edições somente quando houver vínculo determinístico;
   - proteger gastos vinculados contra edição, troca de vínculo ou exclusão direta enquanto a manutenção existir.
2. Remover do formulário a segunda gravação manual em `expenses`; salvar somente a manutenção e deixar o banco executar a operação atômica.
3. Ocultar edição e exclusão financeira para gastos automáticos vinculados a manutenção, como já ocorre com abastecimentos.
4. Não vincular, excluir ou atualizar automaticamente os 3 registros legados ambíguos.

## Validação
- Criar manutenção e confirmar exatamente um gasto.
- Editar valor, data e campos derivados, confirmando atualização do mesmo gasto.
- Repetir edições e confirmar ausência de duplicatas.
- Excluir manutenção e confirmar remoção apenas do gasto vinculado.
- Criar gasto manual semelhante e confirmar sua preservação.
- Tentar vínculo entre usuários e confirmar bloqueio.
- Confirmar os totais consumidos por dashboard e relatórios antes e depois da exclusão.
- Confirmar que nenhum dado temporário ficou salvo.
- Executar toda a suíte existente e a checagem de tipos.

## Fora do escopo
Nenhuma alteração em abastecimentos, autenticação, Cakto, onboarding, jornadas, metas, planos, permissões administrativas ou demais funcionalidades.
