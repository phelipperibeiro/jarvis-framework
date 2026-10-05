# AGENTS.md - Pasta skills/

Instrucoes especificas para agentes de IA que manipulam a pasta de skills.

---

## Proposito desta Pasta

A pasta `skills/` contem **playbooks executaveis** que sao a fonte de verdade operacional do framework. Skills definem o "como fazer" de forma detalhada e passo a passo.

---

## Estrutura

```
skills/
├── eng-backend-arch-c4/          # Diagramas C4
│   ├── SKILL.md
│   └── assets/
├── eng-global-docs-write/       # Escrita de documentacao
│   └── SKILL.md
├── eng-global-pr/               # Criacao de Pull/Merge Requests (GitLab/GitHub/Bitbucket)
│   └── SKILL.md
├── eng-global-task-comment/     # Comentário no card (Jira/Linear/GitHub Issues/Asana)
│   └── SKILL.md
├── jarvis-list-specializations/ # Lista especializações de stack instaladas e registradas
│   └── SKILL.md
├── jarvis-evolution-architect/ # Mentor de arquitetura: analisa e recomenda a evolução do próprio Jarvis (SDD, CDD, Agentic SE)
│   └── SKILL.md
├── jarvis-create-specialization/ # Cria uma especialização de stack (backend/frontend) a partir do código do projeto e a registra na lista
│   ├── SKILL.md
│   └── assets/
├── eng-backend/          # Base neutra de backend (APIs, auth, workers, dados); especializações por stack se somam a ele
│   └── SKILL.md
├── eng-frontend/         # Base neutra de frontend (componentes, estado, performance UI, acessibilidade, design system/tokens, micro frontend); especializações se somam a ele
│   ├── SKILL.md
│   └── references/
├── eng-qa/               # Base neutra de QA (estratégia, design de casos, automação, não funcionais, gestão de defeitos); especializações em QA_SPECIALIZATIONS se somam a ela
│   ├── SKILL.md
│   └── references/
├── eng-backend-nestjs/           # Framework NestJS: módulos, DI, guards, interceptors, pipes, Passport/JWT
│   └── SKILL.md
├── eng-backend-rabbitmq/         # Mensageria RabbitMQ (HTTP API, codigo, arquitetura, troubleshooting)
│   └── SKILL.md
├── eng-backend-microservices-trace/ # Rastreamento de bugs entre serviços (HTTP + AMQP); especialização de backend
│   └── SKILL.md
├── eng-platform/         # Base neutra de platform/infra (+ especializações em PLATFORM_SPECIALIZATIONS)
│   ├── SKILL.md
│   └── references/
├── eng-ai/ # Base neutra de IA (ML, dados, LLM/RAG/agentes, avaliação, MLOps, governança, segurança)
│   ├── SKILL.md
│   └── references/
├── eng-data/ # Base neutra de dados (pipelines, modelagem, qualidade, BI, governança) + especializações em DATA_SPECIALIZATIONS
│   ├── SKILL.md
│   └── references/
├── product-specs/ # Porta de entrada de especificação de produto
│   └── SKILL.md
├── product-specs-update/ # Sincroniza especificações de produto
│   └── SKILL.md
├── product-roadmap-report/ # Relatório de status do roadmap
│   └── SKILL.md
├── eng-automation/          # Base neutra de automação (RPA, web, APIs, extração, ingestão) + especializações em AUTOMATION_SPECIALIZATIONS
│   ├── SKILL.md
│   └── references/
├── jarvis-docs-index/           # Indexacao de documentos
│   └── SKILL.md
├── jarvis-init/         # Inicializacao do framework (/jarvis-init), com o passo opcional de adicionar as stacks
│   ├── SKILL.md
│   └── assets/
├── eng-qa-planner/           # Planejamento de testes e análise de gaps de cobertura (especialização de qa: registrar em QA_SPECIALIZATIONS)
│   ├── SKILL.md
│   └── assets/
├── jarvis-report-issue/         # Reportar bug no próprio Jarvis (JARVIS_PROJECT)
│   └── SKILL.md
├── jarvis-context-detect/       # Detecta contexto do projeto/tarefa
│   └── SKILL.md
└── jarvis-docs-central/         # Sync/publish docs no central-docs (GitLab/GitHub/Bitbucket)
    └── SKILL.md
```

> Pastas listadas acima refletem skills com `SKILL.md` neste repo. Não cite uma skill que não tenha pasta em `skills/`.

---

## Estrutura de um Skill

Cada skill vive em sua propria pasta:

```
skills/{nome-do-skill}/
├── SKILL.md              # Obrigatorio - arquivo principal
├── assets/               # Opcional - schemas, templates
│   ├── schema.json
│   └── template.md
└── references/           # Opcional - docs locais
│   └── docs.md
└── commands/             # Opcional - Comandos ou workflows usados pela skills
    └── command-name.md
```

---

## Frontmatter Obrigatorio

Todo SKILL.md deve comecar com frontmatter YAML:

```yaml
---
name: nome-do-skill
description: >
  O que faz + Trigger de quando usar.
argument-hint: "[argumentos]"
disable-model-invocation: false
allowed-tools: Read Edit Write Glob Grep Bash
license: AGPL-3.0
metadata:
  author: jarvis-team
  version: "1.0"
  area: backend        # obrigatório: área do skill (ver "Áreas e nomes")
  stack: golang        # só em especializações de backend/frontend
---
```

> **`metadata.area` é obrigatório.** Um skill instalado sem área reconhecida faz os comandos `eng.*` serem bloqueados (ver `rules/engineering/eng.skills-rules.md`).

---

## Áreas e nomes

### Áreas reconhecidas (`metadata.area`)

| Área | O que cobre |
|------|-------------|
| `backend` | APIs, autenticação, workers, mensageria, banco de dados |
| `frontend` | Componentes, estado, estilos, performance de UI, acessibilidade |
| `qa` | Testes, quality gates, relatórios de qualidade |
| `data` | Pipelines, qualidade e contratos de dados |
| `ai` | Features com modelos de IA |
| `automation` | RPA (robôs, automação de browser e de fluxos de trabalho) e Web (scraping, crawling, parsing) |
| `devops` | Performance, infraestrutura, entrega |
| `platform` | Platform/infraestrutura: sistemas, redes, cloud, IaC, contêineres, CI/CD, observabilidade, SRE, segurança de infra, FinOps |
| `global` | Skills transversais de engenharia e do próprio framework |
| `product` | Especificação de produto |

Skill sem `metadata.area`, ou com área fora desta lista, é tratado como **sem área** (`unknown`) e bloqueia os comandos `eng.*`.

### Nome do skill

O nome tem a forma `<prefixo>-<área>-<nome>`; **só os dois primeiros segmentos importam** para a regra, o resto é livre.

| Tipo | Padrão | Exemplos |
|------|--------|----------|
| Engenharia por área | `eng-<área>-<nome>` | `eng-qa-planner` |
| Skill base de backend/frontend | `eng-backend`, `eng-frontend` | — |
| Skill base de outra área | `eng-<área>` | `eng-platform`, `eng-qa`, `eng-ai`, `eng-data` |
| Especialização de stack | `eng-<backend\|frontend>-<stack>` | `eng-backend-nestjs` |
| Engenharia global | `eng-global-<nome>` | `eng-global-pr`, `eng-global-docs-write` |
| Produto | `product-<nome>` | `product-specs`, `product-specs-update` |
| Transversal do framework | `jarvis-<nome>` (`area: global`) | `jarvis-init`, `jarvis-docs-central` |

### Skill base, especialização e `stack`

- **Base com especializações wireadas:** `area: backend`, `frontend`, `qa`, `data`, `automation` ou `platform`, **sem** `stack`. É sempre carregado pela regra `eng.specializations-rules.md`, que também carrega as especializações registradas em `BACKEND_SPECIALIZATIONS`, `FRONTEND_SPECIALIZATIONS`, `QA_SPECIALIZATIONS`, `DATA_SPECIALIZATIONS`, `AUTOMATION_SPECIALIZATIONS` ou `PLATFORM_SPECIALIZATIONS`.
- **Especialização de backend/frontend:** `area: backend` ou `frontend`, **com** `metadata.stack` (o sufixo do nome). Só é carregada quando o projeto a registra em `BACKEND_SPECIALIZATIONS` ou `FRONTEND_SPECIALIZATIONS` no `ENV.md`.
- **Especialização de qa/data/automation/platform:** `area` correspondente, **sem** `metadata.stack` (o campo é só pra backend/frontend). Só é carregada quando o projeto a registra na variável da área no `ENV.md` (ex: `eng-qa-planner` em `QA_SPECIALIZATIONS`; uma skill de Terraform/Kubernetes/provedor em `PLATFORM_SPECIALIZATIONS`).
- A área `ai` ainda não tem lista (sem `AI_SPECIALIZATIONS` até que apareça necessidade real).

---

## Secoes Obrigatorias de um SKILL.md

