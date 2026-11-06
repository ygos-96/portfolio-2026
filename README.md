# Portfólio · Ygor Gomes

Portfólio interativo: um bairro visto de cima, onde o personagem anda (WASD/setas no desktop, joystick no celular) e entra em nove locais clicáveis. Os cinco prédios de trabalho (Sobre, Projetos, Formação, Skills e Contato) ficam no centro e o bairro de lazer, a leste, tem o Estádio (Palmeiras), o Palco (playlists do Spotify), o Cinema e a Biblioteca. A tecla de ação é o **Enter**. Existe também um **modo rápido** em HTML estático (`/rapido/` e `/en/rapido/`) para recrutadores sem pressa de jogar, leitores de tela e SEO.

- Site: https://ygor-portfolio.vercel.app
- Stack: Vite + JavaScript puro + Canvas 2D. Todo o pixel art é desenhado em código, sem imagens.
- Idiomas: PT-BR e EN (botão no canto superior direito, ou `?lang=en`).
- Links diretos: `/#projetos`, `/#contato` etc. abrem o painel correspondente.

## Rodar

```bash
npm install
npm run dev       # gera o modo rápido e sobe o Vite
npm run build     # saída em dist/
```

## Onde editar

| O quê | Onde |
|---|---|
| Todos os textos (PT e EN), links e contatos | `src/content.js` |
| Adicionar print de um projeto | salve em `public/shots/<slug>.png` e troque `shot: null` por `shot: '/shots/<slug>.png'` em `PROJECT_BASE` |
| Adicionar filmes, livros, playlists, ídolos e taças | listas `MOVIE_GROUPS`, `BOOKS`, `SPOTIFY`, `IDOLS` e `TROPHIES` em `src/content.js` |
| Pôster de um filme | salve em `public/posters/<slug>.jpg` (ainda não ligado: hoje os filmes usam cartões coloridos) |
| Layout do mapa e posição dos prédios (`LANDMARKS` = bairro de lazer) | `src/world.js` |
| Movimento, câmera, colisão e modelos 3D dos prédios | `src/game3d.js` |
| Painéis, atalhos, idioma | `src/main.js` e `src/render.js` |
| Visual (cores, painéis) | `src/style.css` |

Prints de projetos internos devem ter dados sensíveis ocultados antes de entrar no repositório.

## Currículo em PDF

`python3 scripts/make-cv.py https://ygor-portfolio.vercel.app` (precisa de `reportlab`) gera `public/Ygor-Gomes-Curriculo.pdf` e `public/Ygor-Gomes-Resume-EN.pdf`. Edite o texto no próprio script.

## Acessibilidade

Atalhos em botões reais no topo, painéis com `role="dialog"`, foco preso e `Esc` para fechar, `prefers-reduced-motion` respeitado e conteúdo completo no modo rápido.
