---
description: Fluxo de implementação de código (commit por fase, SEM push nem PRs)
auto_execution_mode: 3
agent: "$IDE/agents/engineering/eng.agent.md"
rules_file: "$IDE/rules-on-demand/engineering/eng.work-rules.md"
recommended_model: claude-sonnet-5
---

# Engineer Work

Este comando executa a **implementação de código** seguindo o plano de execução.

> 📋 **Rules**: `$IDE/rules-on-demand/engineering/eng.work-rules.md` — **antes de começar, leia esse arquivo e siga-o**: ele não é carregado automaticamente no início da sessão.
> 🔀 **Transições**: `$IDE/rules-on-demand/engineering/eng.transitions-rules.md` — perguntas de início e de fim deste comando (a opção padrão mantém o fluxo de sempre).
>
> 🔗 **Links**: antes de escrever os comentários de fase no `plan.md`, leia `$IDE/rules-on-demand/doc-links-rules.md` e siga-a: toda citação com lugar exato (requisito, documento, código, card, PR) vira link.

> ⚠️ **IMPORTANTE**: Este workflow é para codificação com commits incrementais por fase.
> **NÃO crie PRs, NÃO faça push**, mas **FAZ commit ao final de cada fase validada.**

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| Cabeçalho (agente) | `eng.agent` (agente) | Sempre — identidade do workflow |
| Fase 0 | `/jarvis-context-detect` | Se `ENABLE_CDD=true` e o `context.md` não existir (obrigatório antes da Fase 1) |
| Fase 3 › 3.1 Implementar Código (skill de domínio) | `/eng-frontend` (via `eng.specializations-rules.md`) | Se o domínio da feature for frontend (componentes, UI, estado, estilos, bundle, a11y); a regra também carrega `FRONTEND_SPECIALIZATIONS` |
| Fase 3 › 3.1 Implementar Código (skill de domínio) | `/eng-backend` (via `eng.specializations-rules.md`) | Se o domínio da feature for backend (endpoints, auth, workers, filas, cache, banco, integrações); a regra também carrega `BACKEND_SPECIALIZATIONS` |
| Fase 3 › 3.1 Implementar Código (skill de domínio) | `/eng-automation` (via `eng.specializations-rules.md`) | Se o domínio da feature for RPA, scraping, extração de dados, ETL ou parsing; a regra também carrega `AUTOMATION_SPECIALIZATIONS` |
| Fase 3 › 3.1 Implementar Código (skill de domínio) | `/eng-platform` (via `eng.specializations-rules.md`) | Se o domínio da feature for infraestrutura (IaC, contêineres, CI/CD, observabilidade, SRE, custo); a regra também carrega `PLATFORM_SPECIALIZATIONS` |
| Fase 3 › 3.3.1 Identificar Gaps de Teste | `eng.qa.test-planner` (agente) | Sempre, depois de implementar o código da fase |
| Fase 3 › 3.3.2 Implementar Testes Faltantes (Opção A) | `eng.qa.testing-engineer` (agente) | Se o test-planner identificar gaps e a estratégia do `architecture.md` seção 6.5 indicar testes manuais (unitário/integração) |
| Fase 3 › 3.3.2 Implementar Testes Faltantes (Opção B) | `/eng-qa` | Se a estratégia do `architecture.md` seção 6.5 indicar uma especialização registrada em `QA_SPECIALIZATIONS` |
| Fase 3 › 3.1 Implementar Código (exceção) | `eng.advisor.agent` (agente) | Só por exceção: questão nova em aberto, com o Advisor habilitado no `eng.start` (cabeçalho do `architecture.md`) |
| Fase 5 › 5.2 e "Se houver bloqueio técnico" | `/eng-global-task-comment` | Se houver desvio do plano: mudança de direção, fase bloqueada ou questão nova consultada ao Advisor, só com o Sim da pergunta (regra de ouro; freelance: o skill registra no `task-log.md`); sem o Sim, o texto fica no `task-comment-*.md` |
| Fase 6 › 6.2 Oferta de Documentação | `/eng-global-docs-write` | Sempre que todas as fases forem concluídas e o usuário disser Sim à oferta de gerar/atualizar a documentação |

---

## Regra de Execução Máxima

Este workflow respeita o limite `MAX_AI_EXECUTION_PERCENTAGE` do `ENV.md`, conforme `$RULES_FOLDER/engineering/eng-rules.md` (cálculo sobre o to-do do `plan.md`; ao atingir o limite, parar, reportar e aguardar o usuário).

