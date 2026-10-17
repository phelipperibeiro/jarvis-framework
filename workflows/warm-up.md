---
description: Prepara o contexto de uma tarefa nova carregando só o que é relevante (mapa de tecnologias do workspace, repositórios, especialidades, recorte do Central docs, entregas recentes e versões) e o guarda por apelido para o /eng.start ou o /prod.spec usar.
version: "2.0"
auto_execution_mode: 1
env_file: "@/ENV.md"
model_tier: low
model_justification: Leitura seletiva e perguntas de escopo — não requer raciocínio complexo
---

# warm-up — preparação de contexto da tarefa

## Objetivo

Antes de uma tarefa nova, carregar e guardar **só o contexto estritamente relevante**, para os comandos seguintes não reprocessarem nada. O resultado fica em `$SESSIONS_DIR/warm-ups/{apelido}/warm-up.md`; quem o usa (`/eng.start`, `/prod.spec*`) o leva para o `context.md` da sessão e apaga a pasta.

As rules já estão no contexto da sessão: **não as releia**. Perfil de comunicação e autonomia ficam com o CDD (`/jarvis-context-detect`), que o comando da tarefa chama.

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| Passo 5 — Central docs | `/jarvis-docs-central` | Se `CENTRAL_DOCS_STORAGE` estiver configurado no ENV.md (Modo 1: Buscar Docs, só o recorte escolhido) |
| Passo 7 — Versões das ferramentas | `context7` (MCP: `resolve-library-id`, `query-docs`) | Se o MCP `context7` estiver disponível na sessão (até 5 ferramentas principais dos repositórios ativos); sem o MCP, pula em silêncio |
| Passo 9 — Resumo e próximos comandos | `/eng.start`, `/prod.spec` | Só sugeridos ao usuário no fim (não são executados pelo warm-up) |

---

## Passo 1 — Perfil (silencioso)

```bash
grep -E "^(POSITION|AREA|HUB|SQUAD|WORKSPACE|WORKSPACE_REPOS|WORKSPACE_MODE|PROD_MODE|ENABLE_CDD|CENTRAL_DOCS_STORAGE|[A-Z]+_SPECIALIZATIONS)=" $IDE/ENV.md
```

`$IDE/ENV.md` pode estar num ancestral do cwd. `WORKSPACE` vazio = nome da pasta que contém `$IDE/`. Não invente valores ausentes; não pergunte o que está no ENV.

## Passo 2 — Mapa de tecnologias (`CDD-MIND-MAP.md`)

O mapa é o **contexto de workspace**: stack e papel de cada repositório. Fica na raiz do workspace (ao lado do `AGENTS.md`), fora do versionamento. Formato e instruções de preenchimento: `$IDE/templates/cdd-mind-map-template.md`.

1. **Repositórios do workspace:** use o `WORKSPACE_MODE` do ENV. `workspace`: os de `WORKSPACE_REPOS` ou, se vazia, as subpastas com `.git/` (a raiz não é repositório, mesmo com uma subpasta só). `project`: a raiz, uma linha. Reconfira pelo critério (raiz com `.git` = `project`; raiz sem `.git` e 1+ subpastas com `.git/` = `workspace`) e, se o valor gravado divergir do detectado ou estiver ausente, avise e sugira `jarvis init --upgrade`, sem alterar o ENV. Nas buscas de código vale a regra "Buscas de código em modo workspace" de `eng-rules.md`.
2. **Mapa não existe:** infira cada repositório pela tabela `$IDE/skills/jarvis-init/assets/sinais-de-stack.md` e pela estrutura (papel), mostre a tabela e pergunte com `AskUserQuestion`: **Confirmar** | **Corrigir** | **Incluir informação**. Repita até confirmar. Então:
   - grave `CDD-MIND-MAP.md` na raiz do workspace;
   - garanta a linha no `.gitignore`: `grep -qxF 'CDD-MIND-MAP.md' .gitignore 2>/dev/null || echo 'CDD-MIND-MAP.md' >> .gitignore`;
   - se o `AGENTS.md` da raiz não citar o mapa, acrescente uma linha:
     `> Contexto de workspace: [CDD-MIND-MAP.md](CDD-MIND-MAP.md) (tecnologias e papel de cada repositório; lido pelo /warm-up).`
3. **Mapa existe:** leia-o. Repositório com `.git` que não está no mapa → infira, valide com o usuário e acrescente só ele. Não reprocesse as linhas existentes.

