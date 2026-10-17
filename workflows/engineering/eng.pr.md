---
description: Gera o pull-request.md na sessão e, com o Sim do usuário, faz o push e abre o merge request (MR)
auto_execution_mode: 3
agent: "$IDE/agents/engineering/eng.agent.md"
rules_file: "$IDE/rules-on-demand/engineering/eng.pr-rules.md"
template_file: "$IDE/templates/engineering/PR-template.md"
recommended_model: claude-sonnet-4-20250514
model_tier: medium
model_justification: Operações Git e preenchimento de templates são tarefas estruturadas que não requerem raciocínio extremamente complexo
---

# Pull Request / Merge Request

Este comando cria a **branch, commita as alterações e abre um Merge Request**.

> 📋 **Rules**: `$IDE/rules-on-demand/engineering/eng.pr-rules.md` — **antes de começar, leia esse arquivo e siga-o**: ele não é carregado automaticamente no início da sessão.
> 📤 **Template**: `$IDE/templates/engineering/PR-template.md`
> 🔀 **Transições**: `$IDE/rules-on-demand/engineering/eng.transitions-rules.md` — perguntas de início e de fim deste comando (a opção padrão mantém o fluxo de sempre).

## Skills recomendados

- **pr**: siga o playbook do skill para padronizar branch, commits e MR.
  - Arquivo: `$IDE/skills/eng-global-pr/SKILL.md`
- **eng-qa-planner**: se precisar validar lacunas de testes antes de abrir o MR — se a especialização estiver registrada em `QA_SPECIALIZATIONS`. Sem ela, use a base `eng-qa` diretamente.
  - Arquivo: `$IDE/skills/eng-qa-planner/SKILL.md`
- **eng-qa** + a especialização registrada em `QA_SPECIALIZATIONS` (se houver uma): para validar fluxos de usuário críticos ou executar testes automatizados antes de abrir o MR.
  - Arquivo: `$IDE/skills/eng-qa/SKILL.md`
- **eng-global-docs-write**: se houver necessidade de atualizar documentação junto do PR.
  - Arquivo: `$IDE/skills/eng-global-docs-write/SKILL.md`

## Agentes recomendados (opcional)

- **eng.qa.test-planner**: para análise detalhada de cobertura antes do MR.
  - Arquivo: `$IDE/agents/engineering/qa/eng.qa.test-planner.md`
  - Quando usar: Se houver dúvidas sobre cobertura de testes ou mudanças significativas.

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| Cabeçalho (agente) | `eng.agent` (agente) | Sempre — identidade do workflow |
| Skills recomendados | `/eng-global-pr` | Sempre — seguir o playbook do skill para padronizar branch, commits e MR |
| Skills recomendados | `/eng-qa-planner` | Se for preciso validar lacunas de testes antes de abrir o MR **e** a especialização estiver registrada em `QA_SPECIALIZATIONS` |
| Fase 1 › 1.4 Executar Testes Automatizados (Opcional) | `/eng-qa` + `QA_SPECIALIZATIONS` | Passo opcional, recomendado em mudanças significativas |
| Skills recomendados | `/eng-global-docs-write` | Se houver necessidade de atualizar documentação junto do PR |
| Agentes recomendados (opcional) | `eng.qa.test-planner` (agente) | Se houver dúvidas sobre cobertura de testes ou mudanças significativas |
| Fase 4 › 4.4 Criar MR/PR via adapter | `jarvis vcs create-merge` (CLI do Jarvis) | Só se a escolha da Fase 0 for publicar (4.3): abre o MR/PR conforme `VERSION_CONTROL` ou o host do `origin` |
| Fase 5 › 5.2 Link do MR | `/eng-global-task-comment` | Depois de o MR ser criado (só ao publicar, 4.3): um único comentário no card com o link do MR, seguindo o Passo 6 do skill `eng-global-pr` (freelance pula) |

---

## Entrada

<task_manager_key>
#$ARGUMENTS
</task_manager_key>

Ler `TASK_MANAGER` do `$IDE/ENV.md`. Seguir `$IDE/rules/engineering/eng.integrations-rules.md`.