---

## Entrada

<task_manager_key>
#$ARGUMENTS
</task_manager_key>

Ler `TASK_MANAGER` do `$IDE/ENV.md`. Seguir `$IDE/rules/engineering/eng.integrations-rules.md`.

**Se não receber argumentos**, perguntar e **aguardar**:

- `TASK_MANAGER` vazio → *Qual o seu número de controle para esta tarefa? (ex: F-042)*
- `TASK_MANAGER` preenchido → *Qual o id do card no {TASK_MANAGER}?*

---

## Fase 0: Análise de Contexto (CDD)

Leia `ENABLE_CDD` no `$IDE/ENV.md` (`grep "^ENABLE_CDD=" $IDE/ENV.md`). Com `false` ou sem a variável, pule para a Fase 1 com o comportamento padrão. Com `true`, leia o `CONTEXT_PROFILE` de `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/context.md`; sem o arquivo, execute **agora** `/jarvis-context-detect {TASK_MANAGER_KEY}` (obrigatório) e não avance para a Fase 1 sem o `context.md`. Calibre a implementação pelo perfil, conforme `$IDE/skills/jarvis-context-detect/references/eng.work.md`. O perfil vem do `eng.start` e não é reapresentado ao usuário.

---

## Fase 1: Leitura da Sessão

### 1.1 Carregar Arquivos

Leia os arquivos da sessão em `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/`:

1. **`context.md`** - CONTEXT_PROFILE com calibrações (gerado por `/jarvis-context-detect`)
2. **`architecture.md`** - Entender decisões arquiteturais
3. **`plan.md`** - Identificar fase atual e tarefas

### 1.2 Identificar Fase Atual

Procure no `plan.md`:

- Fase marcada como `[Em Progresso ⏰]`
- Se nenhuma, identifique a primeira `[Não Iniciada ⏳]`

### 1.3 Escolhas do início (`eng.transitions-rules.md`)

Pergunte com `AskUserQuestion`, uma pergunta por decisão (padrão primeiro):

| Pergunta | Opções |
|---|---|
| **Execução das fases** | **Fase a fase, com aprovação (como hoje)** / **Todas de uma vez** (mostre "N de M tarefas", com N pelo limite `MAX_AI_EXECUTION_PERCENTAGE` abaixo) |
| **Commits** | **Um por fase (como hoje)** / **Um commit só ao final** |
| **Depois do work** | **Rodar o `/eng.pre-pr`** / **Rodar o `/eng.pr`** (sem o `/eng.pre-pr`) / **Fluxo normal (como hoje)** (só a mensagem final; o usuário segue os próximos comandos manualmente) |

- Grave as escolhas no cabeçalho do `plan.md` (`Execução:`, `Commits:`, `Depois do work:`). Retomada com escolhas já gravadas: uma pergunta só, **"Manter as escolhas ({resumo})?"** (Manter / Mudar).
- **Em qualquer escolha**, o limite de execução, um teste falhando e uma questão nova em aberto **param** a execução e voltam a perguntar.
- Com **Todas de uma vez**, a escolha é a aprovação das fases: as pausas da Fase 2.2 e da 6.1 não acontecem.

---

## Fase 2: Planejamento da Implementação

### 2.1 Apresentar Plano de Abordagem

Apresente ao usuário:

```
📋 PLANO DE IMPLEMENTAÇÃO - Fase {N}

🎯 Objetivo:
{objetivo da fase}

📝 Tarefas:
1. {tarefa_1} → {arquivo}
2. {tarefa_2} → {arquivo}
3. {tarefa_3} → {arquivo}

📁 Arquivos a criar:
- {arquivo_novo_1}
- {arquivo_novo_2}

✏️ Arquivos a modificar:
- {arquivo_existente_1}
- {arquivo_existente_2}

⚠️ Pontos de atenção:
- {risco_ou_decisão}
```

### 2.2 Aguardar Aprovação

**PARE e aguarde confirmação do usuário antes de implementar** (com "Fase a fase"; com "Todas de uma vez", siga direto).

Se o usuário tiver sugestões, ajuste o plano.

---

## Fase 3: Implementação

### 3.1 Implementar Código

**Skill de domínio (condicional)**: antes de implementar, identifique o domínio da feature e consulte o skill correspondente para padrões e boas práticas:

