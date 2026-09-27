# Gestão Motoca Pro

Crie um aplicativo web responsivo/PWA voltado exclusivamente para motociclistas.

O conceito do produto é:

Seu dinheiro. Sua moto. Seu resultado.

O aplicativo deve ajudar o motociclista a responder três perguntas:

Quanto minha moto custa?

Quanto minha moto gera?

Quanto realmente sobra no meu bolso?

O produto deve combinar:

Controle financeiro

Controle de combustível

Controle de manutenção

Controle de quilometragem

Metas financeiras

Jornada de trabalho para motociclistas profissionais

Dashboard inteligente

O foco inicial é criar um MVP simples, rápido, moderno e funcional.

NÃO construir ainda marketplace, rede social, sistema de oficinas ou funcionalidades complexas de comunidade. Essas funcionalidades serão futuras.

2. OBJETIVO DO MVP

O MVP deve permitir que um usuário:

Crie uma conta

Cadastre sua moto

Informe a quilometragem

Registre ganhos

Registre despesas

Registre abastecimentos

Registre manutenções

Crie uma meta financeira

Inicie e encerre uma jornada de trabalho

Consulte seu lucro líquido

Veja seu custo por KM

Acompanhe sua evolução financeira

Receba alertas de manutenção

Visualize tudo em um dashboard

Todos os dados devem ser persistidos em banco de dados.

Não criar apenas dados fictícios ou componentes estáticos.

3. TECNOLOGIA

Utilize uma stack moderna e adequada para um SaaS/PWA.

Preferência:

React

TypeScript

Tailwind CSS

Supabase

PostgreSQL

Autenticação Supabase

Componentes reutilizáveis

Design responsivo

PWA instalável

Caso a plataforma tenha uma stack padrão diferente, utilize a stack padrão, desde que mantenha a mesma arquitetura funcional.

4. DESIGN

O aplicativo deve ter aparência premium, moderna e masculina, mas sem parecer agressivo ou exageradamente "automotivo".

Referência estética:

Apps financeiros modernos

Apps de mobilidade

Painéis de motocicletas

Interfaces SaaS premium

Priorize:

Muito espaço em branco

Cards

Tipografia forte

Números grandes

Ícones simples

Hierarquia visual clara

Poucos elementos por tela

Microinterações discretas

Responsividade

Não encher a interface de informações.

O usuário deve entender seu resultado financeiro em menos de 5 segundos após abrir o aplicativo.

Criar suporte para:

Light mode

Dark mode

O dark mode deve ser especialmente bem trabalhado.

5. IDENTIDADE VISUAL

Criar uma identidade visual provisória para o produto.

Não utilizar o nome "RideWise".

Criar um nome temporário no código:

MotoFinance

Esse nome poderá ser alterado posteriormente.

Logo provisória:

Símbolo relacionado a moto + dinheiro/resultado

Visual minimalista

Fácil de transformar posteriormente em identidade definitiva

Não utilizar marcas registradas de terceiros.

6. ESTRUTURA DE NAVEGAÇÃO

No desktop:

Sidebar lateral.

No mobile:

Bottom navigation.

Menu:

🏠 Início

💰 Dinheiro

🏍️ Minha Moto

🔧 Manutenção

👤 Perfil

Dentro de Dinheiro:

Visão geral

Ganhos

Despesas

Metas

Jornadas

Dentro de Minha Moto:

Resumo

Abastecimentos

Histórico

Dentro de Manutenção:

Próximas

Histórico

7. AUTENTICAÇÃO

Criar:

Cadastro

Campos:

Nome

E-mail

Senha

Confirmar senha

Login

E-mail

Senha

Entrar

Recuperar senha

Adicionar:

Login com Google, se suportado

Logout

Persistência de sessão

Proteção das rotas autenticadas

Cada usuário só pode visualizar seus próprios dados.

Implementar Row Level Security no Supabase.

8. ONBOARDING

Após o primeiro cadastro, mostrar onboarding em 4 etapas.

Etapa 1

Pergunta:

Como você usa sua moto?

Opções:

Trabalho

Dia a dia

Viagens

Lazer

Todos

Permitir selecionar mais de uma.

Etapa 2

Cadastrar moto:

Marca

Modelo

Ano

Placa

Quilometragem atual

Etapa 3

