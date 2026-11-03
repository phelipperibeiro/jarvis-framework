# AGENTS.md

Arquivo de instrucoes para agentes de IA que atuam neste repositorio.

## Visao Geral

Este repositorio contem o **Framework Jarvis** - um framework de desenvolvimento orientado por contexto para IDEs de IA (Windsurf, Cursor, Claude Code, VS Code).

**Este repo NAO e um app executavel.** E um conjunto de templates, agentes, regras, skills e workflows para auxiliar desenvolvimento assistido por IA.

---

## 1) Estrutura do Repositorio

```
jarvis-framework/
├── agents/                       # 17 agentes (instalados em $IDE/agents/)
│   ├── engineering/              # 9 principais (eng.agent, eng.advisor.agent, eng.rpa.agent…)
│   │   ├── data/                 # 1 de dados (eng.data-engineer.agent)
│   │   └── qa/                   # 5 de QA
│   └── product/                  # 2 de produto (prod.pm-checker, prod.discovery-interviewer)
├── workflows/                    # comandos slash (em $IDE/commands/ ou workflows/, sem subpastas)
│   ├── engineering/              # 17 + data/ (2), frontend/ (3) e qa/ (3)
│   ├── product/                  # 10 (prod.spec.*, prod.roadmap.preview)
│   └── warm-up.md, taxonomy.md
├── skills/                       # 29 skills, todos com metadata.area:
│                                 # bases: eng-backend, eng-frontend, eng-qa, eng-data, eng-automation,
│                                 #   eng-platform, eng-ai (+ especializações: eng-backend-*, eng-qa-planner)
│                                 # eng-global-branch (nome da branch, forkável), eng-global-pr,
│                                 #   -task-comment, -investigation, -tech-spec, -docs-write
│                                 # jarvis-*: init, fork, context-detect, docs-central, docs-index,
│                                 #   create/list-specializations, report-issue, evolution-architect
│                                 # product-*: specs, specs-update, roadmap-report
├── templates/                    # documentos: engineering/ (ARD, RFC, tech spec, architecture, plan…),
│                                 # product/ (PRD, FRD, épico, issue, breakdown, discovery), ENV-template.md
├── rules/                        # carregadas no início da sessão, filtradas pelo perfil (Applies to)
│   ├── engineering/              # eng-rules.md, eng-security-rules.md, frontend/, qa/…
│   └── product/                  # prod-rules.md, prod.spec-rules.md
├── rules-on-demand/              # lidas pelo workflow que as usa (etapas, doc-links, warm-up, product/)
├── bin/                          # CLI jarvis (jarvis.js, commands/, lib/)
├── test/                         # node:test (npm run test:filtro, npm run test:comandos)
├── docs/                         # guias para humanos (engenharia/, produto/, estrutura/)
├── AGENTS.md                     # este arquivo (instalado como $IDE/AGENTS.md)
├── CHANGELOG.md, CONTRIBUTING.md, taxonomy.md, members.md
└── .github/                      # template de PR
```

---

## 2) Regras Obrigatorias

### Pre-requisito: ENV.md

- Validar `$IDE/ENV.md` antes de qualquer comando; excecao: `/jarvis-init`.
- Se nao existir ou estiver incompleto, orientar o usuario a executar `/jarvis-init`.

### Taxonomia Organizacional

O framework usa `taxonomy.md` (raiz) como fonte de verdade para opções válidas:
- **SQUADS** - Times de desenvolvimento
- **HUBS** - Áreas técnicas (AI, FRONTEND, BACKEND, QA, DATA, FULLCYCLE)
- **POSITIONS** - Cargos (JUNIOR, PLENO, SENIOR, TECH LEAD, etc.)
- **AREAS** - Áreas de negócio (ENGINEERING, PRODUCT)

**Relação com jarvis-init:**
1. `taxonomy.md` define as opções válidas
2. `/jarvis-init` LÊ `taxonomy.md` e cria `ENV.md` com essas opções
3. Após modificar `taxonomy.md`, executar `/jarvis-init` novamente para atualizar

**Gerenciamento via `/taxonomy`:**
```bash
/taxonomy list SQUADS              # Listar opções
/taxonomy add SQUADS MOBILE "..."  # Adicionar
/taxonomy update SQUADS RPA "..."  # Atualizar
/taxonomy remove SQUADS LEGACY     # Remover
/taxonomy validate                 # Validar estrutura
```

### Variaveis obrigatorias no ENV.md

- `WORKSPACE`, `IDE`, `SQUAD`, `HUB`, `AREA`
- `MAX_AI_EXECUTION_PERCENTAGE` (60-100)
- `POSITION`
- `USER` (identidade; se vazio, fallback git / SO)

