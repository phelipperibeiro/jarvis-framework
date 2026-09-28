---
description: Ciclo de vida de um robô RPA — criar novo ou manter existente
auto_execution_mode: 3
agent: "$IDE/agents/engineering/eng.rpa.agent.md"
rules_file: "$IDE/rules/engineering/rpa/eng.rpa-rules.md"
recommended_model: claude-sonnet-4-20250514
model_tier: high
model_justification: Requer análise de sistemas externos, decisões de arquitetura de robô e geração de código resiliente
---

# eng.rpa.robot

Workflow unificado para criação (`new`) ou manutenção (`update`) de robôs de automação.

> 📋 **Rules**: `$IDE/rules/engineering/rpa/eng.rpa-rules.md`
> 📋 **Docs**: `$IDE/rules/engineering/eng.docs-scraping-rules.md`
> 🤖 **Agente**: ARACHNE (`$IDE/agents/engineering/eng.rpa.agent.md`)

---

## Entrada

<arguments>
#$ARGUMENTS
</arguments>

Formato esperado: `new {TASK_MANAGER_KEY}` ou `update {TASK_MANAGER_KEY}`

**Se não receber argumentos ou estiverem incompletos**, perguntar na seguinte ordem:

1. **Modo**: criar robô novo (`new`) ou atualizar/manter robô existente (`update`)?
2. **Card**: qual o ID da tarefa no board? (ex: RPA-123)
3. **[se `new`]** Qual o tag do serviço? (ex: `ba`, `sp`, `mg`) — será usado como `{robot-tag}`
4. **[se `update`]** Qual robô será mantido? Listar opções:
   ```bash
   ls docs/engineering/robots/
   ```
   Apresentar a lista e pedir que o dev escolha.

> O `{robot-tag}` é o nome do serviço do robô em kebab-case (ex: `ba` → `ba-robot.md`).
> Nunca usar nomes de sistemas externos hardcodados como tag.

---

## Fase 0 — Setup

### 0.1 Verificar ENV.md

```bash
grep -E "^(SQUAD|HUB|POSITION|ENABLE_CDD)=" $IDE/ENV.md
```

### 0.2 CDD (condicional)

```bash
grep "^ENABLE_CDD=" $IDE/ENV.md
```

- Se `ENABLE_CDD=true` → executar `/context-detect {TASK_MANAGER_KEY}` antes de prosseguir
- Se `ENABLE_CDD=false` ou não definida → pular

### 0.3 Criar Branch e Sessão

```bash
git checkout dev && git pull origin dev
git checkout -b {TASK_MANAGER_KEY}-{robot-tag}
mkdir -p $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/
echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" > $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/.timestamp_start
```

> Branch sempre criada a partir de `dev`. Nunca de `main`/`master`.

---

## Modo `new` — Criar Robô Novo

### Fase N1 — Análise do Sistema-Alvo

> ⚠️ Obrigatória antes de qualquer código.
>
> 🔍 **Ferramentas de exploração disponíveis nesta fase** (não geram código de produção):
>
> | Situação | Ferramenta |
> |----------|-----------|
> | MCP Playwright disponível na sessão | **Playwright MCP** — navega e inspeciona direto da IDE sem sair do contexto |
> | Dev quer demonstrar o fluxo manualmente | **Playwright CLI** — `npx playwright codegen {url}` grava as interações e sugere seletores |
> | Fluxo descrito em linguagem natural, seletores desconhecidos | **Stagehand** (`/eng-scraper-robot-builder`) — usa `observe()` para descobrir seletores via IA |
>
> **Escolha da ferramenta:**
> - **Padrão** — perguntar ao dev qual ferramenta prefere usar para explorar o sistema-alvo
> - **Se `MAX_AI_EXECUTION_PERCENTAGE=100`** — decidir automaticamente, sem perguntar:
>   1. Playwright MCP disponível na sessão → usar MCP
>   2. MCP indisponível + fluxo descrito em linguagem natural → Stagehand
>   3. MCP indisponível + fluxo não descrito → Playwright CLI codegen
>
> O output de qualquer ferramenta é insumo para o `architecture.md` — não vai para produção diretamente.

**N1.1 Verificar robots.txt e ToS**

```bash
curl -s "{sistema-alvo}/robots.txt"
```

Documentar o resultado. Se houver restrições legais significativas, comunicar ao usuário e aguardar decisão antes de prosseguir.

**N1.2 Reconhecimento do Fluxo**

Perguntar ao usuário (ou extrair do card):

1. Qual o fluxo de autenticação? (formulário, token, cookie, sem auth)
2. Quais as URLs envolvidas em cada etapa?
3. Quais campos precisam ser extraídos?
4. Qual o formato de saída? (JSON, CSV, banco de dados, fila)
5. Existe mecanismo anti-bot conhecido? (rate limiting, captcha, fingerprinting)

