# Ajustar valores da Jornada no celular

## Objetivo
Manter os valores completos de Ganhos, Gastos e Lucro/hora visíveis em telas pequenas, sem alterar cálculos ou comportamento da jornada.

## Alterações
- Permitir que o cartão de estatística receba ajustes visuais opcionais, preservando o comportamento atual em todas as outras telas.
- Na Jornada, reorganizar os três cartões em duas colunas no celular, com Lucro/hora ocupando a largura completa; manter três colunas no desktop.
- Remover o corte com reticências somente nesses valores e aplicar fonte e espaçamento responsivos para comportar valores como `R$ 125.430,50`.
- Preservar símbolo `R$`, cores, hierarquia visual e os botões Pausar/Retomar e Encerrar.

## Validação
- Conferir a Jornada em 360 px, 390 px, 430 px e desktop.
- Testar valores curtos e os exemplos `R$ 1.250,00`, `R$ 10.500,00` e `R$ 125.430,50` sem corte nem rolagem horizontal.
- Confirmar visualmente que Pausar/Retomar e Encerrar continuam disponíveis.
- Executar os testes existentes, checagem de tipos e verificar console/rede.

## Escopo técnico
Somente `Stat` e a composição visual dos cartões na tela de Jornada serão ajustados. Banco, RLS, cálculos, dados e regras de negócio permanecem intactos.
