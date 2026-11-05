// Todo o texto do portfólio vive aqui (PT e EN). Edite aqui, o resto se atualiza.
// Para adicionar um print num projeto: salve em public/shots/<slug>.png (ou .webp)
// e troque `shot: null` por `shot: '/shots/<slug>.png'` em PROJECT_BASE.

export const SITE_URL = 'https://ygor-portfolio.vercel.app'

export const LINKS = {
  linkedin: 'https://www.linkedin.com/in/ygor-gs2006/',
  github: 'https://github.com/ygos-96',
  email: 'ygs.contato@gmail.com',
  whatsapp: 'https://wa.me/5511961802437',
  phone: '(11) 96180-2437',
  cv: { pt: '/Ygor-Gomes-Curriculo.pdf', en: '/Ygor-Gomes-Resume-EN.pdf' },
}

export const SECTION_ORDER = ['sobre', 'projetos', 'formacao', 'skills', 'contato']

export const PROJECT_BASE = {
  'central-ygor': { stack: ['Astro', 'React', 'Tailwind', 'Supabase', 'n8n', 'Vercel'], shot: null, hue: ['#5b8def', '#8e7dff'] },
  'dash-campanhas': { stack: ['React 19', 'Vite', 'Tailwind 4', 'Node.js'], shot: null, hue: ['#f4a259', '#e76f51'], internal: true },
  'original-sp-tattoo': { stack: ['Vite', 'Tailwind', 'JavaScript', 'i18n PT/EN/ES'], shot: null, hue: ['#3b3b4f', '#c8553d'] },
  conexus: { stack: ['n8n', 'Webhooks', 'REST', 'JSON', 'LLMs'], shot: null, hue: ['#2a9d8f', '#5aa469'] },
  rogyfacul: { stack: ['Astro 7', 'Tailwind 4', 'Supabase', 'Vitest'], shot: null, hue: ['#1c1c1c', '#f0a92b'] },
  blog: { stack: ['Next.js', 'Tailwind', 'MDX', 'GitHub API', 'Vercel'], shot: null, hue: ['#4f7fcf', '#2a9d8f'] },
}