`WORKSPACE` e a pasta que contem `$IDE/` (nao um repo). Vazio = nome dessa pasta.
`WORKSPACE_REPOS` e allowlist opcional; vazio = todas as subpastas com `.git/`.
O CLI sobe diretorios a partir do cwd ate achar `$IDE/ENV.md` (abre um repo filho e ainda resolve o workspace).
Estado local fica em `{workspace}/.jarvis/` (sessions) — nao em `~/.jarvis/`.

> **Identidade do usuario**: `USER=` no ENV.md. Se vazio, usa `git config user.email` e, por ultimo, o usuario do SO.
> Nao ha login OAuth. `jarvis whoami` mostra a identidade resolvida.

### Deteccao de IDE

A variavel `$IDE` representa a pasta da IDE:
- `.windsurf/` - Windsurf IDE
- `.claude/` - Claude Desktop/Code
- `.cursor/` - Cursor IDE
- `.codex/` - Codex CLI (OpenAI)
- `.opencode/` - OpenCode
- `.agents/` - Gemini CLI / Antigravity (Google)
- `.kiro/` - Kiro (AWS)

O CLI resolve o `ENV.md` na seguinte precedência:
1. `--env-file <path>` — path explícito
2. `--ide <ide>` — ex: `--ide windsurf` → `.windsurf/ENV.md`
3. `JARVIS_ENV_FILE` — variável de ambiente com path
4. `IDE` — variável de ambiente (ex: `IDE=windsurf`)
5. Auto-detect — ordem: windsurf → claude → cursor → codex → opencode → gemini → kiro (emite warning se múltiplos encontrados)

### Invocacao de Skills por IDE

| IDE | Mecanismo | Como invocar um skill |
|-----|-----------|-----------------------|
| Claude Code | Slash commands em `.claude/commands/` | `/warm-up-jarvis`, `/eng.start` |
| Windsurf | Rules + prompts em `.windsurf/` | `/warm-up-jarvis`, `/eng.start` |
| Cursor | Slash commands em `.cursor/` | `/warm-up-jarvis`, `/eng.start` |
| **Codex** | Skills TUI em `.codex/skills/` | Linguagem natural ou painel de skills do TUI |
| OpenCode | Slash commands em `.opencode/` | `/warm-up-jarvis`, `/eng.start` |
| Gemini CLI | Prompts em `.agents/` | `@warm-up-jarvis`, linguagem natural |
| **Kiro** | Steering files em `.kiro/steering/` | `#skill-{nome}` no chat (ex: `#skill-eng-backend`) |

> **Codex**: Não existe slash command (`/`) no Codex. Skills são descobertas automaticamente
> em `.codex/skills/` e aparecem no painel TUI. Para invocar, descreva o que quer:
> _"use o skill eng-backend para criar uma rota POST"_ ou selecione pelo painel.

### Idioma

- Todo arquivo `.md` gerado deve ser em pt-BR.
- Termos tecnicos em ingles sao aceitos.

### Seguranca

- Nao inventar stack, endpoints, ambientes, credenciais ou integracoes.
- Nao expor tokens/segredos; orientar uso de variaveis de ambiente.
- Nao sugerir acao destrutiva sem aviso e confirmacao explicita.
- Priorizar seguranca quando houver conflito com velocidade.
- Respeitar `MAX_AI_EXECUTION_PERCENTAGE` do ENV.md.

---

## 3) Build, Lint e Testes

Este repositorio possui `package.json` com o CLI `jarvis` (`bin/jarvis.js`).

Comandos disponíveis:
```bash
jarvis whoami   [--logout]                          # Exibir identidade (ENV.md / git / SO)
jarvis logout                                       # Remover auth.json legado (opcional)
jarvis init                                         # Bootstrap do framework no projeto
jarvis init --upgrade [--ide X] [--yes] [--remove-stale]   # Atualizar projeto existente: assets + variáveis novas do ENV (inclui WORKSPACE_MODE) + documentos nas pastas novas + lista/remove skills antigos + rules filtradas pelo perfil do ENV
jarvis list                                         # Listar agents, skills e workflows
jarvis install-rtk                                  # Instalar RTK (token killer — economia 60-90% em tokens de shell)
jarvis tokens    [--hub X --position Y --area Z --squad W] [--rtk] [--json]   # Estimar o que carrega no início da sessão (perfil do ENV.md se sem flags)
jarvis rules sync [--ide X]                         # Filtra rules/ e rules-on-demand/ da IDE pelo perfil do ENV.md (Passo 8 do /jarvis-init)
jarvis map       <nome> [--depth N] [--reverse]      # Mapa de chamadas de um workflow, skill ou agente (lê só as tabelas padronizadas)
jarvis fork      [nome] [--list] [--update [--diff]] [--delete] [--candidate]   # Overlay de empresa (#199): copia um artefato do core para $IDE/overlays/{COMPANY_PROFILE}/ com carimbo; lista; recarimba; remove
jarvis daily-report [--days N] [--json]             # Junta os daily.md das sessões por dia (usado pelo /eng.daily-report)
```

