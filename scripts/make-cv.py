"""Gera os currículos em PDF (PT e EN) em public/. Uso: python3 scripts/make-cv.py [url-do-portfolio]
Requer reportlab (pip install reportlab). O texto dos currículos fica em DATA, logo abaixo."""
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, KeepTogether

SITE = sys.argv[1] if len(sys.argv) > 1 else "https://ygor-portfolio-sigma.vercel.app"
INK, SOFT, ACC = HexColor("#1f2430"), HexColor("#555b66"), HexColor("#1f3a5f")

st = {
    "name": ParagraphStyle("name", fontName="Helvetica-Bold", fontSize=22, leading=26, textColor=INK),
    "role": ParagraphStyle("role", fontName="Helvetica-Bold", fontSize=10.5, leading=14, textColor=ACC),
    "contact": ParagraphStyle("contact", fontName="Helvetica", fontSize=9, leading=13, textColor=SOFT),
    "h": ParagraphStyle("h", fontName="Helvetica-Bold", fontSize=10.5, leading=14, textColor=ACC, spaceBefore=9, spaceAfter=2),
    "b": ParagraphStyle("b", fontName="Helvetica", fontSize=9.3, leading=13, textColor=INK),
    "it": ParagraphStyle("it", fontName="Helvetica-Bold", fontSize=9.6, leading=13, textColor=INK, spaceBefore=4),
    "meta": ParagraphStyle("meta", fontName="Helvetica", fontSize=8.8, leading=12, textColor=SOFT),
    "li": ParagraphStyle("li", fontName="Helvetica", fontSize=9.2, leading=12.6, textColor=INK, leftIndent=10, bulletIndent=0),
}


def link(url, text=None):
    return f'<a href="{url}" color="#1f3a5f">{text or url}</a>'


GH = "github.com/ygos-96"

