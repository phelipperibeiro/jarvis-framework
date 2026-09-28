---
name: eng-security-triage
description: >-
  Triage de achados de seguranca. Consome um ou mais security-findings.json (output de
  eng.security-audit ou eng.security-review), deduplica em 2 passadas (deterministica +
  semantica), verifica cada achado com N votos independentes, re-rankeia por exploitabilidade
  e escreve triage.json. Use apos eng.security-audit ou eng.security-review.
argument-hint: "<findings-file> [<findings-file2> ...] [--auto] [--votes N]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - AskUserQuestion
  - Task
  - Bash(git log:*)
  - Bash(find:*)
---

# eng-security-triage

Recebe o output bruto do scan (`security-findings.json`) e produz lista limpa, verificada e ranqueada (`triage.json`).

**Problema que resolve:** scanners de seguranca tem alta taxa de falso-positivo (~45%) e achados duplicados entre focus areas. Triage resolve em 4 fases: normalizar → deduplicar → verificar com N votos → re-rankear por exploitabilidade.

**Subagentes de verificacao rodam sem MCP** — apenas o texto do achado como contexto. Menos tool = veredicto mais deterministico, mais barato, sem distração por acesso ao codigo.

---

## Checkpointing

Em lotes grandes (>20 achados × N votos), a triage pode esgotar contexto ou atingir rate limit mid-run.
Estado persiste em `.security/state/` via Write tool — sem dependencia de Python.

**Verificacao de resume (sempre antes do Step 0):**

Verificar se `.security/state/triage-state.json` existe.
- Nao existe ou `--fresh` em `$ARGUMENTS`: fresh start.
- `status == "running"` com `phase_done == N`: ler `.security/state/triage-phase-N.json` e pular direto para Fase N+1.
- `status == "complete"`: fresh start.

**Ao final de cada fase N:** dois Writes:
1. `.security/state/triage-phase-N.json` — estado completo da fase (achados com campos preenchidos ate aqui).
2. `.security/state/triage-state.json` — `{"status": "running", "phase_done": N}`.

**Ao escrever o `triage.json` final:**
`.security/state/triage-state.json` → `{"status": "complete", "phase_done": 6}`.

`.security/state/` e scratch — adicionar ao `.gitignore` do projeto.

---

## Step 0 — Entrevista (pular com `--auto`)

Antes de processar, coletar contexto via `AskUserQuestion`:

1. **Fronteira de confianca:** "Qual a fronteira de confianca do sistema? (ex: usuarios autenticados podem fazer upload, mas nao modificar dados de outros)"
2. **Threat model:** "Existe `THREAT_MODEL.md`? Qual o path? (ou 'nao existe')"
3. **Tolerancia a ruido:** "Preferencia de precisao? `low` (menos falsos positivos) | `medium` (default) | `high` (manter tudo duvidoso para revisao humana)"
4. **Padrao de score:** "Usar CVSS (impacto x likelihood) ou `exploitability-first` (priorizar por facilidade de exploracao)?"

`--auto`: pular entrevista — defaults: `noise_tolerance=medium`, `scoring=exploitability-first`, threat model = buscar `THREAT_MODEL.md` na raiz.

Salvar respostas em `.security/state/triage-context.json` para sobreviver a compactacao.

---

## Fase 1 — Normalizar

1. Ler todos os `security-findings.json` passados como argumento.
2. Flatten em lista unica de achados.
3. Normalizar IDs para `F-001`, `F-002`, ... (ordenado por impact desc, likelihood desc, file, linha).
4. Registrar `input_files[]` e `total_input` para o `summary` final.

Se um arquivo nao existir ou nao for JSON valido: reportar ao usuario e continuar com os restantes.

---

## Fase 2 — Deduplicar

**Passada 1 — Deterministica:**
Agrupar achados onde:
- Mesmo `file`
- Mesma `category`
- `line` dentro de ±10 linhas entre si

Para cada grupo: manter o achado com `description` mais longa (mais informativo). Registrar descartados com `dedup_group: <id do canonico>`.

**Passada 2 — Semantica:**
Para pares que sobreviveram a passada 1 com mesma `category` mas arquivos diferentes ou linha fora do range, spawnar 1 subagente de comparacao (sem MCP):

