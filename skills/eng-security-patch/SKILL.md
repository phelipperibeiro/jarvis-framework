---
name: eng-security-patch
description: Gera diffs candidatos para achados confirmados de segurança. Consome triage.json (preferencial) filtrado por status == "confirmed". Executa 1 subagente de patch por achado + 1 reviewer independente por diff (sem ver a prosa do finding). Escreve PATCHES/bug_NN/{patch.diff,patch_result.json}, PATCHES.md e PATCHES.json como texto inerte para revisão humana — nunca aplica diffs. Usar quando pedido "gerar fixes", "patch dos achados", "fechar o loop do triage", "gerar correções candidatas".
argument-hint: "<triage.json> [--repo PATH] [--top N] [--id F-NNN] [--fresh]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Task
  - AskUserQuestion
  - Bash(git log:*)
---

# eng-security-patch

Terceira peça do pipeline estático (`/eng-threat-model` → `/eng.security-audit` → `/eng-security-triage` → `/eng-security-patch`).
Transforma uma lista ranqueada de achados verificados em diffs candidatos.

O skill **nunca aplica um diff** ao repositório-alvo. O output é texto inerte em `./.security/outputs/PATCHES/` para o TL revisar e aplicar fora de banda. Não existe flag `--apply` ou `--approve` por design: a capacidade está ausente e portanto não pode ser prompt-injetada.

**Argumentos** (parsear de `$ARGUMENTS`):
- `<triage.json>` (posicional, obrigatório): `triage.json` filtrado por `status == "confirmed"`. Aceita `security-findings.json` com warning.
- `--repo PATH`: codebase-alvo, read-only (default: cwd). O skill para se os arquivos citados não resolverem sob esse path.
- `--top N`: patchar apenas os N achados de maior severidade.
- `--id F-NNN`: patchar apenas o achado com este id.
- `--fresh`: ignorar checkpoint `.security/state/patch-state.json` e recomeçar do zero.

**Escopo de Write.** A ferramenta Write pode escrever SOMENTE em `./.security/outputs/PATCHES/` e `./.security/state/`. Nunca escrever em `--repo`, nunca `git apply`, nunca `patch`, nunca editar código-alvo.

---

## Checkpointing (`.security/state/patch-state.json`)

Estado persiste em `.security/state/patch-state.json` para que uma nova sessão `/eng-security-patch` retome sem re-spawnar subagentes.

**Formato do estado:**
```json
{
  "status": "running|complete",
  "phase_done": 0,
  "args": { "repo": ".", "top": null, "id": null, "findings_path": "triage.json" },
  "findings": [],
  "patches": []
}
```

**Início da execução:**
- Read `.security/state/patch-state.json` se existir.
- Se `status == "complete"` OU arquivo ausente OU `--fresh` em `$ARGUMENTS` → começar do zero. Write estado inicial com `{"status": "running", "phase_done": 0, ...}` para `.security/state/patch-state.json`.
- Se `status == "running"` com `phase_done == N` → retomar. Print `Retomando checkpoint: Fase N concluída`. Pular para Fase N+1.

**Fim de cada fase N:**
Write o estado atualizado (com `phase_done: N` e dados acumulados) para `.security/state/patch-state.json`.

**Fim da execução:**
Write `{"status": "complete", "phase_done": 4, ...}` para `.security/state/patch-state.json`.

---

## Fase 0: Parse de argumentos e validação

### 0a. Parsear `$ARGUMENTS`

Extrair: findings path (primeiro posicional), `--repo` (default `.`), `--top`, `--id`, `--fresh`.
Se nenhum findings path: usar AskUserQuestion para solicitar.

### 0b. Validar o input

Ler o arquivo de findings:

- **`triage.json`** — ler `.findings[]`. **Filtrar por `status == "confirmed"`**. Este é o input canônico: já verificado, deduplicado, ranqueado, com owner.
- **`security-findings.json`** — ler `.findings[]`. Não verificado; print `Warning: security-findings.json não passou por triage. Execute /eng-security-triage primeiro para melhor precisão.` e continuar.
- **JSON genérico** com lista top-level ou array `findings`/`results`/`issues`/`vulnerabilities`.

Print: `N achados confirmados encontrados em <findings_path>`.

**Checkpoint:** Write `.security/state/patch-state.json` com `{"status": "running", "phase_done": 0, "args": {...}}`.

---

## Fase 1: Ingest e normalização

### 1a. Aliases de campos (canônico ← também aceito)