DATA = {
    "pt": {
        "file": "Ygor-Gomes-Curriculo.pdf",
        "title": "Ygor Gomes - Currículo",
        "role": "Segurança de Aplicações (AppSec) | Desenvolvedor Front-End | Automação n8n e IA",
        "loc": "São Paulo - SP",
        "summary_h": "Resumo profissional",
        "summary": "Desenvolvedor em transição para segurança de aplicações (AppSec). Publica projetos de segurança no GitHub: webhook assinado com HMAC-SHA256, com proteção contra replay e idempotência; pipeline DevSecOps no GitHub Actions (gitleaks, Semgrep, Trivy, npm audit e Dependabot); e laboratório de falhas do OWASP Top 10, com correção e testes automatizados. Desenvolvedor Front-End com experiência CLT desde maio de 2024: sites e landing pages responsivos e automações com agentes de IA no n8n em ambiente de produção, integrando sistemas via APIs REST, webhooks e JSON, com monitoramento e tratamento de erros. Automatizou a liberação de acesso a cursos por e-mail e WhatsApp para mais de 1.000 alunos.",
        "skills_h": "Competências",
        "skills": [
            ("Segurança de aplicações", "OWASP Top 10 (SQL injection, XSS, IDOR, falhas de autenticação, mass assignment), validação de webhooks (HMAC-SHA256, anti-replay, idempotência), DevSecOps (GitHub Actions, gitleaks, Semgrep, Trivy, npm audit, Dependabot), headers de segurança e CSP"),
            ("Automação e integrações", "n8n, automação de processos, low-code, APIs REST, webhooks, JSON, automação de WhatsApp e e-mail, relatórios e planilhas, monitoramento e tratamento de erros"),
            ("Inteligência artificial", "Agentes de IA no n8n, automações com IA, IA generativa"),
            ("Front-end", "HTML5, CSS3, JavaScript, React, Tailwind CSS, layout responsivo, landing pages"),
            ("Ferramentas", "Node.js, Git, GitHub, GitHub Actions, MySQL, Jest"),
            ("Comportamentais", "Comunicação, trabalho em equipe, negociação, adaptação rápida, aprendizado contínuo"),
        ],
        "exp_h": "Experiência profissional",
        "exp": [
            ("Desenvolvedor Front-End", "Original SP Tattoo · mai/2024 - atual",
             ["Desenvolvo sites e landing pages com HTML5, CSS3, JavaScript e Tailwind CSS, com layout responsivo para desktop e dispositivos móveis.",
              "Crio e mantenho automações de processos em n8n em produção, integrando sistemas via APIs REST, webhooks e JSON para eliminar tarefas manuais.",
              "Desenvolvo agentes de IA no n8n integrados aos fluxos de automação.",
              "Monitoro os fluxos em produção e realizo o tratamento de erros, garantindo a continuidade das automações.",
              "Implementei automações de WhatsApp, agilizando a comunicação e reduzindo o trabalho operacional.",
              "Automatizei a geração de relatórios e planilhas, dando mais agilidade ao acompanhamento das informações.",
              "Automatizei a liberação de acesso a cursos após a compra, com envio por e-mail e WhatsApp, atendendo mais de 1.000 alunos sem intervenção manual.",
              "Utilizo ferramentas de IA generativa para acelerar o desenvolvimento de código e de fluxos de automação."]),
            ("Assistente de Cobrança", "GRB Services do Brasil · nov/2022 - out/2023",
             ["Revisei contratos para apoiar o processo de cobrança.",
              "Negociei pendências, buscando soluções de acordo para cada caso.",
              "Contribuí em reuniões de equipe para alinhamento de prioridades."]),
        ],
        "proj_h": "Projetos",
        "proj": [
            ("Webhook seguro em n8n", "n8n, Node.js, HMAC-SHA256",
             f"Valida assinatura, janela de tempo contra replay e eventos duplicados; simulador com 7 cenários de ataque. {link('https://github.com/ygos-96/webhook-seguro-n8n', GH + '/webhook-seguro-n8n')}"),
            ("Pipeline DevSecOps", "GitHub Actions, gitleaks, Semgrep, Trivy",
             f"Busca de segredos, dependências e falhas de código a cada push e semanalmente, aplicada ao próprio portfólio. {link('https://github.com/ygos-96/devsecops-pipeline', GH + '/devsecops-pipeline')}"),
            ("Laboratório de AppSec", "Node.js, OWASP Top 10",
             f"API com 5 falhas, versão corrigida e exploits, com teste automatizado do antes e depois. {link('https://github.com/ygos-96/appsec-lab-vulneravel', GH + '/appsec-lab-vulneravel')}"),
            ("Portfólio interativo", "Vite, JavaScript, Three.js",
             f"Mapa 3D navegável, bilíngue, com headers de segurança e esteira de segurança ativa. {link(SITE, SITE.replace('https://', ''))}"),
            ("Projetos front-end de estudo", "HTML, CSS, JavaScript, API REST",
             f"Busca de perfil na API do GitHub, landing page, listagem Pokémon e jogo do Mario. {link('https://github.com/ygos-96', GH)}"),
        ],
        "edu_h": "Formação acadêmica",
        "edu": [
            "Tecnólogo em Análise e Desenvolvimento de Sistemas (incompleto) · Senac · ago/2024 - dez/2025",
            "Técnico em Tecnologia da Informação · Senac · fev/2019 - dez/2021",
            "Bacharelado em Comunicação Social / Jornalismo (incompleto) · Uninove · 2014 - 2017",
        ],
        "courses_h": "Cursos complementares e idiomas",
        "courses": [
            "Desenvolvimento Full Stack · Dev Quest (Dev em Dobro) · nov/2022",
            "Formação Extra em Administração · Fundação Bradesco · mar/2022 - abr/2022",
            "Atendimento ao Público · Fundação Bradesco · mar/2022",
            "Idiomas: português nativo · inglês para leitura técnica",
        ],
        "port": "Portfólio",
    },
    "en": {
        "file": "Ygor-Gomes-Resume-EN.pdf",
        "title": "Ygor Gomes - Resume",
        "role": "Application Security (AppSec) | Front-End Developer | n8n and AI Automation",
        "loc": "São Paulo, Brazil",
        "summary_h": "Professional summary",
        "summary": "Developer moving into application security (AppSec). Publishes security projects on GitHub: an HMAC-SHA256 signed webhook with replay protection and idempotency; a DevSecOps pipeline on GitHub Actions (gitleaks, Semgrep, Trivy, npm audit and Dependabot); and an OWASP Top 10 vulnerability lab with fixes and automated tests. Front-end developer employed full time since May 2024: responsive websites and landing pages, and automations with AI agents in n8n in production, integrating systems via REST APIs, webhooks and JSON, with monitoring and error handling. Automated course access delivery by email and WhatsApp for over 1,000 students.",
        "skills_h": "Skills",
        "skills": [
            ("Application security", "OWASP Top 10 (SQL injection, XSS, IDOR, authentication failures, mass assignment), webhook validation (HMAC-SHA256, anti-replay, idempotency), DevSecOps (GitHub Actions, gitleaks, Semgrep, Trivy, npm audit, Dependabot), security headers and CSP"),
            ("Automation and integrations", "n8n, process automation, low-code, REST APIs, webhooks, JSON, WhatsApp and email automation, reports and spreadsheets, monitoring and error handling"),
            ("Artificial intelligence", "AI agents in n8n, AI-driven automation, generative AI"),
            ("Front-end", "HTML5, CSS3, JavaScript, React, Tailwind CSS, responsive layout, landing pages"),
            ("Tools", "Node.js, Git, GitHub, GitHub Actions, MySQL, Jest"),
            ("Soft skills", "Communication, teamwork, negotiation, quick adaptation, continuous learning"),
        ],
        "exp_h": "Professional experience",
        "exp": [
            ("Front-End Developer", "Original SP Tattoo · May 2024 - present",
             ["Build websites and landing pages with HTML5, CSS3, JavaScript and Tailwind CSS, responsive for desktop and mobile.",
              "Create and maintain production n8n process automations, integrating systems via REST APIs, webhooks and JSON to eliminate manual tasks.",
              "Develop AI agents in n8n integrated into the automation flows.",
              "Monitor production flows and handle errors to keep automations running.",
              "Implemented WhatsApp automations, speeding up communication and reducing operational work.",
              "Automated report and spreadsheet generation, speeding up information tracking.",
              "Automated course access delivery after purchase, sent by email and WhatsApp, serving over 1,000 students with no manual intervention.",
              "Use generative AI tools to speed up code and automation flow development."]),
            ("Collections Assistant", "GRB Services do Brasil · Nov 2022 - Oct 2023",
             ["Reviewed contracts to support the collections process.",
              "Negotiated overdue items, finding agreements for each case.",
              "Contributed to team meetings to align priorities."]),
        ],
        "proj_h": "Projects",
        "proj": [
            ("Secure webhook in n8n", "n8n, Node.js, HMAC-SHA256",
             f"Validates the signature, a time window against replay and duplicate events; simulator with 7 attack scenarios. {link('https://github.com/ygos-96/webhook-seguro-n8n', GH + '/webhook-seguro-n8n')}"),
            ("DevSecOps pipeline", "GitHub Actions, gitleaks, Semgrep, Trivy",
             f"Scans for secrets, dependencies and code flaws on every push and weekly, applied to the portfolio itself. {link('https://github.com/ygos-96/devsecops-pipeline', GH + '/devsecops-pipeline')}"),
            ("AppSec lab", "Node.js, OWASP Top 10",
             f"API with 5 flaws, the fixed version and exploits, with an automated before-and-after test. {link('https://github.com/ygos-96/appsec-lab-vulneravel', GH + '/appsec-lab-vulneravel')}"),
            ("Interactive portfolio", "Vite, JavaScript, Three.js",
             f"Navigable 3D map, bilingual, with security headers and an active security pipeline. {link(SITE, SITE.replace('https://', ''))}"),
            ("Front-end study projects", "HTML, CSS, JavaScript, REST API",
             f"GitHub profile search via API, landing page, Pokémon list and a Mario game. {link('https://github.com/ygos-96', GH)}"),
        ],
        "edu_h": "Education",
        "edu": [
            "Associate degree in Systems Analysis and Development (incomplete) · Senac · Aug 2024 - Dec 2025",
            "Technical degree in Information Technology · Senac · Feb 2019 - Dec 2021",
            "Bachelor's in Social Communication / Journalism (incomplete) · Uninove · 2014 - 2017",
        ],
        "courses_h": "Courses and languages",
        "courses": [
            "Full Stack Development · Dev Quest (Dev em Dobro) · Nov 2022",
            "Extra Training in Administration · Fundação Bradesco · Mar 2022 - Apr 2022",
            "Customer Service · Fundação Bradesco · Mar 2022",
            "Languages: Portuguese (native) · English (technical reading)",
        ],
        "port": "Portfolio",
    },
}