Perguntar:

Você utiliza sua moto para gerar renda?

Sim / Não

Se sim, habilitar recursos de jornada profissional.

Etapa 4

Perguntar:

Qual sua meta financeira mensal?

Campo monetário.

Exemplo:

R$ 4.000

Depois do onboarding, levar o usuário para o Dashboard.

9. DASHBOARD

Criar uma dashboard extremamente clara.

Topo:

"Bom dia, [nome] 👋"

Mostrar moto ativa:

🏍️ [modelo]

[quilometragem] km

Permitir trocar de moto se houver mais de uma.

CARD PRINCIPAL

Título:

Resultado do mês

Mostrar:

Entradas
R$ X

Despesas
R$ X

Resultado líquido
R$ X

Fórmula:

resultado_liquido = entradas - despesas

Mostrar comparação com mês anterior quando houver dados suficientes.

10. CARD DE META

Mostrar:

Meta mensal
R$ 4.000

Atual
R$ 2.840

Percentual:

resultado / meta * 100

Barra de progresso.

Mostrar:

"Faltam R$ X para sua meta."

Se a meta tiver sido atingida:

"Meta alcançada! 🔥"

11. CARD DE COMBUSTÍVEL

Mostrar:

Total gasto no mês

KM rodados

Consumo médio

Custo por KM

Exemplo:

⛽ Combustível

R$ 487

34,2 km/L

R$ 0,18/km

Botão:

"+ Abastecimento"

12. CARD DE MANUTENÇÃO

Mostrar a próxima manutenção.

Exemplo:

🔧 Troca de óleo

Faltam 420 km

ou

Vence em 12 dias.

Botão:

"Ver manutenção"

13. AÇÕES RÁPIDAS

No Dashboard:

[ + Ganho ]

[ + Gasto ]

[ + Abastecimento ]

[ + Manutenção ]

Esses botões devem abrir modais ou telas rápidas.

14. MÓDULO FINANCEIRO

Criar tela:

Meu dinheiro

Mostrar:

Entradas

Despesas

Resultado

Gráfico

Filtros:

Hoje

7 dias

Este mês

Mês anterior

Personalizado

15. ADICIONAR GANHO

Campos:

Valor

Categoria

Data

Hora opcional

Descrição opcional

Moto relacionada

Categorias:

Entrega

Corrida

Frete

Salário

Serviço

Venda

Outro

Botão:

Salvar ganho

Após salvar:

Atualizar dashboard

Atualizar meta

Atualizar resultado

Mostrar confirmação

16. ADICIONAR DESPESA

Campos:

Valor

Categoria

Data

Descrição

Moto relacionada

Categorias:

Moto

Combustível

Manutenção

Peças

Pneus

Óleo

Oficina

Lavagem

Documentação

IPVA

Licenciamento

Seguro

Multa

Trabalho

Alimentação

Estacionamento

Pedágio

Outros

Pessoal

Outros

Botão:

Salvar gasto

17. RESULTADO FINANCEIRO

Criar página:

Meu resultado

Mostrar:

Entradas

R$ X

Despesas

R$ X

Resultado líquido

R$ X

Lucro médio diário

resultado / dias considerados

Custo por KM

despesas relacionadas à moto / KM rodados

Criar gráfico de evolução.

18. METAS

Criar módulo de metas.

Usuário pode criar:

Meta mensal

Meta semanal

Meta de economia

Campos:

Nome

Valor

Data inicial

Data final

Mostrar:

Progresso

Valor atual

Valor restante

Percentual

Também mostrar uma estimativa:

"Para atingir sua meta, você precisa fazer aproximadamente R$ X por dia."

19. MINHA MOTO

Criar página:

Minha Moto

Mostrar:

Foto opcional

Marca

Modelo

Ano

Placa

KM atual

Data de cadastro

Indicadores:

Consumo médio

Custo por KM

Gastos totais

Gastos do mês

Última manutenção

Permitir editar dados.

20. MÚLTIPLAS MOTOS

A arquitetura deve permitir que o usuário tenha mais de uma moto.

No MVP:

Permitir pelo menos 3 motos.

Cada moto deve possuir seus próprios:

Abastecimentos

Manutenções

Quilometragem

Despesas

Histórico

O dashboard deve permitir selecionar a moto.

Também permitir:

"Todas as motos"

para visão consolidada.

21. ABASTECIMENTOS

Criar página:

Abastecimentos

Botão:

+ Abastecer

Campos:

Data

KM

Litros

Preço por litro

Total

Posto opcional

Observação opcional

Se o usuário informar litros e preço/litro:

total = litros × preço_litro

Se informar total e litros:

preço_litro = total / litros

22. CÁLCULO DE CONSUMO

Calcular automaticamente consumo médio usando abastecimentos sucessivos.

Fórmula:

KM percorridos entre abastecimentos / litros abastecidos

Mostrar:

34,2 km/L

Também calcular:

Custo por KM

valor do combustível / KM percorridos

Mostrar histórico.

23. MANUTENÇÃO

Criar página:

Manutenção

Separar:

Próximas

Histórico

Categorias:

Óleo

Filtro

Pneus

Relação

Pastilhas

Freios

Suspensão

Bateria

Velas

Revisão

Motor

Elétrica

Outro

24. ADICIONAR MANUTENÇÃO

Campos:

Tipo

Descrição

Data

KM

Valor

Oficina opcional

Próximo KM

Próxima data

Exemplo:

Troca de óleo

KM atual:

32.840

Valor:

R$85

Próxima:

35.000 km

25. ALERTAS DE MANUTENÇÃO

Criar lógica automática.

Se current_km >= next_km - threshold:

mostrar alerta.

Threshold padrão:

500 km.

Também permitir alerta por data.

Exemplo:

🔧 Troca de óleo próxima

Faltam 180 km.

Criar status:

Verde: normal

Amarelo: próximo

Vermelho: atrasado

26. DOCUMENTOS

Mesmo sendo uma funcionalidade secundária, criar estrutura preparada para:

IPVA

Licenciamento

Seguro

CNH

Outros

Cada documento:

Nome

Data de vencimento

Valor

Observação

Criar alerta antes do vencimento.

27. MODO TRABALHO

Se o usuário declarou que trabalha com a moto, mostrar no menu:

🛵 Jornada

Tela inicial:

"Você está parado."

Botão:

INICIAR JORNADA

Ao iniciar:

Horário inicial

KM inicial

28. JORNADA ATIVA

Mostrar em tempo real:

⏱️ Tempo

🏍️ KM percorridos

💰 Ganhos

💸 Despesas

📈 Resultado líquido

💰 Lucro/hora

Botões:

[ + Ganho ]

[ + Gasto ]

[ Pausar ]

[ Encerrar jornada ]

29. ENCERRAR JORNADA

Ao encerrar:

Solicitar:

KM final

Calcular:

KM percorridos

Tempo total

Ganhos

Despesas

Lucro líquido

Lucro/hora

Custo/km

Mostrar resumo:

Resultado da jornada

132 km

R$198 ganhos

R$62 gastos

R$136 líquido

R$16,59/h

30. HISTÓRICO DE JORNADAS

Mostrar:

Data

Tempo

KM

Ganhos

Gastos

Lucro

Lucro/hora

Permitir filtrar por:

Dia

Semana

Mês

31. RELATÓRIOS

Criar página:

Relatórios

Cards:

Total ganho

Total gasto

Resultado

KM rodados

Combustível

Manutenção

Custo/km

Lucro/hora

Criar gráficos simples:

Ganhos x despesas

Gastos por categoria

Evolução do lucro

Consumo

KM rodados

32. CUSTO REAL DA MOTO

Criar uma ferramenta específica:

Quanto custa sua moto?

Calcular:

Combustível

Manutenção

Seguro

Documentos

Outros gastos

=

Custo total

Também mostrar:

Custo mensal

Custo anual

Custo/km

Essa função deve ser destacada.

33. INTELIGÊNCIA DO APP

Criar uma seção:

Insights

Não precisa utilizar IA generativa inicialmente.

Criar inteligência baseada nos dados.

Exemplos:

Se combustível aumentou:

⛽ Seus gastos com combustível aumentaram 18% este mês.

Se consumo caiu:

⚠️ Seu consumo médio caiu de 35 km/L para 30 km/L.

Se meta estiver atrasada:

🎯 Você está 12% abaixo do ritmo necessário para atingir sua meta.

Se manutenção estiver próxima:

🔧 Sua próxima troca de óleo está próxima.

Se lucro estiver melhor:

📈 Seu resultado líquido aumentou 14% em relação ao mês anterior.

Esses insights devem ser gerados automaticamente.

34. NOTIFICAÇÕES

Criar sistema de notificações interno.

Tipos:

Manutenção

Documento

Meta

Financeiro

Jornada

Exemplo:

"Seu licenciamento vence em 15 dias."

35. PERFIL

Tela:

Meu perfil

Nome

E-mail

Telefone

Foto

Moto principal

Tipo de uso

Seções:

Minha conta

Minhas motos

Minhas metas

Notificações

Tema

Assinatura

Ajuda

Sair

36. BANCO DE DADOS

Criar tabelas:

users/profiles

id
name
email
phone
avatar_url
created_at

motorcycles

id
user_id
brand
model
year
plate
current_km
purchase_value
purchase_date
photo_url
created_at

incomes

id
user_id
motorcycle_id
category
amount
date
description
created_at

expenses

id
user_id
motorcycle_id
category
amount
date
description
created_at

fuel_records

id
user_id
motorcycle_id
date
km
liters
price_per_liter
total
station
description
created_at

maintenance_records

id
user_id
motorcycle_id
category
description
date
km
cost
next_km
next_date
workshop
created_at

goals

id
user_id
type
name
target_amount
start_date
end_date
created_at

work_sessions

id
user_id
motorcycle_id
start_time
end_time
start_km
end_km
total_income
total_expense
net_profit
created_at

notifications

id
user_id
type
title
message
read
created_at

documents

id
user_id
motorcycle_id
name
expiration_date
amount
description
created_at

37. REGRAS DE SEGURANÇA

Implementar Supabase Row Level Security.

Regra:

Um usuário só pode:

Criar seus próprios registros

Ler seus próprios registros

Editar seus próprios registros

Excluir seus próprios registros

Nunca permitir acesso aos dados financeiros de outro usuário.

38. EXPERIÊNCIA MOBILE

O aplicativo será utilizado principalmente no celular.

Priorizar:

Botões grandes

Navegação inferior

Modais fáceis de usar

Inputs numéricos

Cadastro rápido

Poucos passos

O usuário deve conseguir registrar um abastecimento em menos de 20 segundos.

O usuário deve conseguir registrar um ganho em menos de 10 segundos.

39. UX DOS BOTÕES

Todos os botões devem realmente funcionar.

Não criar:

Botões falsos

Gráficos estáticos

Dados hardcoded

Páginas sem funcionalidade

Links quebrados

Após qualquer alteração:

Atualizar banco

Atualizar interface

Atualizar cálculos

Mostrar feedback visual

Exemplo:

"Abastecimento salvo com sucesso."

40. ESTADOS DA APLICAÇÃO

Implementar:

Loading states

Empty states

Error states

Success states

Exemplos:

Se ainda não houver gastos:

Você ainda não registrou nenhum gasto.

Botão:

+ Adicionar gasto

Se ainda não houver manutenção:

Sua moto ainda não possui histórico de manutenção.

Botão:

+ Registrar manutenção

41. DADOS DEMONSTRATIVOS

Durante o desenvolvimento, utilizar dados seed apenas para facilitar a visualização.

Exemplo:

Moto:

Honda CG 160

32.840 km

Mas deixar claro no código que são dados de demonstração.

Após cadastro real, mostrar apenas dados do usuário.

42. DASHBOARD INTELIGENTE

O Dashboard deve mudar conforme o perfil.

Usuário comum:

Priorizar:

Gastos

Combustível

Manutenção

Custo/km

Usuário profissional:

Priorizar:

Ganhos

Gastos

Lucro

Lucro/hora

Meta

Jornada

43. RESPONSIVIDADE

Desktop:

Sidebar + conteúdo central.

Tablet:

Sidebar compacta.

Mobile:

Bottom navigation.

Nunca permitir:

Overflow horizontal

Cards cortados

Texto sobreposto

Botões pequenos demais

44. PERFORMANCE

Priorizar:

Carregamento rápido

Queries eficientes

Componentes reutilizáveis

Lazy loading quando necessário

Cache de dados apropriado

Não fazer consultas desnecessárias ao banco.

45. PREPARAÇÃO PARA FUTURAS VERSÕES

