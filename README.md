# Portfólio · Ygor Gomes

Portfólio interativo: um bairro visto de cima, onde o personagem anda (WASD/setas no desktop, joystick no celular) e entra em cinco prédios clicáveis: Sobre, Projetos, Formação, Skills e Contato. Existe também um **modo rápido** em HTML estático (`/rapido/` e `/en/rapido/`) para recrutadores sem pressa de jogar, leitores de tela e SEO.

- Site: https://ygor-portfolio-sigma.vercel.app
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
| Layout do mapa, cores, sprites | `src/world.js` |
| Movimento, câmera, colisão | `src/game.js` |
| Painéis, atalhos, idioma | `src/main.js` e `src/render.js` |
| Visual (cores, painéis) | `src/style.css` |

Prints de projetos internos devem ter dados sensíveis ocultados antes de entrar no repositório.

## Currículo em PDF

`python3 scripts/make-cv.py https://ygor-portfolio-sigma.vercel.app` (precisa de `reportlab`) gera `public/Ygor-Gomes-Curriculo.pdf` e `public/Ygor-Gomes-Resume-EN.pdf`. Edite o texto no próprio script.

## Acessibilidade

Atalhos em botões reais no topo, painéis com `role="dialog"`, foco preso e `Esc` para fechar, `prefers-reduced-motion` respeitado e conteúdo completo no modo rápido.