| Domínio | Indicadores | Skill |
|---------|-------------|-------|
| Frontend | componentes, UI, estado, estilos, bundle, a11y | regra [eng.specializations-rules.md]($IDE/rules/engineering/eng.specializations-rules.md) (área frontend: `eng-frontend` + `FRONTEND_SPECIALIZATIONS`) |
| Backend | endpoints, auth, workers, filas, cache, banco, integrações | regra [eng.specializations-rules.md]($IDE/rules/engineering/eng.specializations-rules.md) (área backend: `eng-backend` + `BACKEND_SPECIALIZATIONS`) |
| Automation (RPA & Web) | RPA, web scraping, Puppeteer, extração de dados, ETL, parsing | regra [eng.specializations-rules.md]($IDE/rules/engineering/eng.specializations-rules.md) (área automation: `eng-automation` + `AUTOMATION_SPECIALIZATIONS`) |
| Platform (infra) | IaC, contêineres/orquestração, pipeline de CI/CD, observabilidade, SRE, custo de nuvem | regra [eng.specializations-rules.md]($IDE/rules/engineering/eng.specializations-rules.md) (área platform: `eng-platform` + `PLATFORM_SPECIALIZATIONS`) |

Para cada tarefa da fase:

1. **Analisar contexto**
   - Verificar arquivos similares no projeto
   - Entender padrões utilizados

2. **Implementar**
   - Seguir convenções do projeto
   - Criar código limpo e documentado
   - Adicionar comentários explicativos

3. **Criar testes**
   - Testes unitários para cada função/método
   - Cobrir casos de sucesso e erro

**Questão nova em aberto (exceção).** O ideal é que todas as questões tenham sido levantadas no `eng.start`. Se surgir uma nova e o cabeçalho do `architecture.md` indicar um Advisor, consulte `eng.advisor.agent` com o Prompt 2 de `$IDE/templates/engineering/advisor-template.md` (refaça o Prompt 1 se o subagente não existir mais), acrescente a questão à seção 8 marcada "levantada no `eng.work`", adote a sugestão do Advisor e monte o comentário de auditoria e publique-o com `/eng-global-task-comment`, que mostra o texto e pergunta (regra de ouro, `eng.integrations-rules.md`; é desvio do plano; freelance: o skill registra no `task-log.md`). Sem o Sim, o texto fica no `task-comment-*.md` e no `architecture.md`. Cite o desvio no PR como lacuna do `eng.start`. Sem Advisor, pergunte ao usuário.

### 3.2 Executar Validações Locais

Após implementar:

```bash
# Executar testes
npm test # ou comando do projeto

# Verificar lint
npm run lint # ou comando do projeto

# Verificar build
npm run build # ou comando do projeto
```

### 3.3 Análise e Implementação de Testes

Após implementar o código da fase, execute o ciclo de testes:

#### 3.3.1 Identificar Gaps de Teste

Invoque o agente [eng.qa.test-planner]($IDE/agents/engineering/qa/eng.qa.test-planner.md) para:

- Analisar o código implementado na fase
- Identificar funções/métodos sem cobertura de teste
- Mapear casos de borda não cobertos
- Gerar relatório de gaps em `$ENG_DOCS/qa/{task-id}-test_coverage_branch_report.md`

#### 3.3.2 Implementar Testes Faltantes

Se o test-planner identificar gaps, escolha a abordagem baseada na **estratégia definida no `architecture.md` seção 6.5**:

**Opção A: Testes manuais (unitário/integração tradicional)**

Invoque o agente [eng.qa.testing-engineer]($IDE/agents/engineering/qa/eng.qa.testing-engineer.md) para:

- Escrever testes unitários/integração para código novo
- Cobrir casos de sucesso e erro identificados
- Seguir padrões de teste do projeto (Jest, Vitest, pytest, etc.)
- Garantir cobertura mínima definida na estratégia

**Opção B: Especialização registrada em QA_SPECIALIZATIONS**

Se a estratégia de testes (definida pelo `test-architect` no `eng.start`) indicar uma ferramenta de geração/execução automatizada, use a especialização registrada em `QA_SPECIALIZATIONS` (via a base [eng-qa]($IDE/skills/eng-qa/SKILL.md)) para o escopo do diff da fase.

**Quando usar cada opção:**

| Cenário | Usar |
|---------|------|
| Testes unitários de funções/classes | testing-engineer |
| Fluxo com ferramenta automatizada já registrada em `QA_SPECIALIZATIONS` | a especialização registrada |
| Sem especialização registrada | testing-engineer |