| Canônico         | Também aceitar                                              |
|------------------|-------------------------------------------------------------|
| `file`           | `path`, `location.file`, `filename`                         |
| `line`           | `line_number`, `location.line`, `lineno`                    |
| `category`       | `type`, `cwe`, `rule_id`                                    |
| `severity`       | `severity_rating`, `level`, `priority`, `severity_derived`  |
| `title`          | `name`, `summary`, `message`                                |
| `description`    | `details`, `report`, `body`, `evidence`                     |
| `recommendation` | `fix`, `remediation`, `mitigation`                          |
| `owner_hint`     | `owner`, `component`                                        |

Preservar `id` do triage.json (padrão `F-NNN`). Adicionar `source` (path relativo do arquivo de input).

### 1b. Filtro e ordem

- Se `--id F-NNN`: manter apenas esse achado.
- Se `--top N`: ordenar por `severity` (HIGH > MEDIUM > LOW) depois `exploitability_rank` asc, manter os N primeiros.
- Descartar achados sem `file` (não é possível patchar o que não tem localização). Registrar como `patch_status: "skipped"` com razão `"no source location"`.

### 1c. Localizar o codebase-alvo

Resolver `--repo`. Para os primeiros 5 achados com `file`, verificar se o path resolve sob o repo (tentar como está, depois com prefixos comuns removidos). Se nenhum resolver: **parar** e informar o usuário com sugestão de valor para `--repo`.

**Checkpoint:** Write `.security/state/patch-state.json` com `phase_done: 1` + `findings` normalizados + `skipped`.

---

## Fase 2: Gerar patches (1 subagente por achado)

Um Task por achado, **todos em UMA única mensagem** para execução paralela. `subagent_type: "general-purpose"`. Nunca usar `run_in_background` — você precisa do texto do diff, não de um handle assíncrono.

Cada subagente tem acesso read-only ao `--repo`. Ele não pode modificar o alvo; emite o diff como texto na resposta. O orquestrador escreve esse texto em `PATCHES/bug_NN/patch.diff`.

Se `len(findings) > 40`, fazer batches sequenciais de ~40 achados (cada batch em uma mensagem).

Se algum Task retornar `status: "async_launched"` em vez do texto do subagente, o runtime fez background. Escolher uma recuperação e usar para todo o batch:
- Se notificações de conclusão chegarem na conversa: parsear os blocos tagueados de cada `result` conforme chega. Não encerrar o turno até que todos os achados estejam contabilizados.
- Se notificações não chegarem: re-spawnar os subagentes ausentes em um batch menor (~10) e usar os resultados síncronos.

### Prompt do subagente de patch (montar uma vez, reusar por achado)

```
Você está conduzindo pesquisa de segurança autorizada como parte de uma avaliação defensiva. Sua tarefa: escrever uma correção candidata para UMA vulnerabilidade verificada em uma codebase à qual você tem acesso somente leitura.

Você pode usar Read, Glob e Grep APENAS em paths dentro de {REPO_PATH}. Você NÃO pode compilar, executar, instalar, editar arquivos no disco, ou acessar a rede. Você irá emitir a correção como um diff unificado na sua resposta final; você NÃO vai aplicá-lo.

────────────────────────────────────────────────────────────────────────
ACHADO:

  id:        {id}
  file:      {file}
  line:      {line}
  category:  {category}
  severity:  {severity}
  title:     {title}

  description:
  {description}

  recommendation:
  {recommendation ou "(nenhuma fornecida)"}

────────────────────────────────────────────────────────────────────────
PROCEDIMENTO:

1. LER O CÓDIGO. Abrir {file} na linha {line} e a função em volta.
   Entender o que o código faz — não confiar na descrição do achado como única fonte.

2. CAUSA RAIZ PRIMEIRO. Rastrear de volta do sink citado até onde o valor incorreto ou verificação ausente se origina. A correção geralmente pertence lá, não na linha que o scanner apontou. Nomear a localização da causa raiz (file:line).

3. BUSCA DE VARIANTES. Grep por call sites irmãos com o mesmo padrão. Sua correção deve cobrir todos, ou sua rationale deve explicar por que não.

4. DIFF MÍNIMO. Menor mudança que corrige a causa raiz. Sem refatoração, sem cleanup colateral, sem reformatação, sem mudanças só de comentário. Manter o estilo do código vizinho (posição de chaves, nomenclatura, tratamento de erros).

5. SELF-CHECK ADVERSARIAL. Reler seu diff como atacante. Nomear uma variação de input que atingiria o mesmo estado ruim sem acionar sua mudança. Se conseguir nomear uma, seu fix está na camada errada — voltar ao passo 2.

6. TESTE DE REGRESSÃO. Como parte do diff, adicionar UM caso de teste que falha antes da sua mudança e passa depois — colocado onde o projeto mantém seus testes (procurar test_*/, *_test.*, tests/, spec/). Se não existir diretório de testes, omitir o teste e explicar em <test_note>.

────────────────────────────────────────────────────────────────────────
OUTPUT — sua resposta final DEVE conter exatamente estas tags. Emitir o diff verbatim entre os marcadores; NÃO envolver em ``` fences.

