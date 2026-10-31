# Clube de Recompensas — Gestão Motoca Pro

## Objetivo e limites
Implementar carteira, catálogo, solicitações e administração integrados aos pontos existentes. Manter o ranking pelo **total histórico conquistado**, sem descontar resgates.

Não modificar a migração 0040, concessão diária, bônus semanal, autenticação, recuperação, assinaturas, Cakto ou dados financeiros. Não criar ofertas fictícias, pontos retroativos, pagamentos, sorteios ou conversão em dinheiro. Não publicar.

**Entrega inicialmente bloqueada para resgates reais:** catálogo vazio, recompensas novas inativas e controle de liberação validado no banco, não apenas no botão. Apresentar resultados e pendências antes de qualquer liberação posterior autorizada.

## 1. Base existente e carteira
- A base já concede 1 ponto diário e bônus de 5 no quinto dia semanal, com calendário de Brasília, trava por usuário e unicidade.
- As consultas de ranking somam exclusivamente `points_events`; usuários só podem ler seus próprios eventos. Preservar essas consultas.
- Usar todos os pontos já legitimamente conquistados como base disponível, **sem duplicar créditos nem criar outro saldo de ganhos**.
- Carteira: conquistados = soma integral dos eventos existentes; gastos = movimentações de aprovação; reservados = reservas menos gastos/liberações; disponível = conquistados − gastos − reservados.
- Adicionar histórico separado e auditável de reserva, confirmação de gasto e liberação. Cada movimentação terá solicitação, proprietário, origem, data e identificador único. Usuários não poderão gravar ou editar diretamente.
- Valores derivados no banco; nunca somar apenas o histórico recente limitado a 100 itens. Exibir histórico paginado.

## 2. Catálogo e experiência do usuário
Adicionar **Clube de Recompensas** ao menu do aplicativo e criar:
- `/app/recompensas`: resumo da carteira, filtros por parceiros/produtos físicos/benefícios digitais, vitrine e detalhes da recompensa.
- Modal de confirmação com custo atual, saldo disponível, condições e prazo; impedir confirmação duplicada e mostrar resultado confirmado pelo servidor.
- `/app/resgates`: solicitações próprias, situação, histórico e cancelamento quando permitido; entrega/cupom visível somente ao titular autorizado.
- Estados reais de carregamento, erro com tentativa novamente e ausência de ofertas/solicitações. Catálogo começa vazio, sem benefícios inventados.

Recompensas terão nome, descrição, imagem opcional, categoria, custo inteiro positivo, estoque opcional, condições, método/prazo de entrega, estado ativo/inativo e validade opcional. Detalhes de uma solicitação preservam uma cópia do nome, custo e condições aceitas, mesmo após edição ou desativação da oferta.

Manter componentes e identidade visual existentes, preto, laranja, branco e cinza; conferir celular e computador, sem tocar no botão Manutenção em 360px.

## 3. Solicitações e transições
Cada operação ocorrerá em uma única transação no banco:
1. Identificar o usuário autenticado e conferir liberação do clube, acesso atual ao aplicativo, recompensa ativa, validade, estoque e saldo.
2. Conferir preço aceito contra preço atual; se mudou, pedir nova confirmação.
3. Criar solicitação pendente, reservar pontos e uma unidade de estoque, quando limitado.
4. Repetições com a mesma chave e mesmos dados retornam a solicitação original; mesma chave com dados diferentes é recusada.

| Origem | Destino permitido | Efeito |
|---|---|---|
| Pendente | Aprovado, pelo administrador | Transformar reserva em gasto uma vez; não debitar novamente o disponível |
| Pendente | Rejeitado, pelo administrador | Liberar pontos e estoque uma vez; registrar motivo |
| Pendente | Cancelado, pelo titular ou administrador | Liberar pontos e estoque uma vez |
| Aprovado | Enviado, para produto físico | Registrar envio e referência de rastreio, quando existente |
| Aprovado | Entregue, para parceiro/digital ou entrega física direta | Registrar comprovação/instrução de entrega |
| Enviado | Entregue | Registrar conclusão |

Rejeitado, cancelado e entregue são terminais. Não permitir cancelamento após aprovação, reabertura, aprovação repetida com novo débito ou retorno automático de pontos após envio. Repetição idêntica de operação já concluída é idempotente; transição incompatível falha claramente. Correções excepcionais pós-aprovação e expiração automática de reservas ficam fora desta etapa.

## 4. Entrega por categoria
- **Parceiros:** cadastro de parceiro, instruções, validade e lote de cupons únicos quando aplicável. Códigos em armazenamento separado e privado; atribuição exclusiva e transacional, nunca no catálogo, ranking ou registros públicos.
- **Produtos físicos:** estoque reservado antes da aprovação; pedir apenas nome do destinatário e dados necessários ao envio durante um resgate real. Dados separados da oferta e do histórico administrativo; leitura somente pelo titular e administrador autorizado para entrega.
- **Digitais:** preparar entrega manual por código ou registro de liberação. Não conectar serviços nem automatizar entregas sem integração confiável existente e validada.
- Nenhum dado de entrega será solicitado com o clube bloqueado ou sem uma oferta real. Não inserir endereço, cupom ou contato em mensagens de erro, logs, exportações gerais ou auditoria.

