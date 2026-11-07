// Documentação de cada projeto: visão geral, funcionalidades, telas, arquitetura e decisões.
// Texto em PT e EN. As imagens ficam em /public/shots/<slug>/ (ver "S" abaixo).
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const shots = (dir, list) => list.map(([file, pt, en]) => ({ src: `/shots/${dir}/${file.replace('.png', '.webp')}`, pt, en }))

export const DOC_UI = {
  pt: {
    open: 'Ver documentação',
    close: 'Fechar',
    overview: 'Visão geral',
    role: 'Meu papel',
    features: 'Funcionalidades',
    screens: 'Telas',
    screensHint: 'Clique numa tela para ampliar.',
    arch: 'Arquitetura',
    decisions: 'Decisões técnicas',
    data: 'Sobre os dados e as imagens',
    stack: 'Stack',
    docTag: 'Documentação',
    count: (n) => `${n} telas`,
    prev: 'Anterior',
    next: 'Próxima',
  },
  en: {
    open: 'View documentation',
    close: 'Close',
    overview: 'Overview',
    role: 'My role',
    features: 'Features',
    screens: 'Screens',
    screensHint: 'Click a screen to enlarge it.',
    arch: 'Architecture',
    decisions: 'Technical decisions',
    data: 'About the data and images',
    stack: 'Stack',
    docTag: 'Documentation',
    count: (n) => `${n} screens`,
    prev: 'Previous',
    next: 'Next',
  },
}