<patch_diff>
--- a/path/to/file
+++ b/path/to/file
@@ ... @@
 linha de contexto
-linha removida
+linha adicionada
</patch_diff>
<rationale>o que mudou e por que, mecanicamente — file:line da causa raiz, o que a mudança garante</rationale>
<variants_checked>pares file:function que você inspecionou para o mesmo padrão, e se cada um precisou da correção</variants_checked>
<bypass_considered>a variação de input que você tentou no passo 5 e por que ela não atinge mais o estado ruim</bypass_considered>
<test_note>onde o teste de regressão foi adicionado, ou por que nenhum foi incluído</test_note>

Se você determinar que o achado NÃO é corrigível como descrito (arquivo errado, código já corrigido, achado é falso-positivo), emitir:

<patch_diff>NONE</patch_diff>
<rationale>por que nenhum patch é apropriado</rationale>
```

### Parsear resultados

De cada resultado de Task, extrair os cinco blocos tagueados. Tolerar whitespace extra, ``` fences extras, e entidades HTML escapadas (`&lt;` `&gt;` `&amp;`).

Se `<patch_diff>` for `NONE` ou vazio: marcar `patch_status: "no_patch"`.
Senão: Write o texto do diff em `./.security/outputs/PATCHES/bug_NN/patch.diff` (NN = índice com zero-pad na ordem ranqueada) e registrar `rationale`, `variants_checked`, `bypass_considered`, `test_note`.

**Checkpoint:** Write `.security/state/patch-state.json` com `phase_done: 2` + array `patches` com resultados parciais.

---

## Fase 3: Review independente (1 subagente por diff)

Um Task por achado com `patch_status == "patched"`, **todos em UMA mensagem**. `subagent_type: "general-purpose"`.

**O reviewer nunca vê `description`, `recommendation` do achado nem a `rationale` do patch author.** Recebe apenas `{file, line, category}` mais os bytes brutos do diff, e re-deriva se o diff é uma correção mínima e no escopo lendo o próprio source. Isso garante que instruções injetadas na prosa do achado não passem pelo seu próprio gate.

### Prompt do reviewer (montar uma vez, reusar por diff)

```
Você está revisando um patch de segurança candidato como um maintainer faria. Você tem acesso somente leitura ao source não-patchado em {REPO_PATH}. Você pode usar Read, Glob, Grep. Você NÃO pode compilar, executar ou aplicar o diff.

Você NÃO viu a descrição do scanner da vulnerabilidade nem o raciocínio do autor do patch. Trabalhe apenas com a localização, a categoria e o diff.

LOCALIZAÇÃO: {file}:{line}
CATEGORIA: {category}

DIFF SOB REVISÃO:
<diff>
{diff_text — ou, para diffs acima de ~50 linhas, substituir este bloco por:
"Leia o diff em ./.security/outputs/PATCHES/bug_NN/patch.diff" e deixar o reviewer fazer o Read}
</diff>

────────────────────────────────────────────────────────────────────────
RESPONDER QUATRO PERGUNTAS:

1. ESCOPO. O diff toca apenas arquivos/funções no caminho entre {file}:{line} e seus callers? Listar qualquer hunk fora desse caminho.

2. SUPRESSÃO. O diff corrige uma causa raiz, ou suprime o sintoma (try/except: pass, early-return em valor mágico, deletar o check que disparou, baixar um log level)?

3. NOVA SUPERFÍCIE. O diff adiciona parsing, confia em um novo campo de input, enfraquece validação em outro lugar, ou remove um check relevante para segurança?

4. ESTILO. 0-10: você faria merge deste diff como está?
   0-3 camada errada / supressão; 4-6 correto mas ruidoso; 7-10 mínimo, direcionado, mantém o estilo do código vizinho.

────────────────────────────────────────────────────────────────────────
Terminar sua resposta com EXATAMENTE:

  REVIEW: ACCEPT | REJECT
  STYLE_SCORE: <0-10>
  OUT_OF_SCOPE_HUNKS: <file:line separados por vírgula, ou none>
  REASON: <2-4 frases citando hunks específicos do diff e linhas do source>

ACCEPT requer: no escopo, correção de causa raiz, sem nova superfície de ataque, style >= 5. Caso contrário REJECT.
```

### Parsear e consolidar

De cada resultado, parsear o bloco final. Anexar `review`, `style_score`, `out_of_scope_hunks`, `review_reason` ao achado. Definir `verified: "static_review_only"` para **todo** resultado estático — o label descreve a classe de verificação, não o resultado.