1. **Frontmatter** - Metadados YAML
2. **Objetivo** - O que o skill faz
3. **Entrada** - Argumentos e inputs
4. **Recursos** - Templates, schemas, referencias
5. **Pre-requisito** - Validacoes antes de executar
6. **Quando Usar** - Cenarios de uso
7. **Padroes Criticos** - Regras mais importantes
8. **Fluxo de Trabalho** - Passo a passo
9. **Skills invocados durante a execução do skill** - Subseção (`###`) com a tabela `| Passo | Skill | Condição |` do que o skill chama no próprio fluxo (não vale pré-requisito pedido ao usuário nem sugestão de próximo passo). Sem chamadas, uma linha `Nenhuma — skill autocontida`. Vem depois do fluxo e antes de Tratamento de Erros/Checklist
   O `jarvis map` e o `npm run test:comandos` leem so essa tabela (e, nos agentes, `## Skills Disponíveis` e `## Workflows e Agentes Relacionados`): chamada que existir so no texto corrido nao aparece no mapa, e nome citado que nao existir faz o teste falhar.
10. **Regras** - Nunca/Sempre
11. **Checklist de Conclusao** - Validacao final
12. **Output** - Artefatos gerados
13. **Mensagem de Conclusao** - Feedback ao usuario

---

## Diferenca entre Skills e Agents

| Aspecto | Skills | Agents |
|---------|--------|--------|
| Define | Playbook executavel | Persona e postura |
| Foco | Como executar | Quem executa |
| Detalhe | Passo a passo | Alto nivel |
| Fonte de verdade | Operacional | Comportamento |

**Regra**: Skills tem precedencia para detalhes operacionais.

---

## Invocação por IDE

Skills são invocados de formas diferentes dependendo da IDE:

| IDE | Invocação |
|-----|-----------|
| Claude Code, Cursor, OpenCode | `/nome-do-skill` (slash command) |
| Windsurf | `/nome-do-skill` (slash command) |
| **Codex (OpenAI)** | Linguagem natural ou painel TUI de skills — **sem slash commands** |
| Gemini CLI | `@nome-do-skill` ou linguagem natural |

> **Codex**: Skills ficam em `.codex/skills/` com `SKILL.md` + `openai.yaml` gerado
> automaticamente pelo `jarvis init`. O Codex descobre os skills pelo `openai.yaml`
> e os exibe no painel TUI. Para invocar, diga o que quer fazer — o Codex seleciona
> o skill adequado ou você indica pelo nome: _"use o skill eng-backend"_.

---

## Mapeamento Comando → Skill

| Comando / Trigger | Skill |
|-------------------|-------|
| `/jarvis-init` | `jarvis-init` |
| `/warm-up` | `jarvis-docs-central` (sync) |
| `eng.start` | `jarvis-docs-central` (buscar PRD/ARD) |
| `/eng.docs` | `eng-global-docs-write`, `jarvis-docs-index` |
| `/eng.pre-pr` | `eng-qa-planner`, `eng-global-docs-write`, `jarvis-docs-central` (detectar docs) |
| `/eng.pr` | `eng-global-pr` |
| Comentário no card | `eng-global-task-comment` |
| `jarvis docs sync` | `jarvis-docs-central` |
| `jarvis docs publish` | `jarvis-docs-central` |
| Arquitetura C4 | `eng-backend-arch-c4` |
| Listar especializações de stack (instaladas e registradas) | `jarvis-list-specializations` |
| Criar uma especialização de stack (backend ou frontend) a partir do código do projeto | `jarvis-create-specialization` |
| Decisão de arquitetura do Jarvis (agent, skill, workflow ou rule?), simplificação, tendências | `jarvis-evolution-architect` |
| Mensageria, filas, RabbitMQ, events, consumers, producers | `eng-backend-rabbitmq` (especialização de backend: registrar em `BACKEND_SPECIALIZATIONS`) |
| APIs, auth, workers, filas, caching, banco de dados | `eng-backend` (base) + `BACKEND_SPECIALIZATIONS` |
| Componentes, UI, estado, estilos, performance, acessibilidade, design system/tokens, micro frontend | `eng-frontend` (base) + `FRONTEND_SPECIALIZATIONS` |
| Sistemas, redes, cloud, IaC, contêineres, CI/CD, observabilidade, SRE, segurança de infra, FinOps | `eng-platform` (base) + `PLATFORM_SPECIALIZATIONS` |
| Estratégia de testes, design de casos, cobertura, automação, não funcionais, gestão de defeitos | `eng-qa` (base) + `QA_SPECIALIZATIONS` |
| Planejamento de testes e análise de gaps de cobertura da branch atual | `eng-qa-planner` (especialização de qa: registrar em `QA_SPECIALIZATIONS`) |
| Revisão de PR frontend (tipagem, a11y, tokens, itens da stack) | `eng.frontend-review` |
| Auditoria de performance frontend (Core Web Vitals, pacote entregue) | `eng.frontend-perf-audit` |
| Módulos NestJS, DI, guards, interceptors, pipes, Passport/JWT | `eng-backend-nestjs` (especialização de backend) |
| RPA, web scraping, Puppeteer, extração de dados, parsing, ETL | `eng-automation` (base) + `AUTOMATION_SPECIALIZATIONS` |
| Criar robô RPA novo ou manter existente (new|update + card) | `eng.rpa.robot` (workflow) |
| Planejar capacidade QA da sprint: risco por task, alocação entre QAs e Quality Champions | workflow `eng.qa-sprint-planning` |
| Sign-off QA pré-deploy: verifica cobertura, bugs abertos, produz GO/NO-GO + snippet CI para TL | workflow `eng.qa-release-signoff` |
| Pipelines ETL/ELT, modelagem, qualidade, BI/dashboards, governança, onboarding de fonte, orquestração | `eng-data` (base) + `DATA_SPECIALIZATIONS` |
| Criar pipeline novo (docs, qualidade, idempotência, gold) | `data.new-pipeline` |
| Criar contrato de dados para squad requisitante | `data.contract` |
| Documentação central (GitLab/GitHub/Bitbucket) | `jarvis-docs-central` |
| Bug cross-service (HTTP + AMQP) | `eng-backend-microservices-trace` |

