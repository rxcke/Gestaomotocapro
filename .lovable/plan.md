# Otimização SEO da landing pública

## Objetivo
Otimizar somente a página pública do Gestão Motoca Pro para buscas relacionadas ao controle financeiro de motoboys, entregadores, mototaxistas e profissionais que trabalham com moto. Preservar integralmente autenticação, Cakto, banco, RLS, planos, checkout e funcionalidades internas.

## Conteúdo e hierarquia da landing
- Manter um único H1: **“Você trabalha o dia inteiro. Mas sabe quanto realmente sobra?”**.
- Reorganizar as seções com os H2 solicitados: **Controle seus ganhos, gastos e lucro**, **Feito para quem vive sobre duas rodas**, **Controle seu combustível e manutenção**, **Saiba quanto realmente sobra**, **Como funciona**, **Planos** e **Perguntas frequentes**.
- Usar H3 nos cartões e etapas subordinados aos respectivos H2.
- Ajustar os textos existentes, sem criar texto artificial, para explicar naturalmente ganhos, gastos, combustível, manutenção, metas, resultado e lucro para motoboys, entregadores, mototaxistas e outros profissionais de moto.
- Preservar o visual, os preços e o fluxo atual de assinatura.

## Metadados e dados estruturados
- Definir o title exatamente como **“Gestão Motoca Pro | Controle seus ganhos, gastos e lucro”**.
- Definir a meta description exatamente como informada.
- Atualizar canonical e `og:url` para `https://gestaomotocapro.com.br/`.
- Configurar Open Graph e Twitter/X Card com título e descrições solicitados, sem imagem social artificial.
- Adicionar JSON-LD `SoftwareApplication`, usando somente informações confirmadas na página: nome, descrição, categoria, sistema operacional web, URL oficial e as três ofertas reais.
- Manter favicon, ícone Apple e manifesto já configurados; adicionar dimensões explícitas à logo visível para reduzir deslocamento de layout.

## Indexação e sitemap
- Criar `/sitemap.xml` no padrão do roteador, contendo somente a landing pública e sem `lastmod` artificial.
- Marcar cada rota com decisão explícita de sitemap; excluir em bloco autenticação, aplicativo privado, administração, onboarding, pagamentos e APIs.
- Adicionar `noindex, nofollow` nos layouts de autenticação e área privada, cobrindo login/cadastro, callback, recuperação de senha, dashboard e demais páginas internas sem alterar seu funcionamento.
- Atualizar `robots.txt` para permitir a landing e declarar `https://gestaomotocapro.com.br/sitemap.xml`. O bloqueio de indexação das páginas privadas será feito por metadados, não por `robots.txt`, para que os buscadores consigam ler a diretiva `noindex`.

## Performance, rastreabilidade e validação
- Confirmar que a landing continua renderizada no servidor e acessível sem sessão.
- Verificar title, description, canonical, Open Graph, Twitter Card e JSON-LD no HTML renderizado.
- Validar `/sitemap.xml`, `robots.txt`, favicon e ausência de páginas privadas no sitemap.
- Conferir hierarquia H1/H2/H3, ausência de texto escondido e linguagem natural sem repetição excessiva.
- Testar a landing em celular e desktop, verificando rolagem horizontal, estabilidade visual e erros no navegador.
- Executar a checagem de tipos e os testes existentes; repetir a auditoria SEO rápida após as correções.

## Google Search Console
- Deixar o domínio, canonical, sitemap e metadados preparados para `https://gestaomotocapro.com.br/`.
- Não conectar nem verificar o Google Search Console nesta etapa. Após publicar, a única ação manual será adicionar/verificar a propriedade e enviar o sitemap, caso ainda não estejam configurados.