**N1.3 Mapear Campos Disponíveis vs. Necessários**

Identificar explicitamente:
- Campos que **existem** na fonte e serão extraídos
- Campos que **não existem** na fonte — documentar como limitação por design

Apresentar o mapeamento ao usuário antes de prosseguir.

**N1.4 Decisão de Ferramenta**

> ⚡ **Princípio HTTP-first**: sempre tentar quebrar o site via requisição HTTP antes de recorrer ao browser. Browser é mais lento, frágil e custoso — só usar quando HTTP não for viável.

Ordem de investigação:
1. Inspecionar as requests de rede do fluxo (DevTools / Playwright MCP / CLI codegen) — verificar se existe API HTTP ou endpoint que retorna os dados diretamente
2. **Se existir** → implementar com axios + retry (sem browser)
3. **Se não existir / exigir renderização JS** → recorrer ao browser

| Ferramenta | Quando usar |
|-----------|------------|
| axios + retry wrapper | API HTTP identificada, autenticação via token/cookie |
| Cheerio + axios | HTML estático sem JS relevante |
| Puppeteer ou Playwright | Renderização JS obrigatória, sem API HTTP viável |
| Puppeteer stealth | Anti-bot agressivo (Cloudflare, fingerprinting) |
| `/eng-scraper-robot-builder` (Stagehand) | Fluxo descrito em linguagem natural, seletores desconhecidos |

> ⚠️ **Captchas e proxies**: verificar se a infraestrutura anti-bot já existe no projeto (serviço de resolução de captcha, pool de proxies) — esses recursos são **pré-requisito compartilhado**, não devem ser implementados do zero por robô. Se não existirem, escalar para o TL antes de prosseguir.

Aguardar confirmação antes de prosseguir.

### Fase N1.5 — Criar architecture.md

Com base em tudo coletado na análise, criar o arquivo de arquitetura da sessão:

```
$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/architecture.md
```

O `architecture.md` de um robô RPA deve conter:

| Seção | Conteúdo |
|-------|---------|
| **Contexto** | O que o robô resolve, card Jira, squad |
| **Sistema-alvo** | URLs envolvidas em cada etapa do fluxo |
| **Autenticação** | Tipo e fluxo de autenticação |
| **Ferramenta** | Escolha (Puppeteer/Playwright/axios/etc.) e justificativa |
| **Fases do robô** | Sequência: autenticação → navegação → extração → transformação → saída |
| **Campos extraídos** | Tabela: campo → fonte → disponível (sim/não) |
| **Limitações por design** | Campos que não existem na fonte — por que não é possível extrair |
| **Riscos** | Anti-bot, autenticação frágil, campos instáveis, rate limiting |
| **Variáveis de ambiente** | Lista de `process.env.*` necessárias |

> ⚠️ **Apresentar o `architecture.md` ao dev e aguardar aprovação antes de prosseguir.**
> Se houver ajustes, atualizar o arquivo e apresentar novamente.

### Fase N2 — Plano de Execução

```
/eng.plan {TASK_MANAGER_KEY}
```

O `eng.plan` lê o `architecture.md` criado na fase anterior e produz o `plan.md` com as fases de implementação detalhadas.

### Fase N3 — Implementação

```
/eng.work {TASK_MANAGER_KEY}
```

Garantir durante a implementação:
- [ ] Seletores seguem prioridade: id > data-* > CSS estável > XPath
- [ ] Retry com backoff em todos os I/Os que podem falhar
- [ ] Logs estruturados por fase
- [ ] Screenshot automático em falha (para browser headless)
- [ ] Credenciais via `process.env` — nenhuma hardcodada
- [ ] Testes unitários com mocks

### Fase N4 — Documentação

Criar `docs/engineering/robots/{robot-tag}-robot.md`.

Seguir `$IDE/rules/engineering/eng.docs-scraping-rules.md`:

| Seção | Conteúdo |
|-------|---------|
| Visão Geral | O que extrai e o que **não** extrai (limitações por design) |
| Fluxo de Execução | Sequência de passos com URLs de cada etapa |
| Fontes de Dados | Mapeamento de campos por fonte |
| Campos Extraídos | Tabela por situação/estado do registro |
| Variáveis de Ambiente | Lista de `process.env.*` necessárias (sem valores) |
| Limitações Conhecidas | Campos indisponíveis — por que não é possível extrair |
| Histórico de Bugs | Vazio na criação |
| Checklist de Troubleshooting | Sintoma → causa provável → ação |

Chamar `/docs-index` após criar.

### Fase N5 — Pre-PR e PR

```
/eng.pre-pr
/eng.pr
```