---

## Criando um Novo Skill

Não há um gerador de skills: a criação é manual.

1. Escolher a **área** e o nome no padrão `<prefixo>-<área>-<nome>` (ver "Áreas e nomes")
2. Criar a pasta `skills/{nome}/` com um `SKILL.md`, usando como modelo um skill existente de porte parecido (por exemplo, `eng-qa-planner` para um skill de fluxo, `eng-backend-nestjs` para uma especialização)
3. Preencher o frontmatter ("Frontmatter Obrigatorio"), **inclusive `metadata.area`** (e `metadata.stack` se for especialização), e as "Secoes Obrigatorias de um SKILL.md", incluindo a tabela `Skills invocados durante a execução do skill`
4. Validar estrutura: `name` igual ao nome da pasta e área reconhecida
5. Registrar o skill no `SKILLS-ROADMAP.md` e, se houver comando associado, na tabela "Mapeamento Comando → Skill"

---

## Regras

### Nunca

- Criar skill sem frontmatter completo ou sem `metadata.area`
- Duplicar skill existente
- Colocar detalhes de persona (isso vai no agent)
- Usar URLs web em references (use caminhos locais)
- Omitir secao "Quando Usar" ou "Padroes Criticos"
- Remover acentos do portugues

### Sempre

- Verificar se skill ja existe antes de criar
- Seguir convencoes de nomenclatura
- Incluir todas as secoes obrigatorias
- Documentar padroes criticos primeiro
- Manter exemplos de codigo minimos e focados
- Usar portugues correto com acentos

---

## assets/ vs references/

```
Precisa de templates de codigo?    → templates/{skill}-template.md
Precisa de schemas JSON?           → assets/
Precisa de configs de exemplo?     → assets/
Link para docs existentes?         → references/
```

**Regra**: `references/` deve apontar para arquivos LOCAIS, nao URLs web.

### Skill grande com temas separaveis: roteador + references/

O corpo do `SKILL.md` e carregado inteiro ao invocar a skill. Quando a skill tem **3 ou mais temas que se usam isoladamente** (por exemplo guards, testes, troubleshooting), mantenha no `SKILL.md` so o que vale sempre (objetivo, quando usar, padroes criticos, arvore de decisao, regras, checklist, a tabela de skills invocados) e uma tabela "Referencias" (Tema | Quando ler | Arquivo); cada tema vai para `references/{n}-{tema}.md`. Modelo: `skills/eng-backend/`. Ja seguem o modelo: `eng-backend-nestjs`, `eng-automation`, `eng-backend-rabbitmq`, `eng-platform`, `eng-qa`, `eng-ai`, `eng-data` e `eng-frontend`.

Nao converta procedimento sequencial (passo 1, 2, 3 que se le de ponta a ponta) nem skill pequena (menos de ~8 KB): nao ha tema para pular, so mais arquivos para ler.

---

## Referencias

- `SKILLS-ROADMAP.md` - Skills existentes e planejadas
- `../agents/` - Agentes que usam skills
- `../workflows/` - Workflows relacionados
- `../rules/` - Regras que skills implementam

---

**Ultima atualizacao**: 2026-10-05