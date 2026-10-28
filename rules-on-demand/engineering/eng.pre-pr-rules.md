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

### Só revisar

O `eng.pre-pr` **aponta lacunas e não corrige nada**: não altera código, não escreve testes, não atualiza documentação e não publica no Central docs. Quem decide o que ajustar é o usuário.

### Escopo de Análise

Avaliar **apenas** as mudanças da branch atual em relação à branch base (`Branch base:` do `architecture.md`; sem ele, perguntar):

```bash
git diff {BRANCH_BASE}...HEAD
```

Da rodada 2 em diante, cada gate roda só se o diff desde o `Commit:` da rodada anterior tocar o que ele lê (seção "Rodada incremental" do `eng.pre-pr.md`). O gate que roda continua revisando a branch inteira.

### Evidências Obrigatórias

Cada lacuna cita onde está (`arquivo:linha`) ou o comando que a revelou e o resultado.

---

## Saída Final Obrigatória

O workflow **deve sempre** terminar com:

1. **`gate-checklist.md`** em `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/`:
   - semáforo (🟢 / 🟡 / 🔴), resumo (com a linha `Critério de parada:`), lacunas por área (o quê, onde, por que importa, sugestão, severidade, **Decisão**), evidências e PR Brief (com as rodadas por severidade, a rodada em que o critério de parada agiu e os ajustes do `architecture.md` e do `plan.md` antes da aprovação).
   - `Rodada` e `Commit` no cabeçalho, as rodadas anteriores e, da rodada 2 em diante, a resolução das lacunas da rodada anterior.
   - Da rodada 2 em diante, as áreas cujos gates não rodaram na rodada incremental, marcadas como "Não reavaliada nesta rodada".
   - É sempre a rodada mais recente: ao rodar de novo na mesma sessão, o relatório existente é preservado como `gate-checklist-rodada-{N}.md` (seção "Rodadas" do `eng.pre-pr.md`). **Nunca** sobrescrever nem apagar uma rodada; renomear imediatamente antes de gravar.
2. **Decisões do usuário** gravadas na coluna Decisão (🔧 Corrigir / 👍 Aceitar + motivo; vazia se o usuário escolheu "Só gerar o relatório", exceto as decisões herdadas da rodada anterior). As ⚪ aceitas na variante B do fechamento levam `👍 Aceitar: aceito no fechamento da rodada {N}`.
   - **Critério de parada** (seção "Fechamento" do `eng.pre-pr.md`): teto de rodadas pela urgência do `context.md` (`alta` 3, `normal` 5, `baixa` 8) ou rodada sem lacuna 🔴 ou 🟡 nova. Ele muda a pergunta do fechamento (variante B, com "Aceitar as ⚪ e seguir para o PR" como padrão); nunca pula a revisão nem a gravação. Com 🔴 pendente, o ciclo segue na variante A, com aviso quando o teto foi atingido.
3. **Pergunta** (`AskUserQuestion`) sobre registrar o resultado como comentário no card (`/eng-global-task-comment`): Não, manter só na sessão (como hoje) / Sim, só o resumo / Sim, o relatório completo. Nunca publicar sem a resposta. Freelance: não pergunta, só na sessão.
4. **Aguardar permissão explícita** do usuário para prosseguir para `/eng.pr`.