const pt = {
  lang: 'pt',
  htmlLang: 'pt-BR',
  ogLocale: 'pt_BR',
  meta: {
    title: 'Ygor Gomes | Desenvolvedor Front-End · React, Astro e Automações n8n',
    description:
      'Portfólio interativo de Ygor Gomes, desenvolvedor front-end em São Paulo. Sites, painéis e automações com n8n e IA. Explore o mapa ou abra o modo rápido.',
  },
  ui: {
    start: 'Começar',
    introHint: 'Ande pelo bairro e entre nos prédios para conhecer meu trabalho.',
    keys: 'WASD ou setas para andar · E para entrar · Esc para fechar',
    touch: 'Arraste o joystick para andar · toque em Entrar',
    enter: 'Entrar',
    enterIn: 'Entrar em',
    close: 'Fechar',
    fast: 'Modo rápido',
    fastHint: 'Prefere ver tudo de uma vez? Abra a versão em texto.',
    backToMap: 'Voltar ao mapa',
    langOther: 'EN',
    langOtherLabel: 'Switch to English',
    cvLabel: 'Baixar currículo (PDF)',
    shortcuts: 'Atalhos',
    mapLabel: 'Mapa interativo do portfólio: um bairro com cinco prédios. Use o menu de atalhos para acessar cada seção.',
    internalNote: 'Projeto interno, sem link público. Prints com dados ocultados.',
    stack: 'Stack',
    live: 'Ver online',
    skipToContent: 'Ir para o conteúdo',
  },
  hero: {
    name: 'Ygor Gomes',
    role: 'Desenvolvedor Front-End · Automações n8n/IA',
    location: 'São Paulo, SP · Remoto',
  },
  sections: {
    sobre: { label: 'Sobre', title: 'Sobre mim', building: 'Casa' },
    projetos: { label: 'Projetos', title: 'Projetos', building: 'Oficina' },
    formacao: { label: 'Formação', title: 'Formação e cursos', building: 'Escola' },
    skills: { label: 'Skills', title: 'Skills', building: 'Loja de ferramentas' },
    contato: { label: 'Contato', title: 'Vamos conversar', building: 'Correio' },
  },
  sobre: {
    paragraphs: [
      'Sou o Ygor, desenvolvedor front-end em São Paulo. Crio sites, landing pages, painéis e automações com n8n e IA, do layout ao deploy.',
      'Sou técnico em TI pelo Senac e bacharel em Comunicação e Jornalismo. Gosto de juntar as duas coisas: interface clara e texto que ajuda a pessoa a decidir.',
      'No dia a dia, cuido de sites e de campanhas de um estúdio de tatuagem, e nas horas livres construo meus próprios apps e automações.',
    ],
    focusTitle: 'No que eu trabalho',
    focus: ['Sites e landing pages de alta conversão', 'Painéis e apps web com React e Astro', 'Automações com n8n, APIs e IA', 'Animações e interface com cuidado de detalhe'],
    status: 'Aberto a vagas remotas e a projetos freelance.',
    trajectoryTitle: 'Trajetória',
    trajectory: [
      {
        role: 'Desenvolvedor front-end e social media',
        org: 'Estúdio de tatuagem · São Paulo',
        period: 'atual',
        text: 'Sites e landing pages, Reels e redes sociais, painéis internos, automações com n8n e suporte de TI.',
      },
      {
        role: 'Assistente de cobrança',
        org: 'GRB Services do Brasil',
        period: 'a partir de nov/2022',
        text: 'Revisão de contratos, negociação de pendências e reuniões de equipe.',
      },
    ],
  },
  projetos: {
    intro: 'Seis projetos que mostram front-end, dados e automação funcionando juntos.',
    items: [
      {
        slug: 'central-ygor',
        name: 'Central Ygor',
        tag: 'App pessoal de gestão · no ar 24h',
        summary:
          'Painel pessoal com finanças, conteúdo, trabalho e vida em módulos, protegido por PIN. Tem um assistente no Telegram com IA ligado a automações em n8n.',
        points: [
          'Astro, React e Tailwind, dados no Supabase e deploy na Vercel',
          'Assistente no Telegram que entende texto e áudio transcrito',
          'IA opcional para categorizar gastos e montar dossiês de pauta',
          'Sidebar recolhível e navegação por grupos com sub-páginas',
        ],
      },
      {
        slug: 'dash-campanhas',
        name: 'Dash de Campanhas',
        tag: 'Painel interno · plataforma de cursos online',
        summary:
          'Painel que junta campanhas de anúncios, cadastros (leads), vendas e a saúde das páginas no ar. Acesso por login, com cargos de administrador e usuário.',
        points: [
          'Investimento, leads e custo por lead das contas da Meta Ads',
          'Central de ações com recomendações do dia e comparação entre períodos',
          'Registros separados por tipo e por projeto, com filtros',
          'Testes automatizados e documentação de deploy',
        ],
      },
      {
        slug: 'original-sp-tattoo',
        name: 'Original SP Tattoo',
        tag: 'Site institucional trilíngue (PT · EN · ES)',
        summary:
          'Site multipágina de um estúdio de tatuagem em São Paulo, com páginas de artistas e unidades e agendamento direto pelo WhatsApp.',
        points: [
          'Vite, Tailwind e JavaScript puro, sem framework',
          'Três idiomas e páginas por unidade',
          'Foco em conversão: chamada para agendar pelo WhatsApp',
          'Especificações de site e design versionadas junto do código',
        ],
      },
      {
        slug: 'conexus',
        name: 'Conexus · Automações n8n',
        tag: 'Agência de automações',
        summary:
          'Fluxos n8n que ligam ferramentas e IA para tirar tarefas repetitivas do dia a dia. Inclui um fluxo de captação e classificação de vagas freelancer.',
        points: [
          'Webhooks, APIs REST e payloads JSON com tratamento de erro e retry',
          'Classificador de vagas freelancer com IA (especificação e workflow)',
          'Automações de WhatsApp e de DM de Instagram para o estúdio',
        ],
      },
      {
        slug: 'rogyfacul',
        name: 'RogyFacul',
        tag: 'Biblioteca de estudo com cara de videogame',
        summary:
          'App de uso pessoal: curso, módulo e material, com progresso, XP e botão Continuar. Mobile first.',
        points: [
          'Astro 7 SSR, Tailwind 4 e Supabase, deploy na Vercel',
          'Importação de cursos por JSON; itens complementares ficam fora do progresso',
          'Testes unitários com Vitest',
          'Segurança por RLS no Supabase, sem chave de serviço no navegador',
        ],
      },
      {
        slug: 'blog',
        name: 'Blog com publicação via API',
        tag: 'Next.js e automação',
        summary:
          'Blog sobre IA e automação prática. Um endpoint próprio recebe o artigo em markdown e faz o commit no repositório; a Vercel publica sozinha.',
        points: [
          'Next.js (App Router), Tailwind e MDX',
          'POST /api/posts, commit via GitHub API e deploy automático',
          'Publica do celular ou de um webhook do n8n',
        ],
      },
    ],
  },
  formacao: {
    educationTitle: 'Formação acadêmica',
    education: [
      { title: 'Técnico em Tecnologia da Informação', org: 'Senac', period: 'fev/2019 – dez/2021' },
      { title: 'Bacharelado em Comunicação e Jornalismo', org: 'Uninove', period: 'jan/2014 – jul/2017' },
    ],
    coursesTitle: 'Cursos e certificações',
    courses: [
      { title: 'Desenvolvimento Full Stack', org: 'Dev Quest · Dev em Dobro', period: 'nov/2022' },
      { title: 'Formação Extra em Administração', org: 'Fundação Bradesco', period: 'mar–abr/2022' },
      { title: 'Formação Extra em Atendimento ao Público', org: 'Fundação Bradesco', period: 'mar/2022' },
    ],
    earlyTitle: 'Primeiros projetos',
    earlyIntro: 'Onde tudo começou, no curso Dev Quest e em um workshop. Seguem no ar.',
    early: [
      { name: 'API GitHub', desc: 'Consome a API do GitHub e mostra os dados do perfil pesquisado.', stack: 'HTML · CSS · JavaScript', url: 'https://ygos-96.github.io/api-github/' },
      { name: 'Landing page Agência XYZ', desc: 'Landing page de uma agência fictícia.', stack: 'HTML · CSS', url: 'https://ygos-96.github.io/agencia-xyz/' },
      { name: 'Listagem Pokémon', desc: 'Cards com informações de cada Pokémon.', stack: 'HTML · CSS · JavaScript', url: 'https://ygos-96.github.io/listagem-pokemon/' },
      { name: 'Jogo do Mario', desc: 'Jogo simples feito em um workshop de tecnologia.', stack: 'HTML · CSS · JavaScript', url: 'https://ygos-96.github.io/jogo-do-mario/' },
    ],
  },
  skills: {
    groups: [
      { title: 'Front-end', items: ['HTML', 'CSS', 'JavaScript', 'React', 'Astro', 'Tailwind CSS', 'Vite', 'GSAP'] },
      { title: 'Automação e IA', items: ['n8n', 'Webhooks', 'APIs REST', 'JSON', 'LLMs e prompts', 'Bots de Telegram'] },
      { title: 'Dados e deploy', items: ['Supabase', 'MySQL', 'Git e GitHub', 'Vercel', 'Cloudflare'] },
      { title: 'Qualidade', items: ['Jest', 'Vitest', 'Mobile first', 'Responsivo'] },
      { title: 'Em evolução', items: ['Node.js e back-end', 'JavaScript avançado', 'Inglês técnico'] },
    ],
    softTitle: 'Além do código',
    soft: ['Comunicação', 'Trabalho em equipe', 'Adaptação rápida', 'Aprendizado constante'],
    langsTitle: 'Idiomas',
    langs: ['Português (nativo)', 'Inglês (intermediário)'],
  },
  contato: {
    intro: 'Tem uma vaga remota ou um projeto em mente? Me chame por onde for mais fácil.',
    channels: [
      { key: 'linkedin', label: 'LinkedIn', value: 'in/ygor-gs2006' },
      { key: 'github', label: 'GitHub', value: 'ygos-96' },
      { key: 'email', label: 'E-mail', value: 'ygs.contato@gmail.com' },
      { key: 'whatsapp', label: 'WhatsApp', value: '(11) 96180-2437' },
    ],
    cvTitle: 'Currículo',
    cvText: 'Versão atualizada, com os projetos acima.',
  },
}