```
Dois achados de seguranca. Corrigir um necessariamente corrige o outro?

ACHADO A: {title_a} em {file_a}:{line_a}
Descricao: {description_a}

ACHADO B: {title_b} em {file_b}:{line_b}
Descricao: {description_b}

Responda exatamente:
is_duplicate: true | false
reasoning: <uma linha>
```

Se `is_duplicate: true`: manter o de maior `confidence`, descartar o outro com `dedup_group`.
Incrementar `duplicates_removed` no `summary`.

---

## Fase 3 — Verificacao Multi-Voto

Para cada achado nao-descartado, spawnar **N subagentes de voto independentes** (default N=3; sobrescrever com `--votes N`).

Cada subagente recebe apenas o texto do achado — **sem acesso ao codigo-fonte, sem MCP**:

```
Voce e um revisor de seguranca independente. Avaliar este achado:

ID: {id}
TITULO: {title}
CATEGORIA: {category} ({file}:{line})
IMPACTO: {impact} | LIKELIHOOD: {likelihood}

DESCRICAO:
{description}

EVIDENCIA:
{evidence}

FRONTEIRA DE CONFIANCA DO SISTEMA: {trust_boundary}

Sua postura padrao: o scanner esta ERRADO. Re-derive a conclusao a partir da descricao e evidencia fornecidas.

REGRAS DE EXCLUSAO — se o achado se encaixa em qualquer uma, e FALSO POSITIVO mesmo que tecnicamente preciso:

  1. DoS volumetrico ou rate-limiting ausente (tratado na camada de infraestrutura). ReDoS, complexidade algoritmica e recursao ilimitada SAO findings validos.
  2. Codigo de teste, codigo morto, codigo de exemplo/fixture ou crash sem impacto de seguranca.
  3. Comportamento intencional do design (middleware de compressao, algoritmo fraco oferecido ao lado de um forte com opt-in).
  4. Memory-safety em linguagens memory-safe fora de blocos unsafe/FFI.
  5. SSRF onde o atacante controla apenas o path, nao o host ou protocolo.
  6. Input de usuario fluindo para prompt de IA/LLM (prompt injection nao e vulnerabilidade de codigo no alvo).
  7. Path traversal em object storage (S3/GCS) onde ../ nao escapa uma fronteira de confianca.
  8. Inputs confiaveis usados como vetor (env vars, flags CLI definidos pelo operador), a menos que o sistema marque-os como nao-confiaveis.
  9. Codigo client-side flagrado para classes de vulnerabilidade server-side.
 10. Versoes desatualizadas de dependencias (gerenciado por processo separado; use npm audit para isso).
 11. Randomness fraca usada para fins nao-seguranca (jitter, shuffling, fallbacks de dev).
 12. Issues de baixo impacto: log spoofing, CSRF em logout, self-XSS, open redirect, tabnabbing, injecao de regex.
 13. Gap de hardening sem caminho de exploit concreto: headers de seguranca ausentes, sem audit logging, config permissiva nao alcancada por input nao-confiavel.
 14. XSS em framework com auto-escape padrao (React, Angular, Vue, Jinja2 autoescape=on) a menos que o sink seja escape hatch de HTML raw (dangerouslySetInnerHTML, v-html, |safe).
 15. Identificadores construidos para serem inesgotaveis (UUIDv4, tokens de 128+ bits aleatorios) flagrados como "previsiveis" ou "precisam de validacao".
 16. Race conditions ou TOCTOU apenas teoricos — sem janela realista ou sem mudanca de estado com relevancia de seguranca entre check e use.

Este achado e real e exploravel dado a fronteira de confianca declarada? Avalie contra as regras acima e a evidencia fornecida.

Responda exatamente:
verdict: confirmed | rejected | inconclusive
verify_verdict: exploitable | mitigated | needs_manual_test
  exploitable: caminho de ataque realista, sem mitigacao efetiva
  mitigated: achado real mas controle existente reduz o risco (nomear o controle no reasoning)
  needs_manual_test: conclusao depende de comportamento runtime — recomendar PoC humano
  (para verdict=rejected: sempre needs_manual_test)
reasoning: <uma linha — citar regra de exclusao se aplicavel, ex: "Regra 1: DoS volumetrico">
confidence: <0.0-1.0>
```

**Consolidacao:**

| Votos confirmed | Resultado | Status final |
|---|---|---|
| >= ceil(N/2) confirmed | Confirmado | `confirmed` |
| >= ceil(N/2) rejected | Falso positivo | `rejected` |
| Outro | Inconcluso | `inconclusive` |