**Se não receber argumentos**, perguntar e **aguardar**:

- `TASK_MANAGER` vazio → *Qual o seu número de controle para esta tarefa? (ex: F-042)*
- `TASK_MANAGER` preenchido → *Qual o id do card no {TASK_MANAGER}?*

> A branch de destino é a **`Branch base:`** gravada no cabeçalho do `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/architecture.md` pelo `eng.start`. Só perguntar (`main`, `dev` ou Outro) se o campo não existir.
> 💡 A branch de feature já foi criada no `eng.start`. Este workflow apenas faz push e abre o MR.

---

## Fase 0: O que fazer com o PR (`eng.transitions-rules.md`)

Pergunte com `AskUserQuestion`: **"O que fazer com o PR?"**
- **Revisar o texto e publicar (como hoje):** gera o `pull-request.md`, você aprova ou ajusta (4.2) e, com a aprovação, faz o push e abre o PR (4.4). A aprovação do texto é a confirmação da publicação.
- **Publicar sem revisar o texto:** gera o `pull-request.md` (4.1), faz o push e abre o PR (4.4) sem a revisão (4.2); você ajusta o texto direto no PR.
- **Só gerar os arquivos:** gera o `pull-request.md` (4.1), mostra para revisão (4.2) e não faz push nem abre o PR; você abre à mão. A Fase 7 gera o `daily.md` mesmo assim.

## Fase 1: Validação Pré-PR

### 1.1 Executar Testes Unitários

```bash
npm test  # ou comando do projeto
```

### 1.2 Verificar Lint

```bash
npm run lint  # ou comando do projeto
```

### 1.3 Verificar Build

```bash
npm run build  # ou comando do projeto
```

### 1.4 Executar Testes Automatizados (Opcional)

Para mudanças significativas, use a base [eng-qa](../../skills/eng-qa/SKILL.md) (ou a especialização registrada em `QA_SPECIALIZATIONS`, se houver uma) para validar os cenários afetados pelo diff antes de abrir o MR.

> **Nota**: Este passo é opcional mas recomendado para mudanças significativas.

**Se qualquer validação falhar:**
→ Corrigir os problemas antes de prosseguir
→ Informar o usuário sobre os erros

---

## Fase 2: Verificar Branch

> 🌿 **GitFlow**: a branch foi criada no `eng.start` e os commits foram feitos pelo `eng.work`.
> Esta fase apenas verifica que estamos na branch correta antes do push.

### 2.1 Verificar Branch Ativa

A branch de feature foi criada no `eng.start`. Verificar:

```bash
git branch --show-current
```

A branch deve seguir o padrão `{TASK_MANAGER_KEY}-{titulo-em-kebab-case}`.

**Cenários:**

| Situação | Ação |
|----------|------|
| Branch com `{TASK_MANAGER_KEY}` | ✅ Prosseguir |
| Branch errada / `main` / `develop` | Fazer checkout na branch correta: `git checkout {TASK_MANAGER_KEY}-{titulo-kebab}` |

### 2.2 Confirmar Branch de Destino

Branch de destino: a **`Branch base:`** do `architecture.md` (`{BRANCH_BASE}`). Sem o campo, pergunte com `AskUserQuestion` (`main`, `dev` ou Outro); não presuma.

> ⚠️ **Nunca fazer push direto para `main` ou `master`** sem confirmação explícita do usuário.

---

**Se não estiver na branch correta:**

```bash
git checkout {TASK_MANAGER_KEY}-{titulo-em-kebab-case}
```

### 2.3 Verificar Commits da Branch

```bash
git log {BRANCH_BASE}..HEAD --oneline
```

Deve listar os commits das fases implementadas no `eng.work`.

**Se houver mudanças não commitadas** (ex: ajuste manual fora do `eng.work`):

```bash
# Adicionar arquivos individualmente (NUNCA git add .)
git add {arquivo1} {arquivo2}
git commit -m "{TASK_MANAGER_KEY} chore: ajustes pré-PR

Refs: {TASK_MANAGER_KEY}"
```

---

## Fase 3: Push

> ⚠️ O push só acontece **depois da escolha de publicar** (Fase 0 e 4.3). Esta fase descreve o comando; ele roda dentro da publicação.

