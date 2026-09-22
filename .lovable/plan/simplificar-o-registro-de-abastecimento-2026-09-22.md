# Simplificar o registro de abastecimento

## Objetivo
Permitir registrar um abastecimento informando apenas o valor total, mantendo litros, preço por litro e quilometragem como detalhes opcionais que podem ser adicionados depois.

## Alterações
- Ajustar o banco para aceitar `null` em litros, preço por litro e quilometragem, mantendo o valor total obrigatório.
- Reordenar o formulário para destacar primeiro “Valor do abastecimento *” e marcar claramente os demais campos como opcionais.
- Validar total positivo antes de salvar; campos opcionais vazios serão gravados como ausentes, nunca como zero.
- Calcular preço por litro somente quando litros e total forem informados; não inventar litros, preço ou quilometragem.
- Atualizar a quilometragem da moto somente quando uma quilometragem tiver sido informada.
- Permitir que a edição adicione ou remova qualquer detalhe opcional.
- Adaptar histórico, painel, relatórios, administração e insights para ocultar dados ausentes e exibir métricas apenas quando houver amostras suficientes.
- Preservar o lançamento automático do valor total como gasto de combustível.

## Validação
- Cobrir os sete cenários solicitados: quatro combinações de preenchimento, total ausente, edição com detalhes vazios e telas com registros parciais.
- Conferir criação e edição no celular e garantir que histórico, painel e relatórios não exibam zeros fictícios nem quebrem.

## Limites
- Nenhuma alteração em autenticação, Google, Cakto, assinaturas, webhook, planos, acesso ou outros módulos.
