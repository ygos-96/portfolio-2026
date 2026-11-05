"""Gera os currículos em PDF (PT e EN) em public/. Uso: python3 scripts/make-cv.py [url-do-portfolio]"""
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, KeepTogether

SITE = sys.argv[1] if len(sys.argv) > 1 else "https://ygor-portfolio.vercel.app"
INK, SOFT, ACC = HexColor("#2d2a32"), HexColor("#5a5560"), HexColor("#c8553d")

st = {
    "name": ParagraphStyle("name", fontName="Helvetica-Bold", fontSize=22, leading=26, textColor=INK),
    "role": ParagraphStyle("role", fontName="Helvetica-Bold", fontSize=11.5, leading=15, textColor=HexColor("#3a5fa3")),
    "contact": ParagraphStyle("contact", fontName="Helvetica", fontSize=9, leading=13, textColor=SOFT),
    "h": ParagraphStyle("h", fontName="Helvetica-Bold", fontSize=10.5, leading=14, textColor=ACC, spaceBefore=9, spaceAfter=2),
    "b": ParagraphStyle("b", fontName="Helvetica", fontSize=9.3, leading=13, textColor=INK),
    "it": ParagraphStyle("it", fontName="Helvetica-Bold", fontSize=9.6, leading=13, textColor=INK, spaceBefore=4),
    "meta": ParagraphStyle("meta", fontName="Helvetica", fontSize=8.6, leading=12, textColor=SOFT),
    "li": ParagraphStyle("li", fontName="Helvetica", fontSize=9.2, leading=12.6, textColor=INK, leftIndent=10, bulletIndent=0),
}

def link(url, text=None):
    return f'<a href="{url}" color="#3a5fa3">{text or url}</a>'

DATA = {
    "pt": {
        "file": "Ygor-Gomes-Curriculo.pdf",
        "title": "Ygor Gomes - Currículo",
        "role": "Desenvolvedor Front-End | React · Astro · Automações n8n/IA",
        "loc": "São Paulo, SP · Remoto",
        "summary_h": "Resumo",
        "summary": "Desenvolvedor front-end em São Paulo. Crio sites, landing pages, painéis e automações com n8n e IA, do layout ao deploy. Técnico em TI pelo Senac e bacharel em Comunicação e Jornalismo: junto interface clara com texto que ajuda a pessoa a decidir. Aberto a vagas remotas e projetos freelance.",
        "skills_h": "Competências",
        "skills": [
            ("Front-end", "HTML, CSS, JavaScript, React, Astro, Tailwind CSS, Vite, GSAP"),
            ("Automação e IA", "n8n, webhooks, APIs REST, JSON, LLMs e prompts, bots de Telegram"),
            ("Dados e deploy", "Supabase, MySQL, Git e GitHub, Vercel, Cloudflare"),
            ("Qualidade", "Jest, Vitest, mobile first, design responsivo"),
        ],
        "exp_h": "Experiência",
        "exp": [
            ("Desenvolvedor front-end e social media", "Estúdio de tatuagem · São Paulo · atual",
             ["Sites e landing pages, incluindo site institucional trilíngue (PT/EN/ES) com agendamento via WhatsApp.",
              "Reels e redes sociais do estúdio; painéis internos e automações com n8n (WhatsApp, DM de Instagram).",
              "Suporte de TI e rede da empresa."]),
            ("Assistente de cobrança", "GRB Services do Brasil · a partir de nov/2022",
             ["Revisão de contratos, negociação de pendências e reuniões de equipe."]),
        ],
        "proj_h": "Projetos",
        "proj": [
            ("Central Ygor", "Astro, React, Tailwind, Supabase, n8n, Vercel",
             "App pessoal de gestão no ar 24h, com PIN e assistente no Telegram (texto e áudio) ligado a automações em n8n e IA."),
            ("Dash de Campanhas", "React 19, Vite, Tailwind 4, Node.js",
             "Painel interno de uma plataforma de cursos: Meta Ads, leads, vendas e saúde das páginas, com login por cargos e testes automatizados."),
            ("Original SP Tattoo", "Vite, Tailwind, JavaScript",
             "Site multipágina trilíngue de estúdio de tatuagem, focado em conversão via WhatsApp."),
            ("Conexus · Automações n8n", "n8n, webhooks, REST, JSON, LLMs",
             "Fluxos com tratamento de erro e retry; classificador de vagas freelancer com IA."),
            ("RogyFacul", "Astro 7 SSR, Tailwind 4, Supabase, Vitest",
             "Biblioteca de estudo com progresso e XP, mobile first, segurança por RLS."),
            ("Blog com publicação via API", "Next.js, Tailwind, MDX, GitHub API",
             "Endpoint que recebe markdown, faz commit no repositório e dispara o deploy."),
        ],
        "edu_h": "Formação e cursos",
        "edu": [
            "Senac · Técnico em Tecnologia da Informação · fev/2019 - dez/2021",
            "Uninove · Bacharelado em Comunicação e Jornalismo · jan/2014 - jul/2017",
            "Dev Quest · Dev em Dobro · Desenvolvimento Full Stack · nov/2022",
            "Fundação Bradesco · Formação Extra em Administração (mar-abr/2022) e em Atendimento ao Público (mar/2022)",
        ],
        "lang_h": "Idiomas",
        "lang": "Português (nativo) · Inglês (intermediário)",
        "port": "Portfólio",
    },
    "en": {
        "file": "Ygor-Gomes-Resume-EN.pdf",
        "title": "Ygor Gomes - Resume",
        "role": "Front-End Developer | React · Astro · n8n & AI Automation",
        "loc": "São Paulo, Brazil · Remote",
        "summary_h": "Summary",
        "summary": "Front-end developer based in São Paulo, Brazil. I build websites, landing pages, dashboards and automations with n8n and AI, from layout to deploy. Technical degree in IT (Senac) and a bachelor's in Communication and Journalism: I combine clear interfaces with copy that helps people decide. Open to remote roles and freelance projects.",
        "skills_h": "Skills",
        "skills": [
            ("Front-end", "HTML, CSS, JavaScript, React, Astro, Tailwind CSS, Vite, GSAP"),
            ("Automation and AI", "n8n, webhooks, REST APIs, JSON, LLMs and prompting, Telegram bots"),
            ("Data and deploy", "Supabase, MySQL, Git and GitHub, Vercel, Cloudflare"),
            ("Quality", "Jest, Vitest, mobile first, responsive design"),
        ],
        "exp_h": "Experience",
        "exp": [
            ("Front-end developer and social media", "Tattoo studio · São Paulo · current",
             ["Websites and landing pages, including a trilingual (PT/EN/ES) corporate site with booking via WhatsApp.",
              "Studio Reels and social media; internal dashboards and n8n automations (WhatsApp, Instagram DMs).",
              "Company IT and network support."]),
            ("Collections assistant", "GRB Services do Brasil · since Nov 2022",
             ["Contract review, negotiation of overdue items and team meetings."]),
        ],
        "proj_h": "Projects",
        "proj": [
            ("Central Ygor", "Astro, React, Tailwind, Supabase, n8n, Vercel",
             "Personal management app live 24/7, with PIN and a Telegram assistant (text and audio) connected to n8n and AI automations."),
            ("Campaign Dashboard", "React 19, Vite, Tailwind 4, Node.js",
             "Internal tool for an online course platform: Meta Ads, leads, sales and page health, with role-based login and automated tests."),
            ("Original SP Tattoo", "Vite, Tailwind, JavaScript",
             "Trilingual multi-page website for a tattoo studio, focused on conversion via WhatsApp."),
            ("Conexus · n8n Automation", "n8n, webhooks, REST, JSON, LLMs",
             "Workflows with error handling and retries; AI-based freelance job classifier."),
            ("RogyFacul", "Astro 7 SSR, Tailwind 4, Supabase, Vitest",
             "Study library with progress and XP, mobile first, security through RLS."),
            ("Blog with API publishing", "Next.js, Tailwind, MDX, GitHub API",
             "Endpoint that receives markdown, commits to the repo and triggers the deploy."),
        ],
        "edu_h": "Education and courses",
        "edu": [
            "Senac · Technical degree in Information Technology · Feb 2019 - Dec 2021",
            "Uninove · Bachelor's in Communication and Journalism · Jan 2014 - Jul 2017",
            "Dev Quest · Dev em Dobro · Full Stack Development · Nov 2022",
            "Fundação Bradesco · Extra Training in Administration (Mar-Apr 2022) and in Customer Service (Mar 2022)",
        ],
        "lang_h": "Languages",
        "lang": "Portuguese (native) · English (intermediate)",
        "port": "Portfolio",
    },
}

