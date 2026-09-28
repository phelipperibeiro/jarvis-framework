---
trigger: always_on
---

> **Applies to:** HUB: all | POSITION: all | AREA: ENGINEERING | SQUAD: all

# Regras do Workflow Pre-PR

## Propósito

O workflow `pre-pr` valida a branch antes de abrir um Merge Request — revisão de código, testes, documentação e qualidade.

---

## ⛔ Gate 0: Pré-requisitos Obrigatórios

> Esta regra é executada **antes de qualquer ação**. Se qualquer condição falhar, o workflow para imediatamente.

### Regra 0.1 — TASK_MANAGER_KEY obrigatório

Ler `TASK_MANAGER` do ENV.md. Ver `eng.integrations-rules.md` (freelance vs board).

Se `$ARGUMENTS` não trouxer o key: **perguntar e aguardar**. Não inventar. Não exigir `XXX-000`.

- Freelance (`TASK_MANAGER` vazio): *Qual o seu número de controle para esta tarefa?*
- Com board: *Qual o id do card no {TASK_MANAGER}?*

Sem resposta → **PARAR**. Com resposta → seguir (pasta/branch em lowercase).

### Regra 0.2 — Proibido executar em branch protegida

Verificar branch atual:

```bash
git branch --show-current
```

Se for `main`, `master`, `develop`, `staging` ou `homolog`:

```
🚫 BLOQUEADO: Você está em uma branch protegida ({BRANCH_ATUAL}).

Este workflow só pode ser executado em uma branch de feature.
Execute /eng.start {TASK_MANAGER_KEY} primeiro para criar a branch correta.

Branch esperada: {TASK_MANAGER_KEY}-{titulo-kebab-case}
```

**→ PARAR. Não executar nenhuma fase.**

### Regra 0.3 — Branch deve corresponder ao TASK_MANAGER_KEY

Se a branch atual **não contém** o `{TASK_MANAGER_KEY}` no nome:

```
⚠️ ATENÇÃO: A branch atual ({BRANCH_ATUAL}) não corresponde à tarefa {TASK_MANAGER_KEY}.

  Branch atual:  {BRANCH_ATUAL}
  Esperado:      branch contendo {TASK_MANAGER_KEY}

Confirmar que está na branch certa? (s/n)
```

**→ Aguardar confirmação explícita antes de prosseguir.**

---

## Regras de Validação

### Escopo de Análise

Avaliar **apenas** as mudanças da branch atual em relação ao branch base (`main`/`develop`):

```bash
git diff main...HEAD
```

### Evidências Obrigatórias

Ao citar "testes passando" ou "validações OK", incluir:
- Qual comando foi executado
- Output do resultado (ou smoke test manual se não houver suíte)

### Revalidação após Mudanças

Se qualquer gate levar a mudanças de código, reexecutar obrigatoriamente:
- Revisão técnica do código alterado
- Testes/validações

---

## Saída Final Obrigatória

O workflow **deve sempre** terminar com:

1. **Semáforo de status**:
   - 🟢 Green: pronto para PR
   - 🟡 Yellow: pode abrir PR com ressalvas documentadas
   - 🔴 Red: bloqueado — listar o que impede o PR

2. **Comentário no card** com o status final (via `/eng-task-comment`) — pular se freelance

3. **Aguardar permissão explícita** do usuário para prosseguir para `/eng.pr`
