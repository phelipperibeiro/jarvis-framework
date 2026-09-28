---
period: "{Sprint N / Release X.Y}"
squad: "{SQUAD}"
version: "1.0"
status: Draft
---

# Template — Relatório de Qualidade por Sprint/Release

Relatório consolidado de qualidade para o período. Gerado pelo skill `eng-qa-quality-report`
a partir das sessões exploratórias, bug reports e quality gates do período.

---

## Cabeçalho

```markdown
**Relatório**: QA-REPORT-{SQUAD}-{PERIODO}
**Período**: {Sprint N / Release X.Y} — {YYYY-MM-DD} a {YYYY-MM-DD}
**Squad**: {SQUAD}
**QA Responsável**: {nome(s)}
**Gerado em**: {YYYY-MM-DD}
```

---

## Resumo Executivo

> 3–5 linhas — visão geral da saúde de qualidade do período.

{Síntese do período: principais entregas validadas, riscos encontrados, tendências observadas.}

---

## Métricas do Período

### Volume de Testes

| Tipo | Qtd | vs. Período Anterior |
|------|-----|----------------------|
| Sessões exploratórias realizadas | {N} | {+N / -N / igual} |
| Quality gates validados | {N} | |
| Testes E2E adicionados/atualizados | {N} | |
| Bugs reportados (total) | {N} | |

### Distribuição de Bugs por Severidade

| Severidade | Encontrados | Resolvidos | Em aberto |
|------------|------------|------------|-----------|
| S1 — Crítico | {N} | {N} | {N} |
| S2 — Alto | {N} | {N} | {N} |
| S3 — Médio | {N} | {N} | {N} |
| S4 — Baixo | {N} | {N} | {N} |
| **Total** | **{N}** | **{N}** | **{N}** |

### Quality Gates

| Status | Qtd | % do total |
|--------|-----|------------|
| ✅ Conforme (100%) | {N} | {%} |
| ⚠️ Parcial (50–99%) | {N} | {%} |
| 🚫 Bloqueado (< 50%) | {N} | {%} |

---

## Features Validadas

| Feature / Task | QG | Sessões | Bugs S1/S2 | Status |
|---------------|-----|---------|------------|--------|
| {nome} | ✅/⚠️/🚫 | {N} | {N} | Aprovado / Pendente / Bloqueado |

---

## Bugs em Destaque

### S1 — Críticos

> Listar todos os S1 do período — mesmo os já resolvidos.

| ID | Título | Descoberto em | Resolvido? | Tempo de resolução |
|----|--------|--------------|------------|-------------------|
| {ID} | {título} | {sessão / quality gate} | Sim / Não | {horas/dias} |

### S2 — Altos em Aberto

| ID | Título | Área | Há quanto tempo |
|----|--------|------|----------------|
| {ID} | {título} | {área} | {N dias} |

---

## Tendências

### Áreas com Maior Concentração de Bugs

| Área / Módulo | Bugs no período | Tendência |
|---------------|----------------|-----------|
| {módulo} | {N} | ↑ aumentando / → estável / ↓ melhorando |

### Observações de Processo

- {O que funcionou bem neste período}
- {O que pode melhorar}
- {Risco identificado para o próximo período}

---

## Cobertura de Testes E2E

| Domínio | Specs ativas | Cobertura estimada | Gaps identificados |
|---------|-------------|--------------------|--------------------|
| {domínio} | {N} | Alta / Média / Baixa | {o que falta} |

---

## Recomendações para o Próximo Período

| Prioridade | Ação | Responsável sugerido |
|------------|------|----------------------|
| Alta | {ação específica} | QA / Dev / PM |
| Média | {ação} | |
| Baixa | {ação} | |

---

## Sessões Realizadas (referência)

| Sessão ID | Feature | Duração | Bugs | Charter |
|-----------|---------|---------|------|---------|
| EXP-{ID} | {feature} | {min} | S1={N} S2={N} | ✅/⚠️/❌ |