### 3.0 Conferir marcas de IA (só com `ARTIFACT_STYLE=human-generated`)

Antes do push, siga `$IDE/rules/artifact-style-rules.md`: nada publicado leva marca de IA ou da IDE.

```bash
TERMOS='co-authored-by|generated with|claude|anthropic|chatgpt|openai|copilot|\bIA\b|\bAI\b|sub-?agent|advisor'
RANGE=$(git rev-parse --abbrev-ref @{u} >/dev/null 2>&1 && echo '@{u}..HEAD' || echo '{BRANCH_BASE}..HEAD')
git log --format='%h %B' $RANGE | grep -inE "$TERMOS"
grep -inE "$TERMOS" $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/pull-request.md
```

Revise cada ocorrência antes de remover: a busca é larga e pode achar texto legítimo (ex.: `ai-generated`, um link para o PR).

- **Nada encontrado (ou só falsos positivos):** siga para o push.
- **No `pull-request.md`:** remova os trechos (o texto aprovado na 4.2 muda só nisso).
- **Nas mensagens de commit:** reescreva **só os commits de `$RANGE`** (ainda não enviados), sem modo interativo, por exemplo, com `{ref}` = o início de `$RANGE` (`@{u}` ou `{BRANCH_BASE}`), `git rebase {ref} --exec 'M=$(git rev-parse --git-dir)/MSG_LIMPA; git log -1 --format=%B | sed -E "/^Co-Authored-By:/Id" > "$M" && git commit -q --amend -F "$M"'`, ajustando o `sed` aos termos achados. Depois, rode a busca de novo.
- **Commit já enviado com marca:** não reescreva; avise o usuário e pare.

Informe no resumo o que foi removido. Com `ai-generated` (ou vazio), pule este passo.

### 3.1 Enviar para Remote

```bash
git push -u origin {NOME_DA_BRANCH}
```

**Verificar push:**

```bash
git log --oneline -3
```

---

## Fase 4: Criar Merge Request / Pull Request

Ler `VERSION_CONTROL` do `$IDE/ENV.md` (`gitlab` | `github` | `bitbucket`).
Use **MR** se GitLab, **PR** se GitHub/Bitbucket.

### 4.1 Gerar `pull-request.md` na sessão

Escreva o título e a descrição do PR em **`$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/pull-request.md`** (primeira linha `# {título}`, depois o corpo). Se a sessão tiver o `gate-checklist.md` do `eng.pre-pr`, use o PR Brief e as decisões dele.

Template, nesta ordem (o primeiro que existir):

```bash
cat $IDE/.gitlab/merge_request_templates/default.md 2>/dev/null \
  || cat .github/PULL_REQUEST_TEMPLATE.md 2>/dev/null \
  || cat pull_request_template.md 2>/dev/null \
  || cat $IDE/templates/engineering/PR-template.md
```

Preencher com a tarefa. Link do card:

| TASK_MANAGER | URL |
|--------------|-----|
| jira | `{TASK_MANAGER_URL_BASE}/browse/{TASK_MANAGER_KEY}` |
| linear | `{TASK_MANAGER_URL_BASE}/issue/{TASK_MANAGER_KEY}` |
| github | `{TASK_MANAGER_URL_BASE}/issues/{TASK_MANAGER_KEY}` |
| asana | `{TASK_MANAGER_URL_BASE}/0/0/{TASK_MANAGER_KEY}` |

`{TASK_MANAGER_KEY}` = `{TASK_MANAGER_KEY}`.

> ⚠️ Não mencione AI, Claude ou assistentes no MR/PR. Com `ARTIFACT_STYLE=human-generated`, também sem "Generated with …" nem link da ferramenta (`rules/artifact-style-rules.md`).

### 4.2 Revisão do texto

Mostre o consolidado de links da sessão (regra 5 de `eng.transitions-rules.md`, com o `pull-request.md` novo), o título e o resumo das seções e pergunte com `AskUserQuestion` (depois da mensagem com o consolidado de links): `[Aprovar]` / `[Ajustar]`. Ajuste até a aprovação. (Pulada com "Publicar sem revisar o texto" na Fase 0.)