def build(lang):
    d = DATA[lang]
    doc = SimpleDocTemplate(f"public/{d['file']}", pagesize=A4, leftMargin=18*mm, rightMargin=18*mm, topMargin=15*mm, bottomMargin=14*mm,
                            title=d["title"], author="Ygor Gomes")
    f = [Paragraph("Ygor Gomes", st["name"]), Paragraph(d["role"], st["role"])]
    f.append(Paragraph(
        f'{d["loc"]} · (11) 96180-2437 · {link("mailto:ygs.contato@gmail.com", "ygs.contato@gmail.com")}<br/>'
        f'{link("https://www.linkedin.com/in/ygor-gs2006/", "linkedin.com/in/ygor-gs2006")} · '
        f'{link("https://github.com/ygos-96", GH)} · {d["port"]}: {link(SITE, SITE.replace("https://", ""))}', st["contact"]))
    f.append(Spacer(1, 3))
    f.append(HRFlowable(width="100%", thickness=1, color=ACC, spaceBefore=2, spaceAfter=0))

    def head(t):
        f.append(Paragraph(t.upper(), st["h"]))

    head(d["summary_h"])
    f.append(Paragraph(d["summary"], st["b"]))
    head(d["skills_h"])
    for k, v in d["skills"]:
        f.append(Paragraph(f"<b>{k}:</b> {v}", st["b"]))
    head(d["proj_h"])
    for name, stack, txt in d["proj"]:
        f.append(KeepTogether([Paragraph(f"<b>{name}</b> <font color='#555b66'>· {stack}</font>", st["it"]), Paragraph(txt, st["li"])]))
    head(d["exp_h"])
    for role, meta, pts in d["exp"]:
        block = [Paragraph(role, st["it"]), Paragraph(meta, st["meta"])]
        block += [Paragraph(p, st["li"], bulletText="•") for p in pts]
        f.extend(block)
    head(d["edu_h"])
    for e in d["edu"]:
        f.append(Paragraph(e, st["li"], bulletText="•"))
    head(d["courses_h"])
    for c in d["courses"]:
        f.append(Paragraph(c, st["li"], bulletText="•"))
    doc.build(f)
    print("ok", d["file"])


for l in ("pt", "en"):
    build(l)