No corpo do PR incluir: link para `{robot-tag}-robot.md`, variáveis de ambiente necessárias, resultado do teste manual (se executado).

---

## Modo `update` — Manter Robô Existente

### Fase U1 — Carregar Contexto do Robô

Ler o documento existente do robô:

```bash
cat docs/engineering/robots/{robot-tag}-robot.md
```

Extrair e apresentar ao usuário:
- O que o robô faz atualmente
- Limitações conhecidas documentadas
- Histórico de bugs relevantes
- Variáveis de ambiente em uso

### Fase U2 — Entender a Mudança

Com base no card e no `{robot-tag}-robot.md`, identificar:

1. O que precisa mudar? (novo campo, correção de seletor, novo fluxo, bug fix)
2. Mudança afeta o sistema-alvo ou é interna ao robô?
3. Se envolve sistema-alvo: o layout/comportamento mudou ou é a mesma versão?
4. Há campos novos disponíveis na fonte ou continua com as mesmas limitações?

**Se a mudança envolve o sistema-alvo**, usar as ferramentas de exploração para inspecionar o que mudou antes de propor qualquer código:

| Situação | Ferramenta |
|----------|-----------|
| MCP Playwright disponível | **Playwright MCP** — inspecionar o estado atual do site |
| Dev quer demonstrar o que mudou | **Playwright CLI** (`codegen`) |
| Fluxo descrito em texto | **Stagehand** (`observe()`) |

> A escolha segue a mesma regra do modo `new`: perguntar ao dev qual prefere, exceto se `MAX_AI_EXECUTION_PERCENTAGE=100` — nesse caso decidir automaticamente.

**Se a mudança for estrutural** (ex: site que antes não tinha API agora tem), reavaliar a abordagem aplicando o princípio HTTP-first antes de implementar.

Apresentar diagnóstico antes de implementar.

### Fase U2.5 — Criar architecture.md de Manutenção

Criar o arquivo de sessão que registra o contexto da mudança:

```
$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/architecture.md
```

O `architecture.md` de uma manutenção de robô deve conter:

| Seção | Conteúdo |
|-------|---------|
| **Contexto** | O que está sendo mantido, card Jira, squad |
| **Robô** | `{robot-tag}`, link para `{robot-tag}-robot.md` |
| **Tipo de mudança** | `bugfix` / `novo-campo` / `novo-fluxo` / `refactor` |
| **Descrição da mudança** | O que muda e por quê |
| **Impacto no sistema-alvo** | Sim/não — se sim, o que foi inspecionado e o que mudou |
| **Arquivos afetados** | Lista de arquivos que serão alterados |
| **Variáveis de ambiente** | Novas env vars necessárias (se houver) |

> ⚠️ **Apresentar ao dev e aguardar confirmação antes de prosseguir.**

### Fase U3 — Implementação

```
/eng.work {TASK_MANAGER_KEY}
```

Para bug fixes estruturais (seletor quebrado, campo mudou de posição):
- Investigar o sistema-alvo antes de propor fix
- Nunca assumir que o problema é no código sem verificar se o sistema-alvo mudou

### Fase U4 — Atualizar Documentação

Atualizar `docs/engineering/robots/{robot-tag}-robot.md`:

- **Sempre**: Histórico de Bugs (toda correção estrutural entra aqui com referência ao card)
- **Se campos mudaram**: atualizar Fontes de Dados e Campos Extraídos
- **Se limitações mudaram**: atualizar Limitações Conhecidas
- **Se fluxo mudou**: atualizar Fluxo de Execução

> Uma atualização sem `{robot-tag}-robot.md` atualizado **não está pronta**.

Chamar `/docs-index` após atualizar.

### Fase U5 — Pre-PR e PR

```
/eng.pre-pr
/eng.pr
```

---

## Resumo Final

```
── Robô {new|update} ─────────────────────────────────────────
  Modo     : {new | update}
  Robô     : {robot-tag}-robot
  Classe   : {RobotTag}Robot
  Docs     : docs/engineering/robots/{robot-tag}-robot.md
  Branch   : {TASK_MANAGER_KEY}-{robot-tag}
  PR       : (link do MR criado pelo eng.pr)
─────────────────────────────────────────────────────────────
```

---

## Regras

### Nunca
- Pular a análise do sistema-alvo (modo `new`)
- Pular leitura do `{robot-tag}-robot.md` existente (modo `update`)
- Hardcodar credenciais ou nomes de sistemas externos
- Omitir atualização da documentação ao final

### Sempre
- Verificar robots.txt antes de qualquer implementação nova
- Documentar limitações conhecidas explicitamente
- Usar retry com backoff em todos os I/Os
- Atualizar Histórico de Bugs em toda correção estrutural (modo `update`)
