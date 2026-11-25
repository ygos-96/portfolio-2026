# Portfólio · Ygor Gomes

Portfólio de Ygor Gomes, desenvolvedor em transição para segurança de aplicações (AppSec). Reúne os projetos de segurança (webhook seguro, pipeline DevSecOps e laboratório OWASP Top 10) em um mapa interativo em 3D.

Portfólio interativo em 3D: um bairro visto de cima onde o personagem anda (WASD/setas no desktop, joystick no celular) e entra em prédios clicáveis, cada um com sala interna própria. Os cinco prédios de trabalho (Sobre, Projetos, Formação, Skills e Contato) ficam no centro. O bairro de lazer, a leste, tem o Estádio (Palmeiras), o Palco (playlists do Spotify), o Cinema e a Biblioteca, além da Casa, com os gostos pessoais. A tecla de ação é o **Enter**.

Para quem tem pressa, leitores de tela e buscadores existe o **modo rápido**, uma versão em HTML estático com o mesmo conteúdo (`/rapido/` e `/en/rapido/`).

- Site: https://ygor-portfolio-sigma.vercel.app
- Stack: Vite, JavaScript puro e Three.js. Sem framework de UI. Os efeitos sonoros são gerados em código (Web Audio), sem arquivos de áudio.
- Idiomas: PT-BR e EN (botão no canto superior direito, ou `?lang=en`).
- Links diretos: `/#projetos`, `/#contato` etc. abrem o painel correspondente.

## O que tem

| Parte | Detalhe |
|---|---|
| Mapa e prédios 3D | câmera, colisão e modelos em `src/game3d.js`; salas internas em `src/interiors.js` e `src/roomart.js` |
| Projetos | 5 projetos em destaque com stack, prints, documentação interna e links (código no GitHub ou site no ar) |
| Clima real | `src/weather.js` consulta a Open-Meteo e muda o tempo no mapa |
| Próximos jogos do Palmeiras | função serverless `api/jogos.js` (ESPN, sem chave, cache de 6 h na CDN) |
| Cinema e Biblioteca | listas de filmes por tema (cultura pop com Star Wars e todo o MCU, terror, comédia, suspense, ação e aventura) com pôsteres do TMDB, e livros |
| Ídolos e taças | cartões 3D em `src/idols3d.js` |
| Currículo | PDFs em PT e EN, gerados por `scripts/make-cv.py` |
| Fotos reais | em `public/photos`, com licença e autoria em `public/photos/credits.json` e na página `/creditos/` |

## Rodar

```bash
npm install
npm run dev       # gera o modo rápido e sobe o Vite
npm run build     # saída em dist/
```

`npm run static` gera `rapido/`, `en/rapido/`, `public/sitemap.xml` e `public/robots.txt` a partir de `src/content.js`. Esses arquivos **não ficam no git**: o `dev` e o `build` recriam sempre, então o texto do modo rápido nunca fica desatualizado em relação ao site.

## Onde editar

| O quê | Onde |
|---|---|
| Todos os textos (PT e EN), links e contatos | `src/content.js` |
| Adicionar print de um projeto | salve em `public/shots/<slug>.png` e use `shot: '/shots/<slug>.png'` em `PROJECT_BASE` |
| Link de um projeto | `repo` (código) e/ou `live` (site no ar) em `PROJECT_BASE` |
| Filmes, livros, playlists, ídolos e taças | listas `MOVIE_GROUPS`, `BOOKS`, `SPOTIFY`, `IDOLS` e `TROPHIES` em `src/content.js` |
| Layout do mapa e posição dos prédios | `src/world.js` |
| Painéis, atalhos, idioma | `src/main.js` e `src/render.js` |
| Visual (cores, painéis) | `src/style.css` |

Prints de projetos internos devem ter dados sensíveis ocultados antes de entrar no repositório.

## Pôsteres dos filmes

Os pôsteres vêm do TMDB e não ficam no repositório: `src/posters.js` guarda só o caminho de cada imagem e o site carrega do CDN do TMDB. Sem pôster, o filme aparece como cartão colorido.

```bash
TMDB_API_KEY=suachave npm run posters
```

A chave v3 é grátis em themoviedb.org (Configurações > API). Rode de novo ao adicionar filmes. O painel do Cinema mostra o crédito exigido pelo TMDB.

## Currículo em PDF

```bash
python3 scripts/make-cv.py https://ygor-portfolio-sigma.vercel.app
```

Precisa de `reportlab` (`pip install reportlab`). Gera `public/Ygor-Gomes-Curriculo.pdf` e `public/Ygor-Gomes-Resume-EN.pdf`. O texto dos currículos fica em `DATA`, dentro do próprio script.

## Segurança e qualidade

O repositório tem um pipeline de segurança em `.github/workflows/security.yml`, que roda a cada push, em PRs e toda segunda-feira:

- **gitleaks** procura segredos, inclusive no histórico (`.gitleaks.toml`)
- **npm audit** e **Trivy** verificam dependências e configuração
- **Semgrep** com regra local contra `innerHTML` sem escape (`.semgrep/regras-locais.yml`)
- **Dependabot** atualiza npm e as próprias actions, com espera de 7 dias para versões novas
- Actions fixadas por SHA e token do workflow somente leitura
- Cabeçalhos de segurança na Vercel (`vercel.json`): HSTS, `X-Frame-Options`, `nosniff`, Referrer-Policy e uma CSP em modo de relatório

O workflow `build.yml` roda `npm ci` e `npm run build` em cada push e PR.

## Acessibilidade

Atalhos em botões reais no topo, painéis com `role="dialog"`, foco preso e `Esc` para fechar, `prefers-reduced-motion` respeitado, alvos de toque de pelo menos 42 px no celular e conteúdo completo no modo rápido.

## Licença

MIT. Veja [LICENSE](LICENSE). As fotos em `public/photos` seguem as licenças indicadas em `credits.json`.