### 4.3 Publicar ou não (sem pergunta nova)

A decisão já veio da Fase 0; não pergunte de novo. Aprovado o texto na 4.2, siga a escolha:

- **Só gerar os arquivos:** nada é enviado. O `pull-request.md` fica na sessão para você publicar quando quiser (à mão ou rodando o `/eng.pr` de novo). Pule para a Fase 7, que gera o `daily.md` mesmo assim (para não passar batido quando você abrir o PR à mão), com a mensagem "PR não publicado".
- **Revisar o texto e publicar** ou **Publicar sem revisar o texto:** faça o push (Fase 3) e crie o MR/PR (4.4).

### 4.4 Criar MR/PR via adapter

- **Título**: `{TASK_MANAGER_KEY}: {Título da tarefa}`
- **Branch origem**: `{NOME_DA_BRANCH}`
- **Branch destino**: `{BRANCH_BASE}` (a `Branch base:` do `architecture.md`)
- **Descrição**: o corpo do `pull-request.md` aprovado (sem a linha do título)

```bash
BODY_FILE=$(mktemp)
tail -n +2 $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/pull-request.md > "$BODY_FILE"

jarvis vcs create-merge \
  --source "${NOME_DA_BRANCH}" \
  --target "${BRANCH_BASE}" \
  --title "${TITULO_DO_PULL_REQUEST_MD}" \
  --body-file "$BODY_FILE"

rm -f "$BODY_FILE"
```

O adapter lê `git remote get-url origin` e `VERSION_CONTROL` / hostname (GitLab, GitHub, Bitbucket). Token: `.npmrc` (GitLab), `gh auth` / `GITHUB_TOKEN` (GitHub), `BITBUCKET_TOKEN` (Bitbucket).

Se o CLI `jarvis` não estiver instalado no repo alvo, usar `node {caminho-do-clone-do-jarvis}/bin/jarvis.js vcs create-merge ...`.

**Erros comuns:**

| Código | Causa | Solução |
|--------|-------|---------|
| `401 Unauthorized` | PAT ausente ou sem scope `api` | Gerar novo PAT com scope `api` em `~/.npmrc` |
| `404 Not Found` | Namespace desatualizado no remote | `git remote set-url origin <nova-url>` |
| `422` | Branch origem não existe no remote | Verificar se o push (Fase 3) foi executado |

---

## Fase 5: Atualizar Board

Pular se `TASK_MANAGER` estiver vazio (freelance).

### 5.1 Mover Card

Mova o card para a etapa equivalente a "em revisão" no seu board. Quem assumiu o card o move; não é preciso esperar o TECH LEAD ou o PM.

### 5.2 Link do MR no card

Siga o Passo 6 do skill `eng-global-pr`: um único comentário no card, com o link e a branch. É o único comentário do `eng.pr` no card.

---

## Fase 6: Processar Code Review

### 6.1 Aguardar Comentários

Aguarde 3-5 minutos para a ferramenta de code review processar.

### 6.2 Analisar Comentários

Para cada comentário:

1. Avaliar se requer correção
2. Avaliar se pode ser explicado/ignorado
3. Apresentar ao usuário

### 6.3 Aplicar Correções

Se necessário:

```bash
# Fazer mudanças
git add {arquivos_alterados}
git commit -m "fix: corrigir {problema} conforme code review"
git push
```

---

## Fase 7: Conclusão

### 7.1 Registrar Métricas de Lead Time

Calcule e registre o lead time (tempo desde eng.start até PR criado):