A arquitetura deve permitir posteriormente adicionar:

V2

IA conversacional

Viagens

GPS

Alertas inteligentes

Relatórios avançados

Gamificação

V3

Oficinas

Orçamentos

Marketplace

Benefícios

Cashback

Comunidade

Não implementar essas funcionalidades agora.

Apenas estruturar o código para que possam ser adicionadas futuramente.

46. PRINCIPAL MÉTRICA DO PRODUTO

A métrica central do aplicativo deve ser:

RESULTADO LÍQUIDO

Sempre que possível, mostrar:

Quanto entrou

Quanto saiu

Quanto sobrou

E, quando aplicável:

Quanto custou rodar

Quanto rendeu rodar

47. PRINCIPAL EXPERIÊNCIA DO USUÁRIO

O aplicativo deve fazer o usuário sentir:

"Agora eu sei exatamente para onde está indo meu dinheiro."

E para quem trabalha com moto:

"Agora eu sei exatamente quanto estou ganhando de verdade."

48. COPY PRINCIPAL

Na primeira experiência:

Sua moto gera dinheiro ou só leva dinheiro?

Depois:

Controle seus ganhos, gastos, combustível e manutenção em um só lugar.

CTA:

Começar agora

49. REGRAS DE DESENVOLVIMENTO

IMPORTANTE:

Não construir apenas mockups.

Criar banco de dados real.

Implementar autenticação real.

Implementar CRUD completo.

Implementar cálculos financeiros reais.

Implementar RLS.

Garantir responsividade.

Criar estados vazios.

Criar tratamento de erros.

Testar os principais fluxos.

Fluxos obrigatórios para testar:

Fluxo A

Cadastro → onboarding → cadastrar moto → dashboard.

Fluxo B

Adicionar ganho → dashboard atualizado.

Fluxo C

Adicionar gasto → dashboard atualizado.

Fluxo D

Adicionar abastecimento → consumo calculado.

Fluxo E

Adicionar manutenção → próxima manutenção exibida.

Fluxo F

Iniciar jornada → adicionar ganho → adicionar gasto → encerrar → resultado calculado.

Fluxo G

Criar meta → adicionar ganhos → progresso atualizado.

50. ORDEM DE IMPLEMENTAÇÃO

Construir nesta ordem:

FASE 1

Projeto visual

→ Layout
→ Navegação
→ Responsividade

FASE 2

Autenticação

→ Cadastro
→ Login
→ Logout

FASE 3

Banco

→ Supabase
→ Tabelas
→ RLS

FASE 4

Moto

→ Cadastro
→ Edição
→ Seleção

FASE 5

Financeiro

→ Ganhos
→ Despesas
→ Resultado

FASE 6

Combustível

→ Abastecimentos
→ Consumo
→ Custo/km

FASE 7

Manutenção

→ Histórico
→ Próximas
→ Alertas

FASE 8

Metas

→ Criação
→ Progresso
→ Cálculos

FASE 9

Modo trabalho

→ Jornada
→ Ganhos
→ Gastos
→ Lucro/hora

FASE 10

Dashboard

→ Consolidar todos os dados
→ Gráficos
→ Insights

51. CRITÉRIO FINAL DE ACEITE

Considere o MVP concluído somente quando um usuário novo conseguir:

Criar uma conta.

Cadastrar uma moto.

Informar KM.

Registrar um ganho.

Registrar uma despesa.

Registrar combustível.

Ver seu consumo.

Registrar manutenção.

Receber alerta de manutenção.

Criar uma meta.

Iniciar uma jornada.

Encerrar uma jornada.

Ver lucro líquido.

Ver custo/km.

Ver histórico.

Editar e excluir seus registros.

Utilizar tudo corretamente pelo celular.

O aplicativo deve estar funcional de ponta a ponta.

Não avançar para funcionalidades secundárias antes de garantir que esse fluxo esteja sólido.

RESULTADO ESPERADO

Entregar um MVP com aparência de produto real, não de protótipo.

O produto deve transmitir:

simplicidade + controle + inteligência + universo das motos.

A primeira tela deve responder imediatamente:

Quanto minha moto me custou e quanto ela me rendeu este mês?

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://gestaomotocapro.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c2109f63-5c6e-443d-b474-0b141d85fa6f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