def build(lang):
    d = DATA[lang]
    doc = SimpleDocTemplate(f"public/{d['file']}", pagesize=A4, leftMargin=18*mm, rightMargin=18*mm, topMargin=15*mm, bottomMargin=14*mm,
                            title=d["title"], author="Ygor Gomes")
    f = []
    f += [Paragraph("Ygor Gomes", st["name"]), Paragraph(d["role"], st["role"])]
    f.append(Paragraph(
        f'{d["loc"]} · (11) 96180-2437 · {link("mailto:ygs.contato@gmail.com", "ygs.contato@gmail.com")}<br/>'
        f'{link("https://www.linkedin.com/in/ygor-gs2006/", "linkedin.com/in/ygor-gs2006")} · '
        f'{link("https://github.com/ygos-96", "github.com/ygos-96")} · {d["port"]}: {link(SITE, SITE.replace("https://", ""))}', st["contact"]))
    f.append(Spacer(1, 3))
    f.append(HRFlowable(width="100%", thickness=1, color=ACC, spaceBefore=2, spaceAfter=0))

    def head(t):
        f.append(Paragraph(t.upper(), st["h"]))
    head(d["summary_h"]); f.append(Paragraph(d["summary"], st["b"]))
    head(d["skills_h"])
    for k, v in d["skills"]:
        f.append(Paragraph(f"<b>{k}:</b> {v}", st["b"]))
    head(d["exp_h"])
    for role, meta, pts in d["exp"]:
        block = [Paragraph(role, st["it"]), Paragraph(meta, st["meta"])]
        block += [Paragraph(p, st["li"], bulletText="•") for p in pts]
        f.append(KeepTogether(block))
    head(d["proj_h"])
    for name, stack, txt in d["proj"]:
        f.append(KeepTogether([Paragraph(f"<b>{name}</b> <font color='#5a5560'>· {stack}</font>", st["it"]), Paragraph(txt, st["li"])]))
    head(d["edu_h"])
    for e in d["edu"]:
        f.append(Paragraph(e, st["li"], bulletText="•"))
    head(d["lang_h"]); f.append(Paragraph(d["lang"], st["b"]))
    doc.build(f)
    print("ok", d["file"])

for l in ("pt", "en"):
    build(l)