export const DOCS = {
  'central-ygor': {
    shots: shots('central-ygor', [
      ['01-inicio.png', 'Início: resumo do dia', 'Home: the day at a glance'],
      ['02-cartoes.png', 'Cartões e gastos', 'Cards and spending'],
      ['03-conta.png', 'Conta bancária', 'Bank account'],
      ['04-contas-a-pagar.png', 'Contas a pagar', 'Bills to pay'],
      ['05-bonus.png', 'Bônus por vídeo', 'Per-video bonus'],
      ['06-investimentos.png', 'Investimentos', 'Investments'],
      ['07-orcamento.png', 'Orçamento por categoria', 'Budget by category'],
      ['08-kakeibo.png', 'Kakeibo', 'Kakeibo'],
      ['09-conteudo.png', 'Calendário de conteúdo', 'Content calendar'],
      ['10-estudio.png', 'Estúdio: posts e tarefas', 'Studio: posts and tasks'],
      ['11-vagas.png', 'Vagas freelancer capturadas', 'Captured freelance jobs'],
      ['12-clientes.png', 'Clientes', 'Clients'],
      ['13-hoje.png', 'Vida: panorama de hoje', 'Life: today overview'],
      ['14-compromissos.png', 'Compromissos', 'Appointments'],
      ['15-habitos.png', 'Hábitos', 'Habits'],
      ['16-metas.png', 'Metas', 'Goals'],
      ['17-projetos.png', 'Projetos pessoais', 'Personal projects'],
      ['18-aprendizado.png', 'Aprendizado com revisão espaçada', 'Learning with spaced review'],
      ['19-ideias.png', 'Caixa de ideias', 'Idea box'],
      ['20-inbox.png', 'Inbox', 'Inbox'],
      ['21-inicio-mobile.png', 'Início no celular', 'Home on mobile'],
      ['22-cartoes-mobile.png', 'Cartões no celular', 'Cards on mobile'],
      ['23-habitos-mobile.png', 'Hábitos no celular', 'Habits on mobile'],
    ]),
    pt: {
      role: 'Projeto pessoal, feito sozinho: desenho, front-end, back-end, banco de dados, automações e deploy.',
      overview:
        'Um painel único para organizar a vida e o trabalho: finanças, conteúdo, freelas, hábitos, metas e projetos. Roda 24h na Vercel, guarda os dados no Supabase e é protegido por PIN, com opção de Face ID (passkey). Um mascote em pixel art dá o resumo do dia.',
      features: [
        { t: 'Resumo do dia', d: 'A home junta o que pede atenção agora: contas vencendo, compromissos, faturas fechando e o progresso do bônus por visualizações.' },
        { t: 'Finanças completas', d: 'Cartões com limite, fatura aberta e dia de fechamento; conta bancária; contas a pagar recorrentes; investimentos; orçamento por categoria; método Kakeibo.' },
        { t: 'Lançamento rápido de gasto', d: 'Uma mensagem como "cartão, 89,90, mercado" vira um lançamento. O parser é local, sem gastar chamada de IA.' },
        { t: 'Bônus por vídeo', d: 'Calcula o bônus a partir das views por plataforma e mostra o caminho até a meta mensal.' },
        { t: 'Trabalho e vagas', d: 'Fluxo n8n captura vagas freelancer, dá uma nota e entrega no painel, com funil de status e lista de clientes.' },
        { t: 'Vida', d: 'Compromissos, hábitos com mapa de calor, metas, projetos com fases e tarefas, ideias, links salvos, burocracia e um cofre cifrado.' },
        { t: 'Aprendizado', d: 'Cartões de revisão espaçada por trilha e resumos pesquisáveis.' },
        { t: 'Assistente no Telegram', d: 'Bots recebem texto e áudio transcrito para lançar gastos, ideias e lembretes, através de um workflow n8n.' },
        { t: 'Modo privacidade', d: 'Valores sensíveis ficam borrados até o usuário revelar, para usar o painel em público.' },
        { t: 'Mobile de verdade', d: 'Dock inferior, folhas de ação e layout próprio para o celular.' },
      ],
      architecture: [
        'Astro em modo servidor (SSR) com ilhas de React para as telas interativas; Tailwind para o visual.',
        'Supabase (Postgres) acessado só pelo servidor com chave de serviço. Nada disso vai para o navegador.',
        'Rotas /api com autorização por cookie de sessão ou chave de automação (n8n), em um único ponto (withAuth).',
        'Deploy na Vercel com o adaptador oficial do Astro.',
        'Automação: um workflow n8n com gatilhos de Telegram e agendamentos chama as rotas do próprio app.',
      ],
      decisions: [
        'Sessão por token aleatório: o banco guarda só o hash SHA-256, então quem lê a tabela não consegue montar um cookie válido. A comparação do PIN usa timing-safe equal.',
        'Paginação explícita nas consultas que só crescem (lançamentos e movimentos), porque o PostgREST corta em 1.000 linhas e os gastos recentes sumiriam sem erro.',
        'Cada consulta da home roda dentro de um "safe" com valor padrão: se o banco falhar, a página ainda abre.',
        'Cálculos de cartão, patrimônio, bônus e lembretes ficam em funções puras com testes (Vitest).',
        'Tudo que usa IA é opcional: sem a chave, o app funciona igual, só sem aquela função.',
      ],
      data: 'Os prints desta documentação vêm de uma cópia de demonstração do app, com um banco simulado e dados inventados (valores, nomes e compromissos fictícios). Nenhum dado financeiro ou pessoal real aparece aqui.',
    },
    en: {
      role: 'Personal project, built solo: design, front-end, back-end, database, automations and deployment.',
      overview:
        'A single dashboard to run life and work: finances, content, freelance jobs, habits, goals and projects. It runs 24/7 on Vercel, stores data in Supabase and is protected by a PIN, with optional Face ID (passkey). A pixel-art mascot gives the daily summary.',
      features: [
        { t: 'Daily summary', d: 'The home screen gathers what needs attention now: bills due, appointments, card statements closing and progress toward the views bonus.' },
        { t: 'Full finances', d: 'Cards with limit, open statement and closing day; bank account; recurring bills; investments; budget by category; the Kakeibo method.' },
        { t: 'Quick expense entry', d: 'A message like "card, 89.90, groceries" becomes an entry. The parser runs locally, with no AI call.' },
        { t: 'Per-video bonus', d: 'Computes the bonus from views per platform and shows the path to the monthly goal.' },
        { t: 'Work and jobs', d: 'An n8n flow collects freelance job posts, scores them and delivers them to the dashboard, with a status funnel and a client list.' },
        { t: 'Life', d: 'Appointments, habits with a heat map, goals, projects with phases and tasks, ideas, saved links, paperwork notes and an encrypted vault.' },
        { t: 'Learning', d: 'Spaced-repetition cards per track and searchable summaries.' },
        { t: 'Telegram assistant', d: 'Bots take text and transcribed audio to log expenses, ideas and reminders, through an n8n workflow.' },
        { t: 'Privacy mode', d: 'Sensitive values stay blurred until revealed, so the dashboard can be used in public.' },
        { t: 'Real mobile layout', d: 'Bottom dock, action sheets and a layout made for the phone.' },
      ],
      architecture: [
        'Astro in server mode (SSR) with React islands for interactive screens; Tailwind for styling.',
        'Supabase (Postgres) accessed only from the server with a service key. None of it reaches the browser.',
        '/api routes authorised by a session cookie or an automation key (n8n), in a single place (withAuth).',
        'Deployed on Vercel with the official Astro adapter.',
        'Automation: one n8n workflow with Telegram triggers and schedules calls the app\'s own routes.',
      ],
      decisions: [
        'Session by random token: the database stores only the SHA-256 hash, so anyone reading the table cannot build a valid cookie. The PIN check uses a timing-safe comparison.',
        'Explicit pagination on queries that only grow (entries and transactions), because PostgREST cuts at 1,000 rows and recent expenses would vanish silently.',
        'Every home-page query runs inside a "safe" wrapper with a fallback value: if the database fails, the page still opens.',
        'Card, net worth, bonus and reminder calculations live in pure functions with tests (Vitest).',
        'Anything that uses AI is optional: without the key the app works the same, just without that feature.',
      ],
      data: 'The screenshots in this documentation come from a demo copy of the app with a simulated database and made-up data (fictional amounts, names and appointments). No real financial or personal data appears here.',
    },
  },

  rogyfacul: {
    shots: shots('rogyfacul', [
      ['01-home.png', 'Home: nível, XP e missão do dia', 'Home: level, XP and daily mission'],
      ['02-curso.png', 'Curso em fases com progresso', 'Course in phases with progress'],
      ['03-curso-tecnologia.png', 'Outro curso, fases e materiais', 'Another course, phases and materials'],
      ['04-aula.png', 'Aula em vídeo com status e anotações', 'Video lesson with status and notes'],
      ['05-baralhos.png', 'Baralhos: um por curso', 'Decks: one per course'],
      ['06-baralho.png', 'Cartões de um baralho', 'Cards in a deck'],
      ['07-revisar.png', 'Revisão: resposta revelada', 'Review: answer revealed'],
      ['08-cartoes.png', 'Criar cartões por curso', 'Create cards per course'],
      ['09-concluidos.png', 'Cursos concluídos', 'Completed courses'],
      ['10-importar.png', 'Importar um curso em JSON', 'Import a course from JSON'],
      ['11-home-mobile.png', 'Home no celular', 'Home on mobile'],
      ['12-curso-mobile.png', 'Curso no celular', 'Course on mobile'],
      ['13-revisar-mobile.png', 'Revisão no celular', 'Review on mobile'],
    ]),
    pt: {
      role: 'Projeto pessoal, feito sozinho: produto, design, front-end, back-end, testes e deploy.',
      overview:
        'Uma biblioteca de estudo pessoal com cara de videogame. Cada curso é dividido em fases (módulos) com materiais; estudar dá XP, sobe de nível e mantém uma sequência diária. Um gato em pixel art, o Simba, comenta o progresso. Pensado primeiro para o celular.',
      features: [
        { t: 'Curso → módulo → material', d: 'Cada fase tem objetivo, atividade e materiais (vídeo, livro, artigo, podcast, ferramenta), com status "a estudar", "estudando" e "feito".' },
        { t: 'Gamificação derivada dos dados', d: '10 XP por minuto de aula, um nível a cada 500 XP, sequência de dias e missão do dia (2 aulas, +50 XP). Nada disso tem tabela própria: é calculado do que já existe.' },
        { t: 'Aulas em vídeo', d: 'Player embutido, anotações, navegação entre aulas e botão "Continuar" que leva à próxima.' },
        { t: 'Revisão espaçada', d: 'Baralhos por curso, cartões para revisar hoje, pergunta e resposta reveladas ao toque.' },
        { t: 'Importação de cursos', d: 'Um JSON cria o curso inteiro. Itens opcionais ficam de fora do progresso.' },
        { t: 'Enriquecimento via YouTube', d: 'Uma rota de servidor busca título, canal e duração na API do YouTube sem expor a chave.' },
        { t: 'Link quebrado', d: 'Qualquer material pode ser marcado como link quebrado para revisão.' },
        { t: 'Diploma e concluídos', d: 'Ao fechar um curso, ele vai para a página de concluídos com diploma.' },
        { t: 'Acessibilidade e movimento', d: 'Com "reduzir movimento" ligado no aparelho, todas as animações são desligadas.' },
      ],
      architecture: [
        'Astro 7 em modo servidor, Tailwind 4 e fontes locais (sem chamar o Google).',
        'Supabase com schema próprio, RLS ligado e chave pública (anon): o RLS é a proteção real. Não existe chave de serviço no projeto.',
        'Login por e-mail e senha do Supabase Auth, com cadastro aberto desligado; páginas e rotas redirecionam para /login sem sessão.',
        'Deploy na Vercel; build com checagem de tipos (astro check) e testes unitários (Vitest).',
      ],
      decisions: [
        'Regras de jogo em funções puras (lib/jogo.ts), testáveis, derivadas do progresso. Desfazer uma aula devolve o XP automaticamente.',
        'Sem service_role de propósito: se uma rota vazar, o pior caso é o que o RLS permite.',
        'A chave do YouTube só existe no servidor e é usada em uma única rota.',
        'Visual "Preto Simba": âmbar como cor principal, cards com quina 3D que afunda ao toque, para dar sensação de botão de jogo.',
      ],
      data: 'Os prints vêm de uma cópia de demonstração, com banco simulado e cursos, autores e vídeos fictícios. O player mostra um vídeo livre de exemplo.',
    },
    en: {
      role: 'Personal project, built solo: product, design, front-end, back-end, tests and deployment.',
      overview:
        'A personal study library with a video-game feel. Each course is split into phases (modules) with materials; studying earns XP, levels up and keeps a daily streak. A pixel-art cat, Simba, comments on progress. Designed mobile-first.',
      features: [
        { t: 'Course → module → material', d: 'Each phase has a goal, an activity and materials (video, book, article, podcast, tool), with "to study", "studying" and "done" statuses.' },
        { t: 'Gamification derived from data', d: '10 XP per lesson minute, a level every 500 XP, a day streak and a daily mission (2 lessons, +50 XP). None of it has its own table: it is computed from what already exists.' },
        { t: 'Video lessons', d: 'Embedded player, notes, lesson-to-lesson navigation and a "Continue" button that jumps to the next one.' },
        { t: 'Spaced repetition', d: 'Decks per course, cards due today, question and answer revealed on tap.' },
        { t: 'Course import', d: 'One JSON creates the whole course. Optional items stay out of the progress bar.' },
        { t: 'YouTube enrichment', d: 'A server route fetches title, channel and duration from the YouTube API without exposing the key.' },
        { t: 'Broken link', d: 'Any material can be flagged as a broken link for review.' },
        { t: 'Diploma and completed', d: 'When a course is finished it moves to the completed page with a diploma.' },
        { t: 'Accessibility and motion', d: 'With "reduce motion" on at the device level, every animation is turned off.' },
      ],
      architecture: [
        'Astro 7 in server mode, Tailwind 4 and local fonts (no Google calls).',
        'Supabase with its own schema, RLS on and a public (anon) key: RLS is the real protection. There is no service key in the project.',
        'Email and password login through Supabase Auth with open sign-ups disabled; pages and routes redirect to /login without a session.',
        'Deployed on Vercel; the build runs type checks (astro check) and unit tests (Vitest).',
      ],
      decisions: [
        'Game rules in pure functions (lib/jogo.ts), testable and derived from progress. Undoing a lesson gives the XP back automatically.',
        'No service_role on purpose: if a route leaks, the worst case is whatever RLS allows.',
        'The YouTube key exists only on the server and is used in a single route.',
        '"Preto Simba" look: amber as the main colour and 3D-cornered cards that press in on touch, to feel like game buttons.',
      ],
      data: 'The screenshots come from a demo copy with a simulated database and fictional courses, authors and videos. The player shows a freely licensed sample video.',
    },
  },

  blog: {
    shots: shots('blog', [
      ['01-home.png', 'Home do site "Ygor."', 'Home of the "Ygor." site'],
      ['02-lista.png', 'Lista de artigos', 'Article list'],
      ['03-artigo.png', 'Artigo em MDX', 'MDX article'],
      ['04-artigo-2.png', 'Outro artigo', 'Another article'],
      ['05-categoria.png', 'Filtro por categoria', 'Category filter'],
      ['06-portfolio-case.png', 'Página de case do portfólio', 'Portfolio case page'],
      ['07-sobre.png', 'Sobre', 'About'],
      ['08-contato.png', 'Contato', 'Contact'],
      ['09-prestadores.png', 'Página para prestadores de serviço', 'Page for service providers'],
      ['10-home-mobile.png', 'Home no celular', 'Home on mobile'],
      ['11-artigo-mobile.png', 'Artigo no celular', 'Article on mobile'],
    ]),
    pt: {
      role: 'Projeto pessoal, feito sozinho: identidade, design, código, conteúdo e publicação.',
      overview:
        'Site e blog da minha marca profissional, "Ygor.", para atrair pequenos negócios que precisam de site, landing page e automação. Os artigos contam o que foi testado de verdade, inclusive o que deu errado.',
      features: [
        { t: 'Blog em MDX', d: 'Artigos escritos em Markdown com componentes, tempo de leitura calculado e data de publicação.' },
        { t: 'Categorias', d: 'Automação, IA aplicada e Front-end, com páginas de filtro.' },
        { t: 'Páginas de case', d: 'Cada projeto de portfólio tem a própria página com contexto, solução e resultado.' },
        { t: 'Páginas comerciais', d: 'Serviços, planos, sobre e uma página específica para prestadores de serviço.' },
        { t: 'Contato direto', d: 'Botão fixo de WhatsApp e página de contato com os canais.' },
        { t: 'Animações suaves', d: 'Rolagem suave e animações de entrada com GSAP e Lenis, sem travar a leitura.' },
        { t: 'LGPD', d: 'Política de privacidade, termos de uso e preferências de cookies.' },
        { t: 'SEO', d: 'Metadados por página, sitemap e títulos pensados para busca.' },
      ],
      architecture: [
        'Next.js 16 com React 19 e Tailwind 4 (com o plugin de tipografia para os artigos).',
        'Conteúdo em arquivos MDX lidos no build (next-mdx-remote, gray-matter, reading-time).',
        'Exportação estática, com a ferramenta de publicação da Cloudflare (wrangler) configurada, sem servidor para manter.',
        'GSAP e Lenis para movimento; fontes e cores definidas como tokens.',
      ],
      decisions: [
        'Site estático: mais rápido, mais barato e sem superfície de ataque de servidor.',
        'Artigos em MDX versionados no repositório, em vez de um CMS, para escrever e revisar como código.',
        'Textos honestos ("o que funcionou e o que travou") para construir confiança em vez de prometer resultado.',
      ],
      data: 'É um site público: os prints mostram o site real, tirados de uma execução local do projeto.',
    },
    en: {
      role: 'Personal project, built solo: identity, design, code, content and publishing.',
      overview:
        'Website and blog for my professional brand, "Ygor.", to attract small businesses that need a website, a landing page and automation. The articles tell what was actually tested, including what went wrong.',
      features: [
        { t: 'MDX blog', d: 'Articles written in Markdown with components, computed reading time and a publish date.' },
        { t: 'Categories', d: 'Automation, Applied AI and Front-end, with filter pages.' },
        { t: 'Case pages', d: 'Every portfolio project has its own page with context, solution and outcome.' },
        { t: 'Commercial pages', d: 'Services, plans, about and a dedicated page for service providers.' },
        { t: 'Direct contact', d: 'A fixed WhatsApp button and a contact page with the channels.' },
        { t: 'Smooth motion', d: 'Smooth scrolling and entrance animations with GSAP and Lenis, without hurting reading.' },
        { t: 'Privacy law (LGPD)', d: 'Privacy policy, terms of use and cookie preferences.' },
        { t: 'SEO', d: 'Per-page metadata, sitemap and titles written for search.' },
      ],
      architecture: [
        'Next.js 16 with React 19 and Tailwind 4 (with the typography plugin for articles).',
        'Content in MDX files read at build time (next-mdx-remote, gray-matter, reading-time).',
        "Static export, with Cloudflare's publishing tool (wrangler) set up, and no server to maintain.",
        'GSAP and Lenis for motion; fonts and colours defined as tokens.',
      ],
      decisions: [
        'Static site: faster, cheaper and with no server attack surface.',
        'MDX articles versioned in the repository instead of a CMS, so writing and reviewing work like code.',
        'Honest writing ("what worked and what broke") to build trust instead of promising results.',
      ],
      data: 'This is a public site: the screenshots show the real site, taken from a local run of the project.',
    },
  },

  'original-sp-tattoo': {
    shots: shots('original-sp-tattoo', [
      ['01-home.png', 'Home com chamada para agendar', 'Home with a booking call to action'],
      ['02-portfolio.png', 'Portfólio de tatuagens', 'Tattoo portfolio'],
      ['03-artistas.png', 'Equipe de artistas', 'Artist team'],
      ['04-sobre.png', 'Sobre o estúdio', 'About the studio'],
      ['05-contato.png', 'Contato e unidades', 'Contact and locations'],
      ['06-piercing-moema.png', 'Piercing: unidade Moema', 'Piercing: Moema location'],
      ['07-piercing-taboao.png', 'Piercing: unidade Taboão da Serra', 'Piercing: Taboão da Serra location'],
      ['08-home-mobile.png', 'Home no celular', 'Home on mobile'],
      ['09-portfolio-mobile.png', 'Portfólio no celular', 'Portfolio on mobile'],
      ['10-artistas-mobile.png', 'Artistas no celular', 'Artists on mobile'],
    ]),
    pt: {
      role: 'Trabalho profissional: front-end, conteúdo e manutenção do site do estúdio onde atuo. Sou o dev responsável.',
      overview:
        'Site institucional de um estúdio de tatuagem em São Paulo, com duas unidades (Taboão da Serra e Moema). O objetivo é simples: mostrar o trabalho e levar a pessoa a agendar pelo WhatsApp, em qualquer idioma e em qualquer tela.',
      features: [
        { t: 'Foco em conversão', d: 'A chamada "Agendar no WhatsApp" aparece na abertura e em um botão fixo em todas as páginas.' },
        { t: 'Portfólio com abas', d: 'Galeria de tatuagens e de piercing, com ampliação ao tocar na peça.' },
        { t: 'Equipe', d: 'Uma seção por artista, com história, especialidades e estilos.' },
        { t: 'Uma página por unidade', d: 'Páginas dedicadas para as duas unidades, com endereço e contato.' },
        { t: 'Três idiomas', d: 'Português, inglês e espanhol, para turistas e clientes de fora.' },
        { t: 'Navegação lateral', d: 'Menu fixo com ícones que cabe em qualquer tamanho de tela.' },
        { t: 'Páginas legais', d: 'Política de privacidade e termos, como a lei exige.' },
      ],
      architecture: [
        'Vite com Tailwind e JavaScript puro, sem framework, para o site abrir rápido.',
        'Páginas HTML estáticas e um sitemap para busca.',
        'Especificações de site e de design versionadas junto do código.',
      ],
      decisions: [
        'JavaScript puro em vez de um framework: o site é de conteúdo, então menos código significa carregamento mais rápido e menos manutenção.',
        'Uma página para cada unidade, para que cada uma tenha endereço e contato próprios e apareça melhor na busca local.',
        'Um único objetivo por página (agendar), em vez de tentar mostrar tudo de uma vez.',
      ],
      data: 'É um site público em produção. Os prints mostram o site real, sem nenhum dado interno.',
    },
    en: {
      role: 'Professional work: front-end, content and upkeep of the website of the studio where I work. I am the developer in charge.',
      overview:
        'Corporate website for a tattoo studio in São Paulo with two locations (Taboão da Serra and Moema). The goal is simple: show the work and get people to book through WhatsApp, in any language and on any screen.',
      features: [
        { t: 'Conversion focus', d: 'The "Book on WhatsApp" call to action sits in the hero and in a fixed button on every page.' },
        { t: 'Tabbed portfolio', d: 'Tattoo and piercing galleries, with enlargement when you tap a piece.' },
        { t: 'Team', d: 'One section per artist, with story, specialties and styles.' },
        { t: 'One page per location', d: 'Dedicated pages for both locations, with address and contact.' },
        { t: 'Three languages', d: 'Portuguese, English and Spanish, for tourists and clients from abroad.' },
        { t: 'Side navigation', d: 'A fixed icon menu that fits any screen size.' },
        { t: 'Legal pages', d: 'Privacy policy and terms, as the law requires.' },
      ],
      architecture: [
        'Vite with Tailwind and plain JavaScript, no framework, so the site opens fast.',
        'Static HTML pages and a sitemap for search.',
        'Site and design specs versioned alongside the code.',
      ],
      decisions: [
        'Plain JavaScript instead of a framework: this is a content site, so less code means faster loading and less upkeep.',
        'One page per location, so each has its own address and contact and shows up better in local search.',
        'One goal per page (booking), instead of trying to show everything at once.',
      ],
      data: 'This is a public production site. The screenshots show the real site, with no internal data.',
    },
  },

  conexus: {
    shots: shots('conexus', [
      ['01-fluxo-atendimento.png', 'Fluxo de atendimento por WhatsApp com IA', 'WhatsApp support flow with AI'],
      ['02-catalogo-casos.png', 'As 15 automações da série', 'The 15 automations in the series'],
    ]),
    pt: {
      role: 'Projeto pessoal de portfólio: escolha dos casos, desenho dos fluxos no n8n, documentação e roteiros de vídeo.',
      overview:
        'Conexus é uma agência de automações com n8n. Para mostrar capacidade antes de ter clientes, criei 15 casos com empresas fictícias, cada um com diagnóstico da dor, fluxo funcionando, documentação e roteiro de vídeo curto.',
      features: [
        { t: 'Atendimento por WhatsApp com IA', d: 'Uma IA classifica cada mensagem em Urgente, Dúvida frequente, Agendamento ou Outro e cada categoria segue o seu caminho.' },
        { t: 'Escalonamento real', d: 'Mensagem urgente avisa a equipe pelo Telegram, além de confirmar ao paciente. Mensagem que a IA não entende vai para revisão humana.' },
        { t: 'Respeita o horário comercial', d: 'Fora do expediente, a resposta avisa que a clínica retorna quando abrir, sem fingir atendimento em tempo real.' },
        { t: 'CRM simples', d: 'Toda mensagem termina em uma planilha com telefone, categoria, texto e horário.' },
        { t: 'Relatório diário', d: 'Às 20h, outro gatilho do mesmo workflow conta os atendimentos do dia por categoria e envia o resumo.' },
        { t: 'Tolerância a falhas', d: 'Nós externos têm 3 tentativas e, nos de saída, o fluxo segue mesmo se um envio falhar, para o registro nunca se perder.' },
        { t: '15 casos em nichos diferentes', d: 'Clínica, imobiliária, e-commerce, contabilidade, recrutamento, barbearia e mais.' },
      ],
      architecture: [
        'n8n como orquestrador, com gatilhos de WhatsApp e de agenda (schedule).',
        'Modelo de linguagem para classificação de texto, com temperatura baixa para respostas consistentes.',
        'Postgres para consultar o cadastro do paciente, Google Sheets como CRM e Telegram para alertas.',
        'Cada caso tem uma pasta com diagnóstico, fluxo e documentação em duas versões: a técnica e a semântica.',
      ],
      decisions: [
        'Sem nó Switch depois do classificador: ele já entrega uma saída por categoria, então rotear de novo seria duplicar a decisão.',
        'Casos fictícios primeiro: constroem prova de capacidade antes de prometer resultado a um cliente real.',
        'Registrar tudo no CRM, inclusive o que não recebe resposta automática, para nada se perder em silêncio.',
        'Um caso grátis (a "isca") com dor universal e fácil de demonstrar em vídeo curto.',
      ],
      data: 'As empresas, pessoas e mensagens dos casos são inventadas. Como um fluxo do n8n mostra credenciais e dados de clientes, as imagens aqui são diagramas desenhados a partir da documentação dos fluxos, e não capturas do editor.',
    },
    en: {
      role: 'Personal portfolio project: choosing the cases, designing the n8n flows, documentation and short-video scripts.',
      overview:
        'Conexus is an automation agency built on n8n. To show capability before having clients, I created 15 cases with fictional companies, each with a pain diagnosis, a working flow, documentation and a short-video script.',
      features: [
        { t: 'WhatsApp support with AI', d: 'An AI sorts each message into Urgent, Frequent question, Booking or Other, and each category follows its own path.' },
        { t: 'Real escalation', d: 'An urgent message alerts the team on Telegram, besides confirming to the patient. A message the AI cannot read goes to human review.' },
        { t: 'Respects business hours', d: 'Outside working hours the reply says the clinic will answer when it opens, without pretending to be live.' },
        { t: 'Simple CRM', d: 'Every message ends in a spreadsheet with phone, category, text and time.' },
        { t: 'Daily report', d: 'At 8 pm another trigger in the same workflow counts the day\'s conversations by category and sends the summary.' },
        { t: 'Fault tolerance', d: 'External nodes retry 3 times and, on output nodes, the flow keeps going even if a send fails, so the record is never lost.' },
        { t: '15 cases in different niches', d: 'Clinic, real estate, e-commerce, accounting, recruiting, barbershop and more.' },
      ],
      architecture: [
        'n8n as the orchestrator, with WhatsApp and schedule triggers.',
        'A language model for text classification, with low temperature for consistent output.',
        'Postgres to look up the patient record, Google Sheets as the CRM and Telegram for alerts.',
        'Each case has a folder with diagnosis, flow and documentation in two versions: technical and semantic.',
      ],
      decisions: [
        'No Switch node after the classifier: it already outputs one branch per category, so routing again would duplicate the decision.',
        'Fictional cases first: they build proof of capability before promising results to a real client.',
        'Log everything in the CRM, including what gets no automatic reply, so nothing is lost silently.',
        'One free case (the "bait") with a universal pain that is easy to demo in a short video.',
      ],
      data: 'The companies, people and messages in the cases are made up. Because an n8n flow shows credentials and client data, the images here are diagrams drawn from the flow documentation, not editor captures.',
    },
  },
}