```bash
# Calcular lead time se .timestamp_start existir
if [ -f $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/.timestamp_start ]; then
  START_TIME=$(cat $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/.timestamp_start)
  END_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  # Calcular diferença em minutos (macOS/Linux compatível)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    START_EPOCH=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$START_TIME" +%s 2>/dev/null || echo 0)
    END_EPOCH=$(date +%s)
  else
    # Linux
    START_EPOCH=$(date -d "$START_TIME" +%s 2>/dev/null || echo 0)
    END_EPOCH=$(date +%s)
  fi

  LEAD_TIME_MINUTOS=$(( (END_EPOCH - START_EPOCH) / 60 ))
  LEAD_TIME_HORAS=$(awk "BEGIN {printf \"%.1f\", $LEAD_TIME_MINUTOS/60}")

  echo "$LEAD_TIME_MINUTOS" > $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/.lead_time_minutes

  LEAD_TIME_MSG="⏱️ Lead time: $LEAD_TIME_HORAS horas ($LEAD_TIME_MINUTOS minutos)"
else
  LEAD_TIME_MSG="⏱️ Lead time: não calculado (timestamp inicial ausente)"
fi
```

### 7.2 Registrar o esforço em `daily.md`

Regras em `$IDE/rules-on-demand/engineering/eng.pr-rules.md` (seção "daily.md"); template em `$IDE/templates/engineering/daily-template.md`. Arquivo: `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/daily.md`, **só na sessão, nunca publicado**.

1. **Gere sempre**, com ou sem PR publicado: quem abre o PR à mão ("Só gerar os arquivos" na Fase 0) também precisa do registro, e é aí que ele costuma passar batido. Se houver PR (o criado na 4.4 ou o PR já aberto da branch, via CLI/adapter do vendor, ex.: `gh pr view --json state,number,url`), preencha o campo `pr`; sem PR, deixe-o vazio e atualize quando o PR for aberto.
2. **Data:** pergunte com `AskUserQuestion`: **"Registrar o esforço com qual data?"** → `Hoje ({AAAA-MM-DD})` | `Outra data` (o usuário digita `AAAA-MM-DD`).
3. **Dias trabalhados** (só se o período entre a data do `.timestamp_start` e a data do registro tiver mais de um dia), uma pergunta por vez:
   - se o período tiver sábado ou domingo: **"Você trabalhou em {datas de sábado/domingo}?"** (Sim / Não; com várias datas, pode responder por data);
   - **"Houve feriado no período?"** → Não | Sim (o usuário informa as datas);
   - **"Teve algum dia em que você não trabalhou no período?"** → Não | Sim (o usuário informa as datas).

   Dias trabalhados = datas do período − fim de semana não trabalhado − feriados − dias não trabalhados. Registre no `worked_days` do frontmatter.
4. ***Post mortem*:**
   - **automático** se o `context.md` tiver `tipo: bugfix` ou `hotfix`, ou se houver **mais de 1 dia trabalhado**;
   - nos outros casos, pergunte (**Sim / Não**): **"A tarefa exigiu investigação ou análise longa?"**
5. **Nova execução** (o `daily.md` já existe): entenda o contexto e pergunte com `AskUserQuestion`: **"De onde veio a mudança desde o último registro?"**
   - **Ajuste meu:** reescreva o registro **focando no que foi entregue**, sem mencionar troca de escopo nem retrabalho.
   - **Pedido da liderança** (gerente, PM, tech lead): documente na seção "Mudança de escopo" o que mudou, quem pediu (como o usuário informar) e o impacto.

   Atualize a seção da data escolhida. Se a data for nova, acrescente uma seção `## AAAA-MM-DD`.
6. **Gerar** a descrição detalhada **e** a linha de timesheet, juntas.
   - **Fontes:** `architecture.md`, `plan.md`, `gate-checklist.md`, `pull-request.md`, `git log {BRANCH_BASE}..HEAD`, o PR/MR e o card.
   - **Descrição:** um parágrafo narrativo (contexto técnico, trabalho realizado, decisões), mais o *post mortem* quando couber (problema e causa raiz, investigação, solução/direcionamento), com detalhe suficiente para embasar questionamentos futuros.
   - **Timesheet:** **uma única linha** (`{TASK_KEY} — {resumo}`).
   - Sem e-mails, tokens nem valores de variáveis.
7. **Revisão conjunta:** mostre a descrição e a linha de timesheet **juntas** e pergunte com `AskUserQuestion` (depois da mensagem com o consolidado de links, com o `daily.md` novo): `[Aprovar]` / `[Ajustar]`. Com Ajustar, aplique os ajustes pontuais **nas duas** e mostre de novo, até aprovar.

