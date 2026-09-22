# Simplificar o registro de manutenção

## Objetivo
Permitir que o motoboy registre uma manutenção em poucos segundos informando apenas o tipo e um valor maior que zero, sem alterar autenticação, assinaturas, Cakto ou outros módulos.

## Alterações
- Manter os tipos de manutenção existentes e destacar `Tipo` e `Valor` como os únicos campos obrigatórios.
- Em novos registros, omitir a data enviada pelo navegador e deixar o banco aplicar automaticamente a data atual.
- Na edição, manter a data disponível dentro de `Adicionar detalhes`, junto com descrição, quilometragem, próxima revisão, moto e oficina.
- Preservar campos opcionais vazios como `null`, sem criar zeros ou outros dados fictícios.
- Usar a data confirmada pelo banco ao gerar o gasto automático correspondente à manutenção.
- Validar tipo e valor no formulário antes do envio, com mensagens claras.
- Adicionar validações no banco para impedir tipo vazio e valor menor ou igual a zero, preservando registros históricos existentes.
- Ajustar o histórico para priorizar tipo, valor e data e exibir apenas detalhes realmente informados.
- Revisar painel, relatórios e insights para confirmar que registros mínimos continuam seguros e que o custo entra normalmente nos totais.

## Validação
- Criar testes locais para tipo + valor, combinações opcionais, valor ausente/zero/negativo e edição sem detalhes.
- Validar histórico, painel e relatórios sem gravar registros reais.
- Conferir a experiência em celular, incluindo tamanho dos controles, área de detalhes e estados de salvamento.

## Detalhes técnicos
- A tabela já define `date DATE NOT NULL DEFAULT CURRENT_DATE`; novos registros passarão a depender desse padrão confiável do banco.
- As restrições serão aditivas e aplicadas com `NOT VALID` para não bloquear possíveis dados históricos antigos, mas passam a proteger novas gravações imediatamente.
- As colunas atuais serão mantidas; nenhuma informação histórica será removida.