Nunca leia `.env*`, chaves nem credenciais.

## Passo 3 — Repositórios ativos

- Projeto único: segue sem perguntar.
- Workspace com vários: `AskUserQuestion` (multiSelect) **"Quais repositórios aquecer nesta sessão?"**, com papel e stack do mapa em cada opção → `ACTIVE_REPOS`.

## Passo 4 — Especialidades (em memória)

1. Áreas dos `ACTIVE_REPOS` pela coluna **Área** do mapa.
2. `AskUserQuestion` (multiSelect) **"Quais áreas a tarefa envolve?"**, com as inferidas já marcadas.
3. Aplique a regra de especializações (`eng.specializations-rules`) **só** nas áreas confirmadas: skill base + lista `{ÁREA}_SPECIALIZATIONS`. As das outras áreas não são carregadas.

Tudo em memória: o `ENV.md` e qualquer configuração persistente **nunca** são alterados.

## Passo 5 — Central docs (condicional)

Se `CENTRAL_DOCS_STORAGE` estiver vazio, pule. Senão, via Skill tool `jarvis-docs-central` (Modo 1):

1. Leia só o índice `{SQUAD}/index.md`.
2. `AskUserQuestion`: **"Qual produto ou funcionalidade a tarefa vai impactar?"** (opções do índice; "Nenhuma / tarefa nova").
3. Leia **só** os `feature-*.md` escolhidos e os `delivery-*.md` desse recorte. Resuma em poucas linhas o comportamento atual e onde está no código.

Sem índice: avise que o squad ainda não tem consolidação (`/eng.spec-consolidate --inicial`) e siga. Erro: avise e siga, sem bloquear.

## Passo 6 — Entregas recentes

Por repositório ativo, na branch alvo (`main`, `dev` ou a padrão do remoto):

```bash
git -C {repo} log --merges -5 --format='%h %ad %s%n%b' --date=short {branch}
git -C {repo} show --stat --format= {hash}   # só os arquivos tocados, sem diff
```

Sem merges (squash/rebase): use os 5 últimos commits e avise em uma linha. Registre título, descrição e arquivos tocados; destaque padrões ou decisões recentes que valem para a tarefa.

## Passo 7 — Versões das ferramentas (só com o MCP `context7`)

Sem o MCP disponível, pule em silêncio. Com ele: para até **5** ferramentas principais dos repositórios ativos (coluna do mapa), `resolve-library-id` + `query-docs` só para a versão atual e mudanças relevantes. Uma linha por ferramenta: versão no projeto × atual.

## Passo 8 — Apelido e gravação

1. `AskUserQuestion`: **"Qual apelido para este aquecimento?"**, com uma sugestão derivada dos repositórios e do recorte (ex.: `api-2-checkout`) e a opção de digitar. Kebab-case, sem acentos.
2. Apelido já existe em `$SESSIONS_DIR/warm-ups/`: pergunte se sobrescreve ou escolhe outro.
3. Grave `$SESSIONS_DIR/warm-ups/{apelido}/warm-up.md` pelo template `$IDE/templates/warm-up-template.md`. Sem tokens, e-mails nem valores do ENV.

## Passo 9 — Resumo e próximos comandos

```
🔥 Warm-up "{apelido}" pronto

🗺️  Mapa: {n} repositórios ({criado | atualizado: +{repos} | sem mudança})
📦 Ativos: {repo (papel, stack)} …
🧩 Áreas: {áreas} · fora: {áreas descartadas}
📚 Central docs: {recorte | não configurado}
🔀 Entregas: {n} merges lidos
🔧 Versões: {ferramenta x.y → atual} … | não consultado

➡️  Próximos: /eng.start {KEY} · /prod.spec …  (eles usam este aquecimento)
```

---

## Regras

### Nunca
- Reler rules (já estão no contexto) ou ler uma pasta inteira
- Alterar o `ENV.md` ou qualquer configuração persistente
- Ler `.env*`, chaves ou credenciais
- Inventar stack, papel ou versão: inferência sempre passa pela validação do usuário
- Consultar o `context7` sem o MCP ou para mais de 5 ferramentas

### Sempre
- Uma pergunta por decisão, com `AskUserQuestion` (sem a ferramenta, a tabela de `prod-rules`)
- Ignorar em silêncio arquivos e passos opcionais que não existem
- Terminar com o resumo e os próximos comandos