const en = {
  lang: 'en',
  htmlLang: 'en',
  ogLocale: 'en_US',
  meta: {
    title: 'Ygor Gomes | Front-End Developer · React, Astro & n8n Automation',
    description:
      'Interactive portfolio of Ygor Gomes, a front-end developer based in São Paulo, Brazil. Websites, dashboards and automations with n8n and AI. Explore the map or open the quick view.',
  },
  ui: {
    start: 'Start',
    introHint: 'Walk around the neighborhood and enter the buildings to see my work.',
    keys: 'WASD or arrows to move · E to enter · Esc to close',
    touch: 'Drag the joystick to move · tap Enter',
    enter: 'Enter',
    enterIn: 'Enter',
    close: 'Close',
    fast: 'Quick view',
    fastHint: 'Prefer everything at once? Open the text version.',
    backToMap: 'Back to the map',
    langOther: 'PT',
    langOtherLabel: 'Mudar para português',
    cvLabel: 'Download résumé (PDF)',
    shortcuts: 'Shortcuts',
    mapLabel: 'Interactive portfolio map: a neighborhood with five buildings. Use the shortcuts menu to reach each section.',
    internalNote: 'Internal project, no public link. Screenshots with data hidden.',
    stack: 'Stack',
    live: 'View live',
    skipToContent: 'Skip to content',
  },
  hero: {
    name: 'Ygor Gomes',
    role: 'Front-End Developer · n8n & AI Automation',
    location: 'São Paulo, Brazil · Remote',
  },
  sections: {
    sobre: { label: 'About', title: 'About me', building: 'House' },
    projetos: { label: 'Projects', title: 'Projects', building: 'Workshop' },
    formacao: { label: 'Education', title: 'Education and courses', building: 'School' },
    skills: { label: 'Skills', title: 'Skills', building: 'Tool shop' },
    contato: { label: 'Contact', title: "Let's talk", building: 'Post office' },
  },
  sobre: {
    paragraphs: [
      "I'm Ygor, a front-end developer in São Paulo. I build websites, landing pages, dashboards and automations with n8n and AI, from layout to deploy.",
      'I hold a technical degree in IT from Senac and a bachelor’s in Communication and Journalism. I like to combine both: clear interfaces and copy that helps people decide.',
      'Day to day I run the websites and campaigns of a tattoo studio, and in my spare time I build my own apps and automations.',
    ],
    focusTitle: 'What I work on',
    focus: ['High-converting websites and landing pages', 'Web apps and dashboards with React and Astro', 'Automations with n8n, APIs and AI', 'Animation and interfaces with attention to detail'],
    status: 'Open to remote roles and freelance projects.',
    trajectoryTitle: 'Background',
    trajectory: [
      {
        role: 'Front-end developer and social media',
        org: 'Tattoo studio · São Paulo',
        period: 'current',
        text: 'Websites and landing pages, Reels and social media, internal dashboards, n8n automations and IT support.',
      },
      {
        role: 'Collections assistant',
        org: 'GRB Services do Brasil',
        period: 'since Nov 2022',
        text: 'Contract review, negotiation of overdue items and team meetings.',
      },
    ],
  },
  projetos: {
    intro: 'Six projects showing front-end, data and automation working together.',
    items: [
      {
        slug: 'central-ygor',
        name: 'Central Ygor',
        tag: 'Personal management app · live 24/7',
        summary:
          'A personal dashboard with finance, content, work and life modules, protected by a PIN. It includes a Telegram assistant with AI connected to n8n automations.',
        points: [
          'Astro, React and Tailwind, data on Supabase, deployed on Vercel',
          'Telegram assistant that understands text and transcribed audio',
          'Optional AI to categorize expenses and draft topic briefs',
          'Collapsible sidebar and grouped navigation with sub-pages',
        ],
      },
      {
        slug: 'dash-campanhas',
        name: 'Campaign Dashboard',
        tag: 'Internal tool · online course platform',
        summary:
          'A dashboard that brings together ad campaigns, sign-ups (leads), sales and the health of live pages. Login with administrator and user roles.',
        points: [
          'Spend, leads and cost per lead from Meta Ads accounts',
          'Action center with daily recommendations and period comparison',
          'Records split by type and project, with filters',
          'Automated tests and deployment docs',
        ],
      },
      {
        slug: 'original-sp-tattoo',
        name: 'Original SP Tattoo',
        tag: 'Trilingual corporate site (PT · EN · ES)',
        summary:
          'A multi-page website for a tattoo studio in São Paulo, with artist and location pages and booking straight through WhatsApp.',
        points: [
          'Vite, Tailwind and plain JavaScript, no framework',
          'Three languages and one page per location',
          'Conversion focus: booking call-to-action via WhatsApp',
          'Site and design specs versioned alongside the code',
        ],
      },
      {
        slug: 'conexus',
        name: 'Conexus · n8n Automation',
        tag: 'Automation agency',
        summary:
          'n8n workflows that connect tools and AI to remove repetitive tasks. Includes a workflow that collects and classifies freelance job posts.',
        points: [
          'Webhooks, REST APIs and JSON payloads with error handling and retries',
          'AI-based freelance job classifier (spec and workflow)',
          'WhatsApp and Instagram DM automations for the studio',
        ],
      },
      {
        slug: 'rogyfacul',
        name: 'RogyFacul',
        tag: 'A study library with a video-game feel',
        summary:
          'A personal app: course, module and material, with progress, XP and a Continue button. Mobile first.',
        points: [
          'Astro 7 SSR, Tailwind 4 and Supabase, deployed on Vercel',
          'Course import via JSON; optional items stay out of the progress bar',
          'Unit tests with Vitest',
          'Security through Supabase RLS, no service key in the browser',
        ],
      },
      {
        slug: 'blog',
        name: 'Blog with API publishing',
        tag: 'Next.js and automation',
        summary:
          'A blog about practical AI and automation. A custom endpoint receives the article in markdown and commits it to the repo; Vercel publishes on its own.',
        points: [
          'Next.js (App Router), Tailwind and MDX',
          'POST /api/posts, commit via GitHub API and automatic deploy',
          'Publish from a phone or from an n8n webhook',
        ],
      },
    ],
  },
  formacao: {
    educationTitle: 'Education',
    education: [
      { title: 'Technical degree in Information Technology', org: 'Senac', period: 'Feb 2019 – Dec 2021' },
      { title: "Bachelor's in Communication and Journalism", org: 'Uninove', period: 'Jan 2014 – Jul 2017' },
    ],
    coursesTitle: 'Courses and certificates',
    courses: [
      { title: 'Full Stack Development', org: 'Dev Quest · Dev em Dobro', period: 'Nov 2022' },
      { title: 'Extra Training in Administration', org: 'Fundação Bradesco', period: 'Mar–Apr 2022' },
      { title: 'Extra Training in Customer Service', org: 'Fundação Bradesco', period: 'Mar 2022' },
    ],
    earlyTitle: 'First projects',
    earlyIntro: 'Where it all started, from the Dev Quest course and a workshop. Still online.',
    early: [
      { name: 'GitHub API', desc: 'Calls the GitHub API and shows the searched profile data.', stack: 'HTML · CSS · JavaScript', url: 'https://ygos-96.github.io/api-github/' },
      { name: 'XYZ Agency landing page', desc: 'Landing page for a fictional agency.', stack: 'HTML · CSS', url: 'https://ygos-96.github.io/agencia-xyz/' },
      { name: 'Pokémon list', desc: 'Cards with information about each Pokémon.', stack: 'HTML · CSS · JavaScript', url: 'https://ygos-96.github.io/listagem-pokemon/' },
      { name: 'Mario game', desc: 'A simple game built in a tech workshop.', stack: 'HTML · CSS · JavaScript', url: 'https://ygos-96.github.io/jogo-do-mario/' },
    ],
  },
  skills: {
    groups: [
      { title: 'Front-end', items: ['HTML', 'CSS', 'JavaScript', 'React', 'Astro', 'Tailwind CSS', 'Vite', 'GSAP'] },
      { title: 'Automation and AI', items: ['n8n', 'Webhooks', 'REST APIs', 'JSON', 'LLMs and prompting', 'Telegram bots'] },
      { title: 'Data and deploy', items: ['Supabase', 'MySQL', 'Git and GitHub', 'Vercel', 'Cloudflare'] },
      { title: 'Quality', items: ['Jest', 'Vitest', 'Mobile first', 'Responsive design'] },
      { title: 'Growing', items: ['Node.js and back-end', 'Advanced JavaScript', 'Technical English'] },
    ],
    softTitle: 'Beyond code',
    soft: ['Communication', 'Teamwork', 'Quick adaptation', 'Continuous learning'],
    langsTitle: 'Languages',
    langs: ['Portuguese (native)', 'English (intermediate)'],
  },
  contato: {
    intro: 'Have a remote role or a project in mind? Reach me wherever is easiest.',
    channels: [
      { key: 'linkedin', label: 'LinkedIn', value: 'in/ygor-gs2006' },
      { key: 'github', label: 'GitHub', value: 'ygos-96' },
      { key: 'email', label: 'Email', value: 'ygs.contato@gmail.com' },
      { key: 'whatsapp', label: 'WhatsApp', value: '+55 11 96180-2437' },
    ],
    cvTitle: 'Résumé',
    cvText: 'Updated version, with the projects above.',
  },
}

export const CONTENT = { pt, en }
export const LANGS = ['pt', 'en']