**Checkpoint:** Write `.security/state/patch-state.json` com `phase_done: 3` + `patches` completos.

---

## Fase 4: Output

### 4a. `patch_result.json` por achado

Para cada achado, Write `./.security/outputs/PATCHES/bug_NN/patch_result.json`:

```json
{
  "id": "F-003",
  "source": "triage.json#2",
  "title": "...",
  "file": "...",
  "line": 0,
  "category": "...",
  "severity": "HIGH",
  "owner_hint": "...",
  "patch_status": "patched|no_patch|skipped",
  "verified": "static_review_only",
  "review": "ACCEPT|REJECT|null",
  "style_score": 0,
  "out_of_scope_hunks": [],
  "rationale": "...",
  "variants_checked": "...",
  "bypass_considered": "...",
  "test_note": "...",
  "review_reason": "..."
}
```

### 4b. `./.security/outputs/PATCHES.json`

Write `./.security/outputs/PATCHES.json`:

```json
{
  "patch_completed": true,
  "repo": "...",
  "input_file": "triage.json",
  "summary": {
    "input_count": 0,
    "patched": 0,
    "no_patch": 0,
    "skipped": 0,
    "accepted": 0,
    "rejected": 0
  },
  "findings": [ { "...": "mesmo shape do patch_result.json" } ]
}
```

### 4c. `./.security/outputs/PATCHES.md` (incremental)

**Passo 1 — header.** Write `./.security/outputs/PATCHES.md` (sobrescreve se existir):

````markdown
# Patches Candidatos

> **Somente revisão estática.** Estes diffs foram criados e revisados por
> agentes independentes lendo o source. Eles NÃO foram compilados, executados
> ou re-atacados. Leia cada diff antes de aplicar — verifique: (1) escopo mínimo,
> (2) causa raiz corrigida (não supressão de sintoma), (3) nenhuma nova superfície de ataque.

**Input:** {findings_path} · **Repo:** {repo} · {N} achados → {M} diffs

---
````

**Passo 2 — por achado** (ordenar: ACCEPT primeiro, depois por severity). Para cada achado, append a `./.security/outputs/PATCHES.md`:

````markdown
## bug_{NN}: [{severity}] {title}  ({id})

`{file}:{line}` · {category} · owner: {owner_hint ou "?"}
**Status:** {verified} · review {review ou "n/a"} · style {style_score ou "n/a"}/10
**Diff:** `.security/outputs/PATCHES/bug_{NN}/patch.diff`

**Rationale:** {rationale}
**Variantes verificadas:** {variants_checked}
**Bypass considerado:** {bypass_considered}
{se review == "REJECT":}
> **Rejeitado pelo reviewer:** {review_reason}
{se out_of_scope_hunks:}
> **Hunks fora do escopo:** {out_of_scope_hunks}

---
````

**Passo 3 — rodapé.** Append tabela `## Skipped` para achados sem `file` ou `patch_status == "no_patch"`, uma linha cada com a razão.

**Checkpoint final:** Write `.security/state/patch-state.json` com `{"status": "complete", "phase_done": 4, ...}`.

### 4d. Sumário terminal

Máximo ~10 linhas:

```
Patches gerados (modo estático): {N} achados → {M} diffs.

  Aceitos:    {n}   {título do top aceito}
  Rejeitados: {n}
  Sem patch:  {n}
  Skipped:    {n}

Escrito em ./.security/outputs/PATCHES/bug_NN/, ./.security/outputs/PATCHES.md, ./.security/outputs/PATCHES.json
Estes são rascunhos. Revise cada diff antes de aplicar.
```

---

## Guard Rails

- **O skill nunca aplica diffs.** Sem `git apply`, sem `patch`, sem Edit contra `--repo`. Se parecer necessário, o design está errado.
- **Write somente em `./.security/outputs/PATCHES/` e `.security/state/`.**
- **Isolamento do reviewer.** O prompt do reviewer recebe `{file, line, category, diff}` e nada mais do achado. Não passar `description`, `recommendation` nem a `rationale` do autor do patch.
- **Todos os Task calls de uma fase em UMA mensagem.** Spawn serial está correto mas N× mais lento.
- **`verified: "static_review_only"` sempre** em modo estático, independente de ACCEPT/REJECT.
- **Checkpoint antes de iniciar a próxima fase**, sempre.
- **Input canônico é `triage.json` com `status == "confirmed"`.** Patchar achado não-verificado gasta tokens em falso-positivo.

---

## Pipeline completo

```
/eng-threat-model → /eng.security-audit → /eng-security-triage → /eng-security-patch
    (mapa)              (scan guiado)         (verifica+ranqueia)     (fix candidato)
```

Schemas de todos os artefatos em `docs/SECURITY-ARTIFACTS-SCHEMA.md`.
