# Clube de Recompensas — entrega e validação

## Estado de liberação
- Não publicado. Resgates reais permanecem bloqueados no banco: ausência de configuração significa `false`.
- Conferência da base ativa: 0 recompensas, 0 solicitações, 0 movimentações. Nenhuma oferta fictícia inserida.
- Ranking e migração 0040 preservados; carteira lê os ganhos históricos existentes sem copiar/criar créditos.

## Arquivos entregues
- Migrações aplicadas: `drizzle/migrations/0041_rewards_club.sql` (catálogo, parceiros, reservas, carteira, entrega privada, cupons, auditoria, RPCs/RLS/GRANTs) e `0042_reward_delivery_operation_replays.sql` (entradas privadas imutáveis de envio/entrega e preservação do rastreio em operações posteriores).
- Tipos regenerados automaticamente: `src/integrations/supabase/types.ts`.
- Consultas/operações: `src/lib/rewards.functions.ts`, `rewards-admin.functions.ts`, `rewards-shared.ts`, `rewards-shared.test.ts`.
- Interface: `src/components/rewards/Shared.tsx`, `RewardDetails.tsx`, `AdminForms.tsx`.
- Páginas: `src/routes/_authenticated/app.recompensas.tsx`, `app.resgates.tsx`, `admin_.recompensas.tsx`.
- Integrações mínimas: `src/components/AppShell.tsx`, `src/routes/_authenticated/admin.tsx`, `src/lib/use-points-access.ts` (atualiza leitura da carteira após crédito legítimo, sem mudar concessão).
- Documentação: `AGENTS.md`, `roadmap.md` e este relatório.
- Testes isolados: `tests/db/rewards-integrity.sql`, `rewards-scenarios.sql`, `run-rewards-tests.sh`.

## Testes efetivamente executados
- `bun test`: 144 passaram, 0 falhas (23 arquivos).
- `bash tests/db/run-rewards-tests.sh`: 56 asserções passaram em PostgreSQL descartável, com créditos/benefícios/endereço exclusivamente isolados.
- `setpriv --reuid=1000 --regid=1000 --clear-groups bash tests/db/run-points-tests.sh`: 36 verificações de pontos passaram em PostgreSQL descartável.
- Verificações automáticas do projeto: build OK.
- Carteira: 10 conquistados, reserva 4 deixa 6; cancelamento restaura 10; aprovação mantém 6 com 4 gastos e nenhuma reserva. Repetições não duplicam movimentos.
- Saldo/estoque insuficiente, clube bloqueado, oferta inativa/vencida, custo divergente, usuário inelegível, dados de envio faltantes/extras recusados.
- Concorrência: 10 chaves diferentes não ultrapassam saldo; dois titulares disputam última unidade sem duplicação; aprovação × cancelamento produz uma única resolução.
- Falha intermediária em entrega reverte solicitação/reserva/estoque; escrita direta recusada; histórico imutável mesmo para chamadas privilegiadas.
- Isolamento da solicitação/carteira/entrega e códigos; código pendente escondido do titular, aprovado legível só ao titular/admin, código atribuído não reutilizado.
- Administração no banco: cadastro inativo, edição de custo/ativação, lote sem duplicar códigos; redução abaixo de estoque comprometido recusada; não-admin sem permissão.
- Entrega física: rastreio preservado ao concluir; replay do envio original após entrega funciona sem reverter estado; payload alterado recusado.
- Ranking histórico permanece sem desconto por reserva/gasto/liberação.

## Preview real (conta descartável autorizada)
- Conta autorizada existente autenticada, sem usar conta real para concessões ou resgates.
- `/app/recompensas`: carteira final 2 conquistados/disponíveis, 0 reservados/gastos; os 2 eventos são acessos diários legítimos (19 e 31 de outubro), sem retroatividade.
- O primeiro carregamento exibiu o saldo anterior antes do crédito do dia; adicionada invalidação da consulta da carteira após concessão confirmada. Leitura seguinte mostrou 2 corretamente.
- Filtros Todas/Parceiros/Produtos físicos/Benefícios digitais: catálogo vazio, nenhuma promessa inventada.
- `/app/resgates`: ausência real de solicitações; navegação entre páginas funciona.
- Desktop 1280×1800 e celular 360×800: carteira legível, sem overflow lateral; Mais → Clube funciona.
- Não-admin em `/admin/recompensas`: dados administrativos não retornam, tela de erro protegida exibida.
- Falha 503 interceptada: tela de erro sem sucesso; Tentar novamente recupera catálogo real. Nenhum erro de página observado.

## Pendências antes de resgates reais
- Cadastrar recompensas e parceiros verdadeiros com condições, custo, estoque/códigos, validade e entrega confirmados; depende dos dados do responsável.
- Teste integrado completo de cadastro, resgate, aprovação e entrega pela interface: depende de ambiente descartável com administrador autorizado e oferta real/isolada aprovada. Não alteramos papéis nem catálogo ativo para simular esse teste.
- Interfaces de recompensa preenchida, confirmação/endereço e processamento administrativo foram implementadas, mas não exercidas ponta a ponta no preview com dados reais. Não confundir os testes SQL isolados com essa validação.
- Paginação implementada; ainda não exercida com mais de 20 solicitações/movimentações reais.
- Liberação posterior exige autorização específica; não existe controle de liberação editável no navegador. Nada publicado.
- Sem integração digital confiável existente: entrega preparada manualmente, sem automação, pagamentos, sorteios ou conversão em dinheiro.