Registrar `vote_result{votes_total, votes_confirmed, verdict, reasoning}` em cada achado.
`verify_verdict` do achado: valor modal entre os votos (se todos rejected: `needs_manual_test`).
Incrementar `rejected_by_vote` no `summary`.

---

## Fase 4 — Re-rankear por Exploitabilidade

Ordenar achados `confirmed` e `inconclusive` por exploitability score (1 subagente por achado, sem MCP):

```
Dado este achado confirmado:
{id} | {title} | {category}
impact (scanner): {impact} | likelihood: {likelihood}
trust_boundary: {trust_boundary}
verify_verdict: {verify_verdict}

PASSO 1: Listar TODAS as pre-condicoes para exploracao (estado de auth, configuracao especifica, posicao de rede, janela de race).

PASSO 2: Identificar nivel de acesso minimo necessario:
  unauthenticated_remote | authenticated | local | physical

PASSO 3: Derivar severidade — aplicar tabela e tomar o resultado MENOR:
  | Pre-condicoes | Acesso                 | Severidade |
  | 0             | unauthenticated_remote | HIGH       |
  | 1-2           | authenticated          | MEDIUM     |
  | 3+            | local / sem demo path  | LOW        |
  Exemplo: 0 pre-condicoes mas so authenticated → MEDIUM, nao HIGH.

PASSO 4: Comparar com impact declarado pelo scanner (severity_alignment -5..+5):
  +3..+5 justificado ou subestimado | 0..+2 adequado | -1..-3 inflado | -4..-5 muito inflado

PASSO 5: Score de explorabilidade 1-10 para desempate no ranking:
  10=trivial, tooling publico; 7-9=habilidade media; 4-6=conhecimento especializado; 1-3=acesso privilegiado

Responda exatamente:
preconditions: <lista separada por ponto e virgula>
access_level: <unauthenticated_remote|authenticated|local|physical>
severity_derived: <HIGH|MEDIUM|LOW>
severity_alignment: <-5..+5>
exploitability_score: <1-10>
reasoning: <uma linha>
```

Ordenar por `severity_derived` (HIGH > MEDIUM > LOW) → `exploitability_score` desc → `impact` desc → `likelihood` desc.
Atribuir `exploitability_rank` (1 = mais critico).

---

## Fase 5 — Atribuicao de Owner

Para cada achado `confirmed` ou `inconclusive`, identificar o dono mais especifico inferivel. Parar na primeira regra que produzir resultado:

1. **CODEOWNERS**: buscar `CODEOWNERS`, `.github/CODEOWNERS`, `docs/CODEOWNERS` no repo. Se encontrado, fazer match do `file` do achado contra os padroes (ultimo match vence). Registrar como `"CODEOWNERS: <padrao> → <owner(s)>"`.

2. **git log**: executar `git log --format='%an' -n 50 -- "{file}" | sort | uniq -c | sort -rn | head -3`. Registrar como `"top committer: <nome> (<n>/<total> commits recentes); sem entrada CODEOWNERS"`.

3. **Fallback de modulo**: registrar como `"componente: <diretorio-raiz do file>/; sem CODEOWNERS ou historico git"`.

Salvar como `owner_hint` no achado. Para achados `rejected` ou `duplicate`: `owner_hint: null`.

---

## Step 2 — Escrever output

Ler `docs/SECURITY-ARTIFACTS-SCHEMA.md` secao 3 antes de escrever.

Escrever `.security/outputs/triage.json`. Criar `.security/outputs/` se não existir.

Salvar `.security/state/triage-meta.json`:

```json
{
  "triage_date": "<ISO-8601>",
  "input_files": ["<path>"],
  "total_input": 0,
  "confirmed": 0,
  "top_finding": "<F-001: titulo>"
}
```

---

## Step 3 — Sumario ao usuario

Apos escrever:

1. Path do `.security/outputs/triage.json`.
2. Tabela: top 5 por `exploitability_rank` (id, titulo, categoria, file:line, impact, rank, owner_hint).
3. Contadores: `{total_input} input → {duplicates_removed} dedup → {rejected_by_vote} rejeitados por voto → {confirmed} confirmados`.
4. Achados `inconclusive`: listar ids para revisao humana.
5. Proximo passo: *"Achados confirmados prontos para cards no $TASK_MANAGER."*