Quando atuar em um projeto alvo, detectar comandos em:
- JS/TS: `package.json`, `pnpm-lock.yaml`, `yarn.lock`
- Python: `pyproject.toml`, `requirements.txt`, `tox.ini`
- Go: `go.mod`, `Makefile`
- Rust: `Cargo.toml`
- Outros: `Makefile`, `justfile`, `.github/workflows/*`

---

## 4) Hierarquia de Documentos

### Prioridade de leitura (da mais alta para a mais baixa)

1. `$IDE/ENV.md` - Contexto do ambiente
2. `$IDE/rules/` - Regras especificas por dominio (carregadas no inicio)
   `$IDE/rules-on-demand/` - Regras de uma etapa ou transversais, lidas pelo workflow que as usa
3. `$IDE/agents/` - Definicoes de agentes
4. `$IDE/skills/` - Playbooks operacionais
5. `$IDE/workflows/` - Templates de execucao
6. `$IDE/templates/` - Templates de documentos

### AGENTS.md Aninhados

Cada pasta pode ter seu proprio AGENTS.md com instrucoes especificas. No repositorio do Jarvis, `agents/`, `skills/` e `workflows/` tem cada uma o seu; eles nao sao copiados para a IDE. Na IDE instalada existe apenas `$IDE/templates/AGENTS.md` (instrucoes sobre templates).

**Regra**: O AGENTS.md mais proximo tem precedencia.

---

## 5) Fluxos Principais

### Inicializacao

```bash
/jarvis-init            # Cria ENV.md lendo taxonomy.md (unico comando sem ENV.md); oferece o passo opcional de adicionar as stacks
/warm-up                 # Carrega contexto do projeto
```

### Desenvolvimento de Feature

```bash
/eng.start "feature"     # Investigacao e arquitetura (somente planejamento)
/eng.plan "feature"      # Plano de execucao faseado (somente planejamento)
/eng.work "feature"      # Implementacao e testes (commit por fase, sem push/PR)
/eng.pre-pr              # Validacao pre-PR
/eng.pr                  # Push e PR, depois da pergunta (regra de ouro)
```

### Documentacao

```bash
/eng.docs                # Atualiza documentacao de engenharia
```

---

## 6) Relacao Agents x Skills

- **Agents**: definem persona, postura e forma de atuacao.
- **Skills**: definem playbooks executaveis e padroes detalhados.

Quando um agente atua em tema com skill correspondente, o skill e a fonte de verdade operacional.

### Mapeamento

Tabela completa de mapeamento comando/trigger → skill: ver `skills/AGENTS.md`, seção "Mapeamento Comando → Skill", no repositorio do Jarvis (nao e copiada para a IDE; cada skill e escolhida pela propria `description`).

---

## 7) Comandos de Processo

| Fase | Comando | Restricao |
|------|---------|-----------|
| Planejamento | `eng.start`, `eng.plan` | Somente analise, sem codigo |
| Implementacao | `eng.work` | Codigo e testes, commit por fase, sem push nem PR |
| Entrega | `eng.pr` | Push e PR, depois da pergunta (regra de ouro) |

---

## 8) Agentes Disponiveis

Lista completa de agentes: `jarvis list` (ou `agents/README.md`, no repositorio do Jarvis; nao e copiado para a IDE).

---

## 9) Referencias Rapidas

- `jarvis list` - Agentes, skills e workflows instalados (os guias `agents/README.md`, `workflows/README.md` e `skills/AGENTS.md` ficam no repositorio do Jarvis)
- `$IDE/rules/engineering/` - Regras de engenharia
- `$IDE/rules/product/` - Regras de produto
- `$IDE/rules-on-demand/engineering/` - Regras de etapa (lidas pelo workflow)

---

## 10) O Que Este Repo NAO Fornece

- Comandos reais de build/lint/test para um app especifico.
- Convencoes de codigo de um produto especifico.
- Logica de negocio ou implementacao de features.

Se o usuario pedir comandos especificos, solicite o projeto alvo ou arquivos de config.

---

**Última atualização**: 2026-04-26