### 7.3 Mensagem Final

```
✅ MERGE REQUEST CRIADO COM SUCESSO!

📋 Resumo:
- Branch: {NOME_DA_BRANCH}
- MR: {LINK_DO_MR}
- Jira: {TASK_MANAGER_KEY} → "In Review"

📊 Validações:
- Testes: ✅ Passando
- Lint: ✅ OK
- Build: ✅ OK

{LEAD_TIME_MSG}

📄 Arquivos da sessão (consolidado acumulado, regra 5 de `eng.transitions-rules.md`; só os que existem):
- [context.md]({caminho relativo})
- [architecture.md]({caminho relativo})
- [plan.md]({caminho relativo})
- [gate-checklist.md]({caminho relativo})  ← se o `eng.pre-pr` rodou
- [pull-request.md]({caminho relativo}) (novo)
- [daily.md]({caminho relativo}) (novo)
🕒 Timesheet: {LINHA_DE_TIMESHEET_APROVADA}

📌 Próximos passos:
1. Aguardar revisão do time e processar os comentários do code review
2. Merge após aprovação
3. /eng.spec-consolidate {TASK_MANAGER_KEY} depois do merge → registrar no Central docs o que esta entrega implementou

🗂️ A sessão $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/ não é apagada (o /eng.spec-consolidate precisa dela).
   Remova à mão quando quiser.

🔗 Links:
- MR: {LINK_DO_MR}
- Jira: {TASK_MANAGER_URL_BASE}/browse/{TASK_MANAGER_KEY}
```

### 7.4 Versões humanizadas (só com `ARTIFACT_STYLE=human-generated`)

Pergunte uma vez, com `AskUserQuestion` de várias perguntas em abas (`rules/artifact-style-rules.md`, regra 2), uma aba por documento da sessão que existir: `architecture.md`, `plan.md`, `gate-checklist.md` e `daily.md` (o `pull-request.md` não entra: já é público). Cada aba: **"Gerar a versão humanizada de {documento}?"** → **Não (como hoje)** / **Sim**. Com Sim, grave `{nome}.public.md` ao lado do original, seguindo o checklist da regra, e mostre o link. Com outro `ARTIFACT_STYLE`, pule esta etapa.

### 7.5 PR mergeado? (`eng.transitions-rules.md`)

Pergunte com `AskUserQuestion`: **"O PR já foi aprovado e mergeado?"**
- **Ainda não (como hoje):** encerre com a mensagem acima.
- **Sim, rodar o `/eng.spec-consolidate`:** chame o `/eng.spec-consolidate {TASK_MANAGER_KEY}` (ou mostre o comando).

## Regras Importantes

### ⛔ NÃO FAÇA

- ❌ `git add .` (adiciona arquivos indesejados)
- ❌ Push direto para `main`/`master`
- ❌ Commit sem referenciar TASK_MANAGER_KEY
- ❌ Branch sem padrão de nomenclatura
- ❌ Mencionar AI/Claude no MR

### ✅ FAÇA SEMPRE

- ✅ Validar testes antes do commit
- ✅ Adicionar arquivos específicos
- ✅ Usar mensagem de commit padronizada
- ✅ Criar branch no padrão `{TASK_MANAGER_KEY}-{titulo}`
- ✅ Preencher template do MR completamente
- ✅ Mover card para "In Review"
- ✅ Gerar o `pull-request.md` na sessão e só publicar com a escolha de publicar da Fase 0 (4.3)
- ✅ Com PR aberto, registrar o esforço no `daily.md` (7.2), com revisão conjunta da descrição e do timesheet
- ✅ **Nunca apagar a sessão:** o `/eng.spec-consolidate` precisa dela

---

## Tratamento de Erros

### Se os testes falharem:

→ Listar testes que falharam
→ Sugerir correções
→ NÃO prosseguir com o PR

### Se já existir uma branch com o mesmo nome:

→ Verificar se é a branch correta
→ Se sim, fazer checkout nela
→ Se não, perguntar ao usuário

### Se o push falhar:

→ Verificar se há conflitos
→ Resolver conflitos se necessário
→ Tentar push novamente