## 5. Administração protegida
Criar `/admin/recompensas` como página independente, preservando o conteúdo atual de `/admin`, e acrescentar seu acesso na administração existente.

Permitir cadastrar/editar parceiros e recompensas, definir custo/estoque/validade, ativar/desativar, administrar cupons privados, consultar solicitações e registrar aprovação, rejeição, envio e entrega.

Toda operação verifica o papel `admin` no servidor e novamente nas funções do banco; não confiar no menu ou na sessão do navegador. Auditoria registra ator, ação, entidade, horário e mudanças não sensíveis, junto da transação. Não permitir reduzir estoque abaixo das unidades já comprometidas. Alterações de catálogo não alteram o custo aceito em pedidos anteriores.

## 6. Detalhes técnicos
- Nova migração aditiva via ferramenta de migrações; não alterar 0040 nem modelos/metadata gerados manualmente.
- Novas estruturas: parceiros, catálogo, configuração de liberação bloqueada por padrão, solicitações, movimentações de carteira, estoque/atribuições, cupons e entrega privados, auditoria administrativa.
- Toda tabela pública terá GRANTs explícitos e RLS. Catálogo seguro disponível aos usuários autenticados; inativos legíveis só por administradores. Solicitações, carteira e movimentações: titular e administração autorizada; sem escrita direta pelos usuários.
- Funções transacionais com identidade por `auth.uid()`, permissões EXECUTE mínimas, validação administrativa e `search_path` seguro. Não aceitar usuário, preço, saldo ou estado arbitrários do cliente.
- Usar a mesma trava transacional por usuário da concessão existente e ordem de bloqueios documentada: usuário → recompensa/estoque → solicitação → cupom. Todas as operações concorrentes seguirão essa ordem.
- Resumo da carteira em uma consulta consistente; movimentações exclusivas por solicitação/operação, sem atualizações ou exclusões do histórico pela aplicação. Não vincular o novo histórico a exclusões em cascata de perfil.
- Funções autenticadas em `src/lib/rewards.functions.ts` e `src/lib/rewards-admin.functions.ts`, com validação de entradas e chamadas aos RPCs usando o cliente autenticado existente; sem cliente privilegiado para leituras comuns.
- Novos componentes pequenos para carteira, catálogo, detalhes, confirmação, solicitações e formulários administrativos.
- Arquivos de integração: `src/components/AppShell.tsx`, `src/routes/_authenticated/admin.tsx`; novas páginas `app.recompensas.tsx`, `app.resgates.tsx` e `admin_.recompensas.tsx`. A última evita aninhar uma página sob o painel atual, que não tem Outlet.
- Todas as páginas novas terão metadados próprios. Documentar arquitetura em `AGENTS.md` e manter `roadmap.md` atualizado.

## 7. Testes e critérios de entrega
Executar em PostgreSQL descartável, com dados de teste exclusivamente isolados:
- Conquistados 10, reserva 4 → disponível 6; aprovação → gastos 4, reserva 0, disponível 6; rejeição/cancelamento da reserva → disponível 10.
- Saldo insuficiente e estoque insuficiente recusados sem alterações parciais.
- Duas solicitações simultâneas acima do saldo e disputa pela última unidade: somente operações válidas confirmam.
- Repetição de solicitação/operação, chave com dados divergentes e resposta perdida: nenhuma reserva, gasto ou devolução duplicada.
- Corridas aprovação × cancelamento/rejeição e falha intermediária: integridade de pontos, estoque e histórico.
- Oferta inativa, vencida, preço alterado, clube bloqueado e usuário inelegível recusados no banco.
- Isolamento entre usuários, recusas de escrita direta, operações administrativas negadas a não administradores, privacidade e exclusividade dos cupons.
- Ranking, total histórico, dias e bônus semanal idênticos antes/depois de reserva, gasto e liberação; executar também testes de pontos e regressões existentes.

No preview, usar exclusivamente conta descartável autorizada para leituras e testes que possam conceder pontos; não alterar papéis, ofertas ou solicitações reais para simular cenários. Validar carteira real, filtros vazios, navegação, estados de erro e bloqueio da operação. Fluxos de resgate/aprovação completos serão exercidos em ambiente isolado; registrar claramente limites do teste integrado sem ofertas reais.

**Entrega:** listar arquivos e migrações aplicadas, testes efetivamente executados, resultados e pendências. Sem publicar e sem liberar resgates reais. Para posterior liberação, exigir recompensas verdadeiras, condições/prazos/estoque confirmados e autorização específica do responsável.