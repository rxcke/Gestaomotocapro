# Painel de insights com IA

## Objetivo
Transformar o insight simples de Relatórios em recomendações personalizadas e acionáveis, calculadas apenas com os dados reais da moto selecionada.

## O que será construído
- Resumo seguro dos abastecimentos, consumo, preço médio, despesas, distância, custo por km e manutenções pendentes.
- Geração de até três recomendações: economia de combustível, manutenção vencida/próxima e ajuste do custo por km.
- Cada recomendação mostrará prioridade, evidência numérica e ação sugerida; sem inventar valores quando faltarem dados.
- Estado inicial explicando quais registros faltam, carregamento, atualização manual e erro claro quando a IA estiver indisponível.
- Manutenções atrasadas continuarão sendo determinadas pelas regras exatas do aplicativo; a IA apenas explicará e priorizará.

## Segurança e privacidade
- A análise será executada somente após autenticação e receberá um resumo numérico da moto selecionada, nunca dados de outros usuários.
- A chave da IA ficará no servidor.
- Erros de créditos, configuração, limite ou indisponibilidade serão exibidos com a orientação correta, sem tentativas infinitas.

## Detalhes técnicos
- Criar uma função protegida no servidor para validar a entrada e chamar Lovable AI com `openai/gpt-6-astra` via Responses API em streaming.
- Usar saída estruturada e validar novamente o resultado antes de entregá-lo à tela.
- Criar funções determinísticas para preparar métricas e pendências; isso permite recomendações confiáveis e estados úteis mesmo com pouco histórico.
- Atualizar a tela de Relatórios com o novo painel e validar a chamada real e a experiência em celular.