> ⚠️ **Importante**: Consulte `architecture.md` seção 6.5 para ver qual abordagem foi definida pelo test-architect.

#### 3.3.3 Revalidar

Após implementar os testes:

```bash
# Executar todos os testes
npm test # ou comando do projeto

# Verificar cobertura
npm run test:coverage # se disponível
```

> 💡 **Fluxo**: Implementa código → test-planner (gaps) → testing-engineer OU especialização de `QA_SPECIALIZATIONS` (implementa) → valida

---

## Fase 4: Validação com Usuário

### 4.1 Apresentar Resultado

```
✅ IMPLEMENTAÇÃO CONCLUÍDA - Fase {N}

📁 Arquivos criados:
- {arquivo_1} (+XX linhas)
- {arquivo_2} (+YY linhas)

✏️ Arquivos modificados:
- {arquivo_3} (+XX -YY linhas)

🧪 Testes:
- Unitários: ✅ Passando
- Lint: ✅ OK
- Build: ✅ OK

📝 Decisões tomadas:
- {decisão_1}: {justificativa}

❓ Aguardando sua validação para atualizar o plan.md
```

### 4.2 Iterar se Necessário

Se o usuário solicitar mudanças:

- Fazer ajustes
- Revalidar testes
- Apresentar novamente

---

## Fase 5: Atualização do plan.md

### 5.1 Marcar Fase como Concluída

Atualize o `plan.md`:

1. Mudar status das tarefas para `[Completada ✅]`
2. Mudar status da fase para `[Completada ✅]`
3. Adicionar seção de comentários

### 5.2 Adicionar Comentários

```markdown
### Comentários:

- **Decisão**: {decisão tomada e por quê}
- **Mudança**: {algo que mudou em relação ao planejado}
- **Aprendizado**: {algo descoberto durante implementação}
- **Atenção**: {ponto importante para próximas fases}
```

Se o comentário registrar uma **mudança de direção** (desvio do plano), monte também um comentário para o card, dizendo o que mudou e por quê, e publique-o com `/eng-global-task-comment`, que mostra o texto e pergunta (regra de ouro, `eng.integrations-rules.md`; freelance: o skill registra no `task-log.md`). Sem o Sim, o texto fica no `task-comment-*.md`.

### 5.3 Commit da Fase (GitFlow)

Após validação do usuário e atualização do `plan.md`, commitar a fase na branch atual:

```bash
# Verificar branch (deve ser a branch criada no eng.start)
git branch --show-current

# Ver os arquivos alterados pela fase
git status

# Adicionar arquivos específicos da fase (NUNCA git add .)
git add {arquivo1} {arquivo2} ... {arquivos da fase}

# Commit com mensagem padronizada
git commit -m "{TASK_MANAGER_KEY} {tipo}({escopo}): {descrição da fase}

- {mudança 1}
- {mudança 2}

Refs: {TASK_MANAGER_KEY}"
```

**Regras de commit:**
- Sempre referenciar o `TASK_MANAGER_KEY` no início e no `Refs:`
- Uma fase = um commit (agrupar todas as mudanças da fase), com "Um por fase"; com "Um commit só ao final", um commit depois da última fase, com todos os testes passando
- Tipo: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
- **NUNCA** usar `git add .` — adicionar arquivos individualmente

**Exemplos:**

```bash
# Fase de data layer
git commit -m "TASK-123 feat(users): criar migration e schema de usuários

- Criar migration create_users_table
- Definir modelo User com validações

Refs: TASK-123"

# Fase de backend
git commit -m "TASK-123 feat(auth): implementar endpoint POST /auth/register

- Criar AuthService com validação de email e hash de senha
- Criar AuthController com endpoint de registro
- Adicionar testes unitários do AuthService

Refs: TASK-123"
```

> ⚠️ Se testes falham → **NÃO commitar**. Corrigir primeiro, depois commitar.
## Fase 6: Próximos Passos

### 6.1 Se Houver Mais Fases

```
✅ Fase {N} concluída com sucesso!

📌 Próxima fase disponível: Fase {N+1}
   - {resumo da próxima fase}

❓ Deseja iniciar a Fase {N+1}?
```

**AGUARDE confirmação antes de iniciar** (com "Fase a fase"; com "Todas de uma vez", siga para a próxima fase).

### 6.2 Se Todas as Fases Foram Concluídas

