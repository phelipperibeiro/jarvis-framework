---
description: Orquestrador do pipeline defensivo de segurança — encadeia threat-model, audit, triage e patch em um único fluxo guiado
globs:
  alwaysApply: false
recommended_model: claude-opus-4-6-20250529
model_tier: very_high
model_justification: Orquestração do pipeline completo exige raciocínio profundo para avaliar estado, decidir fases e interpretar outputs encadeados
---

# Workflow de Engenharia – Security Pipeline (Orquestrador)

## Objetivo

Guiar o SENTINEL pelo pipeline defensivo completo de segurança, encadeando os 4 estágios em um fluxo único. Elimina a necessidade de lembrar a sequência de comandos — o usuário informa onde quer começar e o orquestrador conduz.

---

## Quando Usar Este Workflow

- Auditoria de segurança completa de um projeto ou feature
- Retomada de pipeline interrompido em sessão anterior
- Onboarding de segurança em projeto sem histórico de audit
- Quando o usuário pede "auditar segurança", "pipeline completo" ou "fechar o loop"

---

## Passo 0 — Detectar estado do pipeline

Antes de perguntar qualquer coisa, verificar o que já existe:

```bash
# Artefatos de output
ls .security/outputs/ 2>/dev/null
# State de sessões anteriores
ls .security/state/ 2>/dev/null
```

| Artefato encontrado | Fase concluída |
|---------------------|----------------|
| `THREAT_MODEL.md` | Estágio 1 feito |
| `security-findings.json` | Estágio 2 feito |
| `triage.json` | Estágio 3 feito |
| `PATCHES/` com conteúdo | Estágio 4 feito |

Exibir o estado detectado antes de mostrar o menu.

---

## Passo 1 — Menu de entrada

```
Pipeline de Segurança — SENTINEL

Estado atual:
  [✓/–] Estágio 1: Threat Model   (.security/outputs/THREAT_MODEL.md)
  [✓/–] Estágio 2: Audit           (.security/outputs/security-findings.json)
  [✓/–] Estágio 3: Triage          (.security/outputs/triage.json)
  [✓/–] Estágio 4: Patch           (.security/outputs/PATCHES/)

Onde iniciar?

1. Completo    — estágio 1 → 2 → 3 → 4
2. Audit+      — estágio 2 → 3 → 4  (já tenho ou pulo threat model)
3. Triage+     — estágio 3 → 4       (já tenho security-findings.json)
4. Só patch    — estágio 4            (já tenho triage.json)
5. Retomar     — continuar de onde parou (detectar pelo state/)
```

> Se todos os artefatos existem, perguntar: "Pipeline completo encontrado. Reexecutar do início (--fresh) ou revisar outputs existentes?"

---

## Passo 2 — Executar os estágios selecionados

Executar cada estágio em sequência. Ao final de cada um, confirmar com o usuário antes de prosseguir para o próximo.

---

### Estágio 1 — Threat Model (`/eng-threat-model`)

**Skill**: `$IDE/skills/eng-threat-model/SKILL.md`

Perguntar modo de operação:
```
Modo do threat model:
1. bootstrap            — deriva o modelo do código automaticamente
2. interview            — walk interativo com você como owner do sistema
3. bootstrap-then-interview — bootstrap primeiro, entrevista refinadora depois
```

Invocar o skill com o modo escolhido. Output esperado: `.security/outputs/THREAT_MODEL.md`.

Ao concluir:
```
✓ Threat model gerado em .security/outputs/THREAT_MODEL.md
  Ameaças identificadas: {N}
  Areas priorizadas para audit: {lista de focus-areas}

Prosseguir para Estágio 2 (Audit)? [s/n]
```

---

### Estágio 2 — Security Audit (`/eng.security-audit`)

**Workflow**: `$IDE/workflows/engineering/eng.security-audit.md`

Passar `THREAT_MODEL.md` como contexto se existir (Fase 0.5 do audit).

Perguntar escopo se não informado:
```
Escopo do audit:
1. Projeto completo (--all)
2. Pasta específica (ex: ./src/auth/)
3. Focus específico (owasp | secrets | supply-chain | headers | compliance)
```

Output esperado: `.security/outputs/security-findings.json` + `security-audit-report.md`.

Ao concluir:
```
✓ Audit concluído
  Achados brutos: {N}
  Distribuição: CRITICAL {n} | HIGH {n} | MEDIUM {n} | LOW {n}
  Output: .security/outputs/security-findings.json

Prosseguir para Estágio 3 (Triage)? [s/n]
```

> Se N == 0: informar "Nenhum achado encontrado. Pipeline encerrado." e parar.

---

### Estágio 3 — Triage (`/eng-security-triage`)

**Skill**: `$IDE/skills/eng-security-triage/SKILL.md`

Input: `.security/outputs/security-findings.json`

Perguntar modo:
```
Modo de triage:
1. --auto    — sem perguntas interativas (recomendado para pipelines CI)
2. interativo — coleta contexto de trust boundary e tolerância a ruído
```

Output esperado: `.security/outputs/triage.json`

Ao concluir:
```
✓ Triage concluído
  Achados confirmados: {N}  |  Falsos positivos descartados: {N}
  Top 3 por exploitabilidade: {lista}
  Output: .security/outputs/triage.json

Prosseguir para Estágio 4 (Patch)? [s/n]
```

> Se N confirmados == 0: informar "Nenhum achado confirmado após triage. Pipeline encerrado." e parar.

---

### Estágio 4 — Patch (`/eng-security-patch`)

**Skill**: `$IDE/skills/eng-security-patch/SKILL.md`

Input: `.security/outputs/triage.json`

Perguntar escopo:
```
Gerar patches para:
1. Todos os achados confirmados
2. Apenas top N (ex: top 3 por severidade)
3. Achado específico (ID F-NNN)
```

Output esperado: `.security/outputs/PATCHES/bug_NN/{patch.diff, patch_result.json}` + `PATCHES.md`

Ao concluir:
```
✓ Pipeline de segurança concluído

Resumo:
  Threat model : .security/outputs/THREAT_MODEL.md
  Achados audit: .security/outputs/security-findings.json  ({N} achados)
  Triage       : .security/outputs/triage.json              ({N} confirmados)
  Patches      : .security/outputs/PATCHES/                 ({N} diffs gerados)
  Relatório    : .security/outputs/security-audit-report.md

Próximos passos para o TL:
  1. Revisar diffs em .security/outputs/PATCHES/
  2. Aplicar patches aprovados: git apply .security/outputs/PATCHES/bug_NN/patch.diff
  3. Criar cards no $TASK_MANAGER para achados sem patch (no_patch)
  4. Commitar .security/outputs/ (excluir .security/state/ via .gitignore)
```

---

## Regras

### Nunca
- Pular a confirmação do usuário entre estágios sem `--auto` explícito
- Avançar para Estágio 4 sem triage (patches gerados de achados não verificados têm alta taxa de erro)
- Aplicar diffs automaticamente — output é sempre texto inerte para revisão humana

### Sempre
- Detectar estado existente antes de mostrar o menu
- Informar quantos achados passaram de cada estágio
- Parar o pipeline se nenhum achado sobreviver a um estágio (audit vazio ou triage sem confirmados)
- Sugerir `.gitignore` para `.security/state/` se não estiver ignorado
