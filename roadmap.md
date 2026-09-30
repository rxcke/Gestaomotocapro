# Roadmap

- [x] Auditar autenticação, Google, sessão e redirects
- [x] Auditar assinatura, onboarding e estados de acesso
- [x] Corrigir somente falhas comprovadas no fluxo de entrada
- [x] Validar fluxos disponíveis em desktop e celular sem criar contas, compras ou assinaturas
- [x] Confirmar que Cakto e lógica financeira permaneceram intactos

- [x] Tornar total o único campo obrigatório no abastecimento
- [x] Tornar litros, preço por litro e quilometragem opcionais no banco e na aplicação
- [x] Adaptar histórico, painel, relatórios, administração e insights para dados parciais
- [x] Validar criação, edição e cálculos com os sete cenários solicitados

- [x] Tornar tipo e valor os únicos campos obrigatórios na manutenção
- [x] Usar a data do banco automaticamente em novos registros
- [x] Recolher campos opcionais em uma área de detalhes
- [x] Garantir valor positivo e tipo válido no formulário e no banco
- [x] Adaptar histórico e validar cálculos com registros mínimos
- [x] Testar os doze cenários solicitados sem criar dados reais

- [x] Aplicar na base ativa a correção de campos opcionais do abastecimento
- [x] Confirmar total obrigatório e positivo, sem exigência de litros, preço ou KM
- [x] Validar os quatro cenários de abastecimento solicitados

## WhatsApp do usuário
- [x] Reutilizar o campo phone existente no perfil, sem duplicidade
- [x] Validar e normalizar celular brasileiro no cadastro, onboarding e perfil
- [x] Garantir fluxo Google condicional ao telefone
- [x] Testar cadastro, persistência, edição e celular

## Identidade Gestão Motoca Pro
- [x] Aplicar nova logo e ícone fornecidos
- [x] Substituir referências visuais da marca e tagline
- [x] Atualizar identidade para preto, laranja, branco e cinza
- [x] Validar contraste e responsividade em desktop e celular

## Landing page de conversão
- [x] Criar navegação responsiva e hero com demonstração visual do painel
- [x] Criar seções de dor, solução, benefícios, transformação e funcionamento
- [x] Exibir os três planos reais usando o fluxo atual de assinatura
- [x] Criar FAQ, CTA final e rodapé
- [x] Validar SEO, acessibilidade e responsividade de celular a ultrawide

## Tema claro
- [x] Aplicar fundo branco, cartões claros e fundo secundário suave via tokens globais
- [x] Garantir contraste de textos, bordas, estados e logo sem alterar o tema escuro
- [x] Validar as telas do aplicativo em tema claro no celular e desktop

## Acesso administrativo à jornada
- [x] Permitir que administradores criem apenas a própria jornada sem assinatura ativa
- [x] Validar os cinco cenários de acesso da política de jornadas
- [x] Confirmar a política final aplicada na base ativa

## SEO da landing pública
- [x] Otimizar conteúdo e hierarquia de títulos da landing sem keyword stuffing
- [x] Configurar metadados, canonical, Open Graph, Twitter Card e SoftwareApplication
- [x] Criar sitemap apenas com a landing e atualizar robots.txt
- [x] Bloquear indexação de autenticação e áreas internas
- [x] Validar HTML renderizado, celular, desktop, testes e checagem de tipos

## Disponibilidade pública do sitemap
- [x] Auditar as respostas públicas do sitemap e robots.txt
- [x] Servir sitemap.xml como arquivo público estático, sem autenticação
- [x] Publicar e confirmar HTTP 200, Content-Type XML e conteúdo no domínio oficial

## Sincronização de abastecimentos e gastos
- [x] Auditar a criação, edição e exclusão atuais
- [x] Identificar registros legados sem alterar dados reais
- [x] Criar vínculo seguro e sincronização transacional
- [x] Validar criação, edições repetidas, exclusão, isolamento e totais
- [x] Rodar testes existentes e checagem de tipos
## Sincronização de manutenções e gastos
- [x] Auditar fluxo atual e identificar registros legados
- [x] Criar vínculo seguro e sincronização transacional
- [x] Remover a gravação financeira duplicada da tela
- [x] Validar os dez cenários e regressões

## Vínculo entre jornada e custos
- [x] Vincular novos abastecimentos e manutenções à jornada ativa do próprio usuário
- [x] Propagar o vínculo ao gasto automático sem duplicidade
- [x] Preservar vínculo em edições e remoção sincronizada em exclusões
- [x] Validar cálculos, isolamento, dez cenários e regressões

## Acesso administrativo sem assinatura
- [x] Auditar roles, assinatura, RLS, telas e autorização interna
- [x] Permitir que administradores operem somente os próprios dados sem assinatura
- [x] Validar perfis de acesso, falsificação de identidade e regressões


## Página pública de obrigado
- [x] Mapear login e confirmação segura da assinatura
- [x] Criar /obrigado sem alterar fluxos existentes
- [x] Validar estados, botão e responsividade

## Correção do registro de manutenção em produção
- [x] Identificar a falha exata entre formulário, banco, RLS, jornada e gasto automático
- [x] Aplicar somente a menor correção necessária
- [x] Validar os dez cenários solicitados sem alterar dados reais

## Resumo semanal
- [x] Reutilizar o cálculo financeiro existente para a semana local, sem duplicar gastos automáticos
- [x] Mostrar horas encerradas, KM comprovados, combustível e comparação válida em Relatórios
- [x] Validar cenários de cálculo, acesso, telas móveis e regressões

## Refinamento visual dos Relatórios
- [x] Destacar lucro, manter ordem e indicar semanas sem movimento
- [x] Clarificar indicadores da moto, resultado mensal e frase da semana sem mudar cálculos
- [x] Conferir valores completos, responsividade e testes

## Persistência da pausa da jornada
- [x] Auditar estado, cálculo, proteção de jornadas simultâneas e relatório
- [x] Persistir múltiplas pausas com isolamento e concorrência seguros
- [ ] Validar cálculo compartilhado, atualização, encerramento e telas em desktop/celular

## Jornada aberta não aparece
- [x] Auditar a jornada existente, pausas, dados relacionados e tentativas de criação
- [x] Mostrar a jornada aberta independentemente da moto selecionada e evitar criação duplicada
- [x] Validar concorrência em teste, histórico e telas móveis/desktop sem apagar dados existentes
- [ ] Testar ciclo real de pausa e encerramento em uma jornada descartável (bloqueado: preservar a jornada aberta do usuário)

## Lucro por hora no relatório semanal
- [x] Identificar diferença entre horas exibidas e duração usada na divisão
- [x] Ocultar lucro/hora quando horas efetivamente trabalhadas aparecem como 0,0 h
- [x] Testar duração curta, pausas, zero, prejuízo e durações válidas

## Acesso especial para embaixadores
- [x] Auditar roles, exceção administrativa, assinatura, onboarding e políticas RLS
- [x] Acrescentar papel de embaixador e centralizar acesso próprio no banco
- [x] Permitir concessão/remoção só pelo administrador com confirmação
- [x] Validar concessão e remoção reais em conta de teste sem assinatura, isolamento, regressões e telas móveis/desktop

## WhatsApp na administração
- [x] Exibir profiles.phone apenas na lista administrativa, formatado sem alterar o dado salvo
- [x] Validar ausência, formatos, acesso restrito e telas desktop/celular