```
🎉 TODAS AS FASES CONCLUÍDAS!

📁 Sessão: $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/
📄 Arquivos da sessão (consolidado acumulado, regra 5 de `eng.transitions-rules.md`): links de `context.md`, `architecture.md` e `plan.md` (atualizado, com comentários por fase; quantas fases concluídas), cada um com a nota de estado, mais os links do card/issue
🌿 Branch: {NOME_DA_BRANCH} (git branch --show-current; nome da skill eng-global-branch) — {N} commits realizados

📊 Resumo:
- Fases completadas: {N}
- Commits realizados: {N} (um por fase)
- Arquivos criados: {X}
- Arquivos modificados: {Y}
- Testes adicionados: {Z}

📌 Próximos passos:
1. Revise o código e os commits: git log --oneline
2. Execute os testes completos do projeto
3. Execute `eng.pr` para abrir o MR para dev

⚠️ LEMBRETE: push e PR são responsabilidade do `eng.pr`.
```

**Oferta de Documentação (opcional, não trava o fluxo; não conta no `MAX_AI_EXECUTION_PERCENTAGE` — não é uma tarefa do `plan.md`).** Antes da escolha "Depois do work", pergunte com `AskUserQuestion` (sem a ferramenta, use a tabela de `prod-rules.md`): **"Quer gerar ou atualizar a documentação do projeto (`docs/` ou equivalente) a partir desta entrega?"**:

- **Não, seguir sem atualizar (como hoje)** (padrão): segue direto para a escolha "Depois do work". A lacuna, se houver, é apontada depois pelo Gate 9 do `/eng.pre-pr` ("Documentação do projeto").
- **Sim, gerar ou atualizar agora**: use o skill `/eng-global-docs-write` para analisar o diff desde a `Branch base:` do `architecture.md` e propor a atualização do guia de uso do repositório (o que existe **hoje**; nunca histórico, nem "antes"/"passou a", nem funcionalidade removida — ela some do guia, não vira uma nota de descontinuação). Mostre a edição proposta e só grave com a aprovação. Comite em **commit próprio** (`{TASK_MANAGER_KEY} docs({escopo}): atualizar documentação da entrega`, `Refs: {TASK_MANAGER_KEY}`), fora da sequência de commits por fase.

Depois da oferta (com Sim ou Não), siga a escolha **Depois do work**: chamar o `/eng.pre-pr {TASK_MANAGER_KEY}`, chamar o `/eng.pr {TASK_MANAGER_KEY}`, fazer o que o usuário descreveu em texto livre (o "Outros" automático) ou, no **Fluxo normal (como hoje)**, só encerrar com a mensagem (chamar = pelo Skill tool, ou mostrar o comando pronto na IDE que não permite).

## Regras Importantes

### ⛔ NÃO FAÇA

- ❌ NÃO crie Pull Requests
- ❌ NÃO faça push (`git push`) — push é responsabilidade do `eng.pr`
- ❌ NÃO use `git add .` — adicionar arquivos individualmente
- ❌ NÃO commite sem aprovação explícita do usuário na fase (a escolha "Todas de uma vez" da 1.3 é essa aprovação)
- ❌ NÃO commite com testes falhando
- ❌ NÃO mova cards no Jira
- ❌ NÃO sugira "vamos fazer o PR agora" (salvo a escolha "Rodar o `/eng.pr`" da 1.3)

### ✅ FAÇA SEMPRE

- ✅ Implementar código conforme plan.md
- ✅ Criar/modificar arquivos de código
- ✅ Criar testes
- ✅ Executar validações locais (lint, test, build)
- ✅ Atualizar plan.md com progresso
- ✅ Dialogar com usuário para validação
- ✅ **Commitar ao final de cada fase validada** (GitFlow — Fase 5.3)

---

## Tratamento de Situações

### Se o usuário pedir para fazer commit antes da fase estar concluída:

→ Informe que commits são feitos ao final de cada fase completa e validada (Fase 5.3)

### Se faltar o plan.md:

→ Não prossiga sem o plano

### Se houver bloqueio técnico:

→ Documente no plan.md como `[Bloqueada 🚫]`
→ Monte o comentário do bloqueio e publique-o no card com `/eng-global-task-comment`, que mostra o texto e pergunta (regra de ouro, `eng.integrations-rules.md`; desvio do plano; freelance: o skill registra no `task-log.md`). Sem o Sim, o texto fica no `task-comment-*.md`
→ Explique o bloqueio ao usuário
→ Sugira alternativas se possível