const list = (items) => `<ul class="doc__list">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`

// HTML da documentação de um projeto (o conteúdo textual vem de DOCS; stack e nomes vêm do cartão)
export function docHtml(lang, slug, { name, tag, stack }) {
  const d = DOCS[slug]
  if (!d) return ''
  const t = DOC_UI[lang]
  const c = d[lang]
  const shotsHtml = d.shots
    .map(
      (s, i) => `<figure class="doc__shot">
        <button type="button" class="doc__shot-btn" data-doc-shot="${i}" aria-label="${esc(s[lang])}">
          <img src="${esc(s.src)}" alt="${esc(s[lang])}" loading="lazy" width="1280" height="720">
        </button>
        <figcaption>${esc(s[lang])}</figcaption>
      </figure>`,
    )
    .join('')
  return `<header class="doc__head">
      <div>
        <p class="doc__eyebrow">${esc(t.docTag)} · ${esc(tag)}</p>
        <h2 id="doc-title">${esc(name)}</h2>
      </div>
      <button type="button" class="doc__close" data-doc-close aria-label="${esc(t.close)}">✕ <kbd>Esc</kbd></button>
    </header>
    <nav class="doc__nav" aria-label="${esc(t.docTag)}">
      <a href="#doc-sec-overview">${esc(t.overview)}</a>
      <a href="#doc-sec-features">${esc(t.features)}</a>
      <a href="#doc-sec-screens">${esc(t.screens)}</a>
      <a href="#doc-sec-arch">${esc(t.arch)}</a>
      <a href="#doc-sec-decisions">${esc(t.decisions)}</a>
    </nav>
    <div class="doc__body" id="doc-body" tabindex="-1">
      <section id="doc-sec-overview" class="doc__sec">
        <h3>${esc(t.overview)}</h3>
        <p>${esc(c.overview)}</p>
        <p class="doc__role"><strong>${esc(t.role)}:</strong> ${esc(c.role)}</p>
        <p class="doc__stack"><strong>${esc(t.stack)}:</strong> ${esc(stack.join(' · '))}</p>
      </section>
      <section id="doc-sec-features" class="doc__sec">
        <h3>${esc(t.features)}</h3>
        <div class="doc__features">${c.features.map((f) => `<article><h4>${esc(f.t)}</h4><p>${esc(f.d)}</p></article>`).join('')}</div>
      </section>
      <section id="doc-sec-screens" class="doc__sec">
        <h3>${esc(t.screens)} <span class="doc__count">${esc(t.count(d.shots.length))}</span></h3>
        <p class="doc__hint">${esc(t.screensHint)}</p>
        <div class="doc__gallery">${shotsHtml}</div>
      </section>
      <section id="doc-sec-arch" class="doc__sec">
        <h3>${esc(t.arch)}</h3>
        ${list(c.architecture)}
      </section>
      <section id="doc-sec-decisions" class="doc__sec">
        <h3>${esc(t.decisions)}</h3>
        ${list(c.decisions)}
      </section>
      <section class="doc__sec doc__sec--note">
        <h3>${esc(t.data)}</h3>
        <p>${esc(c.data)}</p>
      </section>
    </div>`
}
