# Gate 0 — Pré-requisitos de eng.plan, eng.work, eng.pre-pr e eng.pr

Lida pela rule de cada um desses comandos antes de qualquer ação. Se qualquer condição falhar, o comando para imediatamente.

### Regra 0.1 — TASK_MANAGER_KEY obrigatório

Ler `TASK_MANAGER` do ENV.md. Ver `eng.integrations-rules.md` (freelance vs board).

Se `$ARGUMENTS` não trouxer o key: **perguntar e aguardar**. Não inventar. Não exigir `XXX-000`.

- Freelance (`TASK_MANAGER` vazio): *Qual o seu número de controle para esta tarefa?*
- Com board: *Qual o id do card no {TASK_MANAGER}?*

Sem resposta → **PARAR**. Com resposta → seguir (pasta da sessão em lowercase; o nome da branch segue a skill `eng-global-branch`).

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

Branch esperada: no padrão da skill eng-global-branch (ex.: feature/{TASK_MANAGER_KEY}-{titulo} ou {TASK_MANAGER_KEY}-{titulo})
```

**→ PARAR. Não executar nenhuma fase.**

### Regra 0.3 — Branch deve corresponder ao TASK_MANAGER_KEY

Se a branch atual **não contém** o `{TASK_MANAGER_KEY}` no nome (GitHub/GitLab: o número, sem `#`):

```
⚠️ ATENÇÃO: A branch atual ({BRANCH_ATUAL}) não corresponde à tarefa {TASK_MANAGER_KEY}.

  Branch atual:  {BRANCH_ATUAL}
  Esperado:      branch contendo {TASK_MANAGER_KEY} (padrão da skill eng-global-branch, ex.: feature/{TASK_MANAGER_KEY}-{titulo})

Confirmar que está na branch certa? (s/n)
```

**→ Aguardar confirmação explícita antes de prosseguir.**

O nome é montado pela skill `eng-global-branch` (ou pelo fork dela no overlay da empresa). No freelance sem número de controle, a branch não tem chave e esta confirmação é esperada.

---
