# Vínculo entre jornada e custos

## Objetivo
Garantir que abastecimentos e manutenções criados durante uma jornada ativa entrem automaticamente nos gastos, no lucro e no lucro por hora daquela jornada, sem duplicar valores no financeiro geral.

## Implementação
- Adicionar um vínculo opcional de jornada em abastecimentos e manutenções, preservando todos os registros existentes sem alteração.
- Garantir no banco que a jornada vinculada pertence ao mesmo usuário do custo e impedir mais de uma jornada ativa por usuário.
- Na criação, usar somente uma jornada ainda aberta do próprio usuário; sem jornada ativa, manter o vínculo vazio. Rejeitar uma jornada informada que esteja encerrada ou pertença a outra pessoa.
- Preservar o vínculo original nas edições, evitando que um registro antigo seja movido entre jornadas.
- Atualizar as sincronizações já existentes para copiar o vínculo ao mesmo gasto automático de combustível/manutenção, mantendo a unicidade e as exclusões em cascata já implementadas.
- Passar a jornada atual pelos atalhos da tela de jornada, mantendo a validação definitiva no banco.

## Segurança e dados existentes
- Manter RLS e as políticas atuais.
- Usar relações compostas por jornada e usuário para impedir vínculo cruzado, sem confiar apenas nos dados enviados pela tela.
- Não preencher retroativamente vínculos em registros antigos e não alterar valores financeiros reais.
- Os registros legados já identificados permanecem intactos: 1 abastecimento e 3 manutenções sem gasto vinculado deterministicamente; nenhum exige revisão para esta correção.

## Validação
- Executar os 10 cenários solicitados em transação temporária, incluindo criação, edição, exclusão, ausência de jornada, ausência de duplicidade, cálculo líquido e tentativa entre usuários.
- Confirmar que o financeiro geral mantém os mesmos valores e que os totais da jornada passam a considerar combustível e manutenção uma única vez.
- Executar os 27 testes existentes e a checagem de tipos.
- Verificar a tela de jornada no navegador, além de console e rede.

## Detalhes técnicos
- Tabelas afetadas: `work_sessions`, `fuel_records`, `maintenance_records` e `expenses`.
- As novas colunas serão opcionais e as relações serão aditivas, sem remoção ou transformação de dados existentes.
- As funções de sincronização de gastos serão ajustadas apenas para propagar `work_session_id`; as regras de valor, data, descrição, edição e exclusão permanecem as já corrigidas.