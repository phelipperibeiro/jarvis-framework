---
description: Revisão de lacunas antes de abrir o PR/MR, com o relatório gate-checklist.md na sessão
auto_execution_mode: 3
env_file: "@/ENV.md"
rules_file: "$IDE/rules-on-demand/engineering/eng.pre-pr-rules.md"
recommended_model: claude-sonnet-4-20250514
model_tier: high
model_justification: Revisão multi-agente requer coordenação, análise de código, validação de testes e verificação de conformidade
---

# pre-pr

Antes de abrir o PR/MR, este comando **revê a branch atrás de possíveis lacunas** (produto, código, testes, requisitos não funcionais, interface, segurança, documentação) e gera um relatório, o **`gate-checklist.md`**, na pasta da sessão. Ele é estruturado e explicativo, para você decidir o que ajustar e o que não ajustar.

> ⚠️ **Só revisa.** O `eng.pre-pr` não corrige código, não escreve testes, não atualiza documentação e não publica nada no Central docs. Ele aponta; quem decide e ajusta é você (ou o `eng.work`, se pedir).

> 📋 **Rules**: `$IDE/rules-on-demand/engineering/eng.pre-pr-rules.md` — **antes de começar, leia esse arquivo e siga-o**: ele não é carregado automaticamente no início da sessão.
> 🔀 **Transições**: `$IDE/rules-on-demand/engineering/eng.transitions-rules.md` — perguntas de início e de fim deste comando (a opção padrão mantém o fluxo de sempre).
>
> 🔗 **Links**: antes de escrever o `gate-checklist.md`, leia `$IDE/rules-on-demand/doc-links-rules.md` e siga-a: toda citação com lugar exato (requisito, documento, código, card, PR) vira link.

## Skills recomendados

- **eng-qa-planner**: para avaliar cobertura de testes e identificar gaps antes do PR — se a especialização estiver registrada em `QA_SPECIALIZATIONS` (ver `$IDE/rules/engineering/eng.specializations-rules.md`). Sem ela, use a base `eng-qa` diretamente.
  - Arquivo: `$IDE/skills/eng-qa-planner/SKILL.md`
- **eng-global-docs-write**: para identificar documentação que ficou desatualizada com as mudanças da branch.
  - Arquivo: `$IDE/skills/eng-global-docs-write/SKILL.md`
- **jarvis-docs-index**: para atualizar o índice de documentação quando necessário.
  - Arquivo: `$IDE/skills/jarvis-docs-index/SKILL.md`
- **eng-platform** + a especialização registrada em `PLATFORM_SPECIALIZATIONS` (se houver uma): para validar thresholds de performance e analisar regressões quando a feature tiver requisitos não-funcionais de latência, throughput ou escalabilidade (temas 14, 15 e 16).
  - Arquivo: `$IDE/skills/eng-platform/SKILL.md`
- **Skills de backend e frontend**: para validar código de backend (endpoints, autenticação, workers) ou de frontend (componentes, performance de UI e acessibilidade WCAG 2.1 AA), aplique a regra `$IDE/rules/engineering/eng.specializations-rules.md` para a área envolvida: ela carrega o skill base e as especializações registradas no `ENV.md`.
  - Arquivo da regra: `$IDE/rules/engineering/eng.specializations-rules.md`

<arguments>
#$ARGUMENTS
</arguments>

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| Skills recomendados | `/eng-qa-planner` | Se a especialização estiver registrada em `QA_SPECIALIZATIONS`; sem ela, usar a base `/eng-qa` diretamente |
| Skills recomendados | `/eng-global-docs-write` | Para identificar documentação desatualizada pelas mudanças da branch |
| Skills recomendados | `/jarvis-docs-index` | Se for necessário atualizar o índice de documentação |
| Skills recomendados | `/eng-platform` + `PLATFORM_SPECIALIZATIONS` | Se a feature tiver requisitos não-funcionais de latência, throughput ou escalabilidade |
| Skills recomendados | `/eng-backend` e `/eng-frontend` (via `eng.specializations-rules.md`) | Para validar código de backend (endpoints, autenticação, workers) ou de frontend (componentes, performance de UI, WCAG 2.1 AA); a regra também carrega as especializações registradas no ENV.md |
| Gates › item 1 | `prod.pm-checker` (agente) | Sempre na rodada 1; da rodada 2 em diante, só se o diff desde o `Commit:` da rodada anterior tiver qualquer arquivo (Rodada incremental) — verificar alinhamento da branch com os docs de produto e engenharia |
| Gates › item 2 | `eng.dev-code-reviewer` (agente) | Sempre na rodada 1; da rodada 2 em diante, só se o diff desde o `Commit:` da rodada anterior tiver arquivo fora da pasta `docs/` da raiz do repositório (Rodada incremental) — revisar o código antes de lançar |
| Gates › item 3 | `eng.qa.test-planner` (agente) | Sempre na rodada 1; da rodada 2 em diante, só se o diff desde o `Commit:` da rodada anterior tiver arquivo fora da pasta `docs/` da raiz do repositório (Rodada incremental) — identificar gaps de cobertura de testes na branch |
| Gates › item 4 | `eng.qa.test-architect` (agente) | Se a feature tiver requisitos não-funcionais (no `architecture.md` ou explícitos na task); da rodada 2 em diante, também só com arquivo fora da pasta `docs/` da raiz do repositório no diff desde o `Commit:` da rodada anterior |
| Gates › item 5 | `/eng-qa` + `QA_SPECIALIZATIONS` | Sempre na rodada 1; da rodada 2 em diante, só se o diff desde o `Commit:` da rodada anterior tiver qualquer arquivo (Rodada incremental) — frontend e/ou backend conforme o projeto |
| Gates › item 6 | `eng.frontend.agent` (agente) | Se a branch tiver mudanças de interface (componentes, estilos, estado); da rodada 2 em diante, só se o diff desde o `Commit:` da rodada anterior as tiver |
| Gates › item 7 | `eng.ux-designer.agent` (agente) | Se a branch introduzir nova feature de UI ou alterar fluxo de usuário; da rodada 2 em diante, só se o diff desde o `Commit:` da rodada anterior o fizer |
| Gates › item 8 | Nenhuma — checklist inline | Se a branch tocar em auth, sessions, inputs de usuário, CORS, CSP, permissões ou adicionar endpoints públicos; da rodada 2 em diante, só se o diff desde o `Commit:` da rodada anterior os tocar |
| Gates › item 9 | `eng.docs-writer` (agente) | Sempre na rodada 1; da rodada 2 em diante, só se o diff desde o `Commit:` da rodada anterior tiver qualquer arquivo (Rodada incremental) — apontar documentação do projeto desatualizada (sem editar) |
| Publicação do relatório | `/eng-global-task-comment` | Só se o usuário escolher um dos **Sim** no fim: o resumo ou o `gate-checklist.md` completo, com as decisões, vira um comentário na issue/card (freelance pula: nesse modo o relatório fica só na sessão) |

## Regras de Execução

- **Escopo**: avalie apenas as mudanças desta branch em relação à **branch base** (`Branch base:` do `architecture.md`; sem ele, pergunte).
- **Só apontar**: cada agente/gate devolve lacunas, não correções. Nenhum arquivo do projeto é alterado por este comando.
- **Evidências**: cite o comando rodado e o resultado, ou `arquivo:linha` com o trecho, para cada lacuna, e o que a derrubaria (coluna Refutação; seção "Passe crítico").

## Gates (revisão)

Na rodada 1, todos os gates abaixo rodam conforme a condição de cada um. Da rodada 2 em diante, vale também a seção "Rodada incremental": um gate só roda se o diff desde o `Commit:` da rodada anterior tocar o que ele lê.

1. Invoque o agente [prod.pm-checker]($IDE/agents/product/prod.pm-checker.md) para apontar desalinhamentos entre a branch e os documentos de produto e de engenharia (em `$PROD_DOCS`, `$ENG_DOCS` e no Central docs).
2. Invoque o agente [eng.dev-code-reviewer]($IDE/agents/engineering/eng.dev-code-reviewer.md) para apontar problemas de código (bugs, legibilidade, padrões do projeto).
3. Invoque o agente [eng.qa.test-planner]($IDE/agents/engineering/qa/eng.qa.test-planner.md) para apontar lacunas de cobertura de testes. Lacunas críticas: funções públicas sem teste, lógica de negócio descoberta, tratamento de erro não validado.
4. **Se a feature tiver requisitos não funcionais** (no `architecture.md` ou explícitos na task), invoque o agente [eng.qa.test-architect]($IDE/agents/engineering/qa/eng.qa.test-architect.md) para apontar o que falta validar (performance, segurança, quality gates).
5. Use a base [eng-qa]($IDE/skills/eng-qa/SKILL.md) (ou a especialização registrada em `QA_SPECIALIZATIONS`) para rodar os testes automatizados da branch e registrar o resultado.
6. **Se a branch tiver mudanças de interface**, invoque o agente [eng.frontend.agent]($IDE/agents/engineering/eng.frontend.agent.md) para apontar problemas de tipagem, tokens de design e acessibilidade (WCAG 2.1 AA), aplicando as especializações de frontend registradas.
7. **Se a branch introduzir nova feature de UI ou alterar fluxo de usuário**, invoque o agente [eng.ux-designer.agent]($IDE/agents/engineering/eng.ux-designer.agent.md) para apontar empty states, loading, mensagens de erro e consistência visual.
8. **Se a branch tocar em auth, sessions, inputs de usuário, CORS, CSP, permissões ou adicionar endpoints públicos**, aplique o checklist de segurança (padrões da base [eng-backend]($IDE/skills/eng-backend/SKILL.md) + `BACKEND_SPECIALIZATIONS`, [eng-frontend]($IDE/skills/eng-frontend/SKILL.md) + `FRONTEND_SPECIALIZATIONS` e, para infraestrutura, [eng-platform]($IDE/skills/eng-platform/SKILL.md) + `PLATFORM_SPECIALIZATIONS`): sanitização de inputs e queries parametrizadas, auth guards, headers e CORS, secrets no diff, `npm audit` sem HIGH/CRITICAL.
9. Invoque o agente [eng.docs-writer]($IDE/agents/engineering/eng.docs-writer.md) para apontar documentação do projeto que ficou desatualizada (sem editar).

## Relatório: `gate-checklist.md` (obrigatório)

### Passe crítico

Depois dos gates e antes de gravar o relatório, faça **um** passe contra a lista de lacunas. Parecido com o `Reflection` (um passe contra a própria conclusão), como o "Crítico antes de concluir" da skill `eng-global-investigation` (ver #171), mas sem nota de 0 a 100 nem novas tentativas.

- **Para cada lacuna**, confira a **Refutação** (o que a derrubaria) no lugar que ela aponta, e se o **Onde** traz o trecho ou o resultado do comando, e não só `arquivo:linha`.
- **Se a refutação se sustenta** (o lugar apontado mostra que a lacuna não existe), a lacuna **sai** da tabela. Registre-a numa linha abaixo da tabela da área: "Removidas no passe crítico: {lacuna} — {motivo}".
- **Se a lacuna existe, mas pesa menos do que a severidade dada** (por exemplo, 🟡 que é só redação), ela é **rebaixada**, com "(rebaixada: {motivo})" na coluna Lacuna, antes do "(item N)".
- **Sem evidência verificável** (nem trecho, nem comando, nem resultado): rebaixe para ⚪ ou peça ao gate o lugar exato antes de gravar.
- O passe não acrescenta lacunas novas nem muda a decisão herdada de uma lacuna.

### Rodadas

O `/eng.pre-pr` pode rodar mais de uma vez na mesma sessão (por exemplo, depois de corrigir lacunas com o `/eng.work`). Cada rodada preserva a anterior. Faça isto **depois dos gates e imediatamente antes de gravar**, com o renomear e o gravar em sequência, sem perguntas entre os dois:

- **Sem `gate-checklist.md` na sessão:** se não houver nenhum `gate-checklist-rodada-{N}.md` (os `.public.md` não contam aqui), é a primeira rodada: grave com `Rodada: 1`. Se houver (o relatório foi movido, ou uma gravação falhou depois do renomear), a nova rodada é o maior número existente + 1, a rodada anterior é o `.md` de maior número, e os arquivos `.md` existentes entram em "Rodadas anteriores". Um `gate-checklist.public.md` solto (sem o relatório que o originou, um estado anormal) fica como está: avise que ele ficou sem o relatório de origem e que um "Sim" na versão humanizada do `eng.pr` o grava por cima.
- **Com `gate-checklist.md`:** seja `M` o número do arquivo renomeado: o maior entre o `Rodada:` do cabeçalho dele (sem o campo, ou com valor que não seja número, vale `1`) e o maior número existente + 1 (sem arquivo numerado, esse termo vale `1`). Assim `M` nunca repete um número já usado, inclusive quando o nome estiver ocupado ou o `Rodada:` for menor que o de um arquivo existente. Renomeie o arquivo para `gate-checklist-rodada-{M}.md` (a rodada anterior é essa) e grave a nova rodada em `gate-checklist.md` com `Rodada: {M+1}`. Se existir o `gate-checklist.public.md` (versão humanizada, `rules/artifact-style-rules.md`), renomeie-o sempre junto, para `gate-checklist-rodada-{M}.public.md`: com `gate-checklist.md` presente, ele é a versão humanizada desse relatório.
- **Contagem:** o maior número existente considera os `gate-checklist-rodada-{N}.md` e os `gate-checklist-rodada-{N}.public.md`; a lista de "Rodadas anteriores" traz só os `.md`. O `.public.md` não ganha número próprio: só reserva o que já tem, para a rotação não sobrescrevê-lo (a proibição de contar `{nome}.public.md` na sequência de IDs, em `rules/artifact-style-rules.md`, trata dos IDs de documentos, não deste nome).
- **Nunca** apague nem sobrescreva uma rodada, e não edite o arquivo renomeado.

O `gate-checklist.md` é sempre a rodada mais recente: o `/eng.pr` e o `/eng.spec-consolidate` leem só ele; as rodadas anteriores são histórico.

### Rodada incremental

Da rodada 2 em diante, um gate roda só se o diff desde a rodada anterior tocar o que ele lê. O diff incremental decide apenas **se** o gate roda: o gate que roda continua revisando a branch inteira em relação à branch base.

- **Diff incremental:** `git diff --name-only {Commit da rodada anterior}..HEAD`, mais os arquivos de `git status --porcelain` (mudanças ainda sem commit; um arquivo que já estava sujo na rodada anterior e não mudou entra de novo, e o gate roda a mais: borda aceita, a favor de revisar). No modo workspace, um diff por repositório do `Commit:` da rodada anterior (`git -C {repo} …`); repositório com mudanças na branch que não estava nesse `Commit:` entra inteiro.
- **Escopo de cada gate**, pelo que ele lê (não pelo que ele aponta):

  | Gate (item) | Área do relatório | Roda da rodada 2 em diante se o diff incremental tiver |
  |---|---|---|
  | Alinhamento (1) | Produto e documentação | qualquer arquivo |
  | Código (2) | Código | algum arquivo fora da pasta `docs/` da raiz do repositório |
  | Cobertura de testes (3) | Testes | algum arquivo fora da pasta `docs/` da raiz do repositório |
  | Não funcionais (4) | Não funcionais | algum arquivo fora da pasta `docs/` da raiz do repositório, e a feature tem requisito não funcional |
  | Testes automatizados (5) | Testes | qualquer arquivo |
  | Interface (6) | Interface e UX | mudança de interface (componentes, estilos, estado) |
  | UX (7) | Interface e UX | nova feature de UI ou mudança de fluxo de usuário |
  | Segurança (8) | Segurança | algo que toque auth, sessions, inputs de usuário, CORS, CSP, permissões ou endpoints públicos |
  | Documentação do projeto (9) | Documentação do projeto | qualquer arquivo |

- **Lacuna que depende de arquivo fora do escopo do gate** (por exemplo, documentação que ficou desatualizada por uma mudança de código): fica coberta porque o alinhamento e a documentação rodam com qualquer arquivo no diff.
- **Lacuna reavaliada:** uma lacuna da rodada anterior é reavaliada só se o gate que a achou (o item entre parênteses no fim da coluna Lacuna) rodou nesta rodada. Em relatório antigo, sem o item, vale a área: é reavaliada se todos os gates da área dela rodaram.
- **Pendentes não reavaliadas continuam pendentes:** a lacuna da rodada anterior que não foi reavaliada e estava com `🔧 Corrigir` ou sem decisão é copiada para a tabela da área nesta rodada, com a decisão herdada e a coluna Lacuna no formato "{lacuna} (não reavaliada nesta rodada) (item N)": o item fica sempre por último, e uma lacuna já copiada não ganha o sufixo de novo (mantém o sufixo e o item que já tem); sem item na origem (relatório antigo), copie sem ele, e vale a área; na "Resolução da rodada anterior" ela fica `Não reavaliada`. Assim ela entra na conta do fechamento e no PR Brief.
- **Sem nenhum arquivo no diff incremental:** nenhum gate roda; as pendentes da rodada anterior são copiadas (regra acima) e a rodada serve para decidir de novo sobre elas, no fechamento.
- **Como o relatório marca:** a área em que nenhum gate rodou leva, acima da tabela (que só traz as pendentes copiadas, se houver), "Não reavaliada nesta rodada (sem diff no escopo desde `{Commit da rodada anterior}`)".
- **Todos os gates rodam:** na rodada 1; quando a rodada anterior não tem `Commit:` (relatório de versão antiga); quando esse commit não existe mais no repositório (`git cat-file -e {Commit da rodada anterior}` falha: rebase, outro clone); e quando a pessoa pedir. Nos dois casos do meio, avise em uma linha.

### Modelo

Grave em `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/gate-checklist.md`:

```markdown
# Gate checklist — {TASK_MANAGER_KEY}

> Branch: {branch} → {branch base} · Data: {AAAA-MM-DD} · Rodada: {N} · Commit: {sha curto do HEAD; no modo workspace, `{repo}@{sha}` por repositório com mudanças na branch}
> **Semáforo:** 🟢 pronto para PR | 🟡 pode abrir com notas | 🔴 há bloqueadores

## Rodadas anteriores
{Um link por rodada anterior, em ordem crescente do número do nome (buracos aceitos): [`gate-checklist-rodada-{N}.md`](gate-checklist-rodada-{N}.md) ({data}, {semáforo}). Na primeira rodada: "Nenhuma (primeira rodada)."}

## Resolução da rodada anterior
{Só da rodada 2 em diante; na primeira, omita esta seção.}

| # anterior | Lacuna | Decisão anterior | Situação | Corrigido em |
|---|---|---|---|---|
| {Área} #{n} | {lacuna da rodada anterior} | {🔧 Corrigir \| vazia} | {Corrigida \| Ainda presente \| Não reavaliada} | {hash \| sem commit: {arquivo} \| —} |

## Resumo
{3 a 5 frases: o que a branch faz, quantas lacunas por severidade e o principal risco.}

Critério de parada: {atingido na rodada {N} (teto de {T} rodadas da urgência `{u}` | sem lacuna 🔴 ou 🟡 nova) | não atingido}

## Lacunas

### {Área: Produto e documentação | Código | Testes | Não funcionais | Interface e UX | Segurança | Documentação do projeto}

| # | Lacuna | Onde | Por que importa | Refutação | Sugestão | Severidade | Decisão |
|---|---|---|---|---|---|---|---|
| 1 | {o que falta ou está errado} (item {N}) | [`{arquivo}:{linha}`](../../../../{repo}/{caminho}#L{linha}): {trecho, ou o comando e o resultado} | {impacto, em linguagem simples} | {o que derrubaria esta lacuna, com o lugar a conferir} | {como resolver} | 🔴 Bloqueador / 🟡 Importante / ⚪ Menor | {🔧 Corrigir \| 👍 Aceitar: motivo} |

(uma tabela por área; a Refutação é o que, se verdadeiro, mostraria que a lacuna não existe, e o passe crítico a confere antes de gravar; a coluna Lacuna termina com o item do gate que a achou, entre parênteses, por exemplo "(item 3)", que a rodada incremental usa para saber se ela foi reavaliada; área sem lacuna: "Nenhuma lacuna encontrada."; área cujos gates não rodaram nesta rodada: "Não reavaliada nesta rodada (sem diff no escopo desde `{Commit da rodada anterior}`)", seção "Rodada incremental")

## Evidências
{Comandos rodados (testes, lint, build, audit) e resultados.}

## PR Brief
- Resumo do que mudou:
- Como testar:
- Riscos / trade-offs:
- Rodadas do pre-pr: {N} (🔴/🟡/⚪ por rodada: {a/b/c, …}); critério de parada: {rodada {K}, por {teto | sem lacuna nova} | não agiu}
- Ajustes antes da aprovação: architecture.md {n} · plan.md {m}   ← da linha "Ajustes antes da aprovação" do cabeçalho de cada um ("—" se a linha não existir)
- Labels sugeridos: {só o nome, ex.: `security`}   ← critério em `eng-security-rules.md` (auth, sessions, RBAC, CORS, CSP, permissões); a pessoa adiciona no host (o `jarvis vcs create-merge` não põe label); nem o label nem esta nota entram no `pull-request.md`; o `eng.pr` lembra o label na mensagem final
```

A coluna **Decisão** nasce vazia: quem preenche é o usuário (exceto a decisão herdada, descrita abaixo).

A **Resolução da rodada anterior** lista as lacunas da rodada anterior com decisão `🔧 Corrigir` (ou `Corrigir` sem ícone, de um relatório anterior à rodada 3, que vale igual) e as sem decisão (coluna vazia; no fechamento, as ⚪ só recebem decisão pela opção "Corrigir todas"). As `👍 Aceitar` não entram e, se reaparecerem, voltam como lacunas novas, com a Decisão vazia. A lacuna `🔧 Corrigir` que continua `Ainda presente` e reaparece nas tabelas novas herda a decisão: nasce com `🔧 Corrigir`, para o usuário confirmar ou mudar: as 🔴 e 🟡 herdadas em "Decidir uma a uma", as ⚪ herdadas à mão, editando a coluna Decisão. As regras da tabela:

- **Situação:** `Corrigida` (não aparece mais nesta rodada), `Ainda presente` (aparece de novo nas tabelas desta rodada) ou `Não reavaliada` (o gate ou a área dela não rodou nesta rodada, inclusive quando a rodada incremental o pulou, então sumir não prova correção). A lacuna da rodada anterior que o passe crítico desta rodada removeu fica `Removida no passe crítico`, com o motivo, e não conta como corrigida. A decisão fica só na coluna "Decisão anterior".
- **Rodada anterior:** é a do arquivo renomeado (`M`) ou, sem `gate-checklist.md`, o `.md` de maior número; o `Commit:` e as lacunas vêm dela.
- **Coluna "Onde":** o arquivo é o caminho do link depois de `../../../../`, sem a âncora (`#…`, de linha ou de título) (no modo workspace, o primeiro trecho é o `{repo}` só se for uma subpasta com `.git/` ou listada em `WORKSPACE_REPOS`, e o resto é o arquivo; senão, o arquivo está fora de repositório); com vários arquivos, rode o log em cada um e junte os hashes (no workspace, escreva `{repo}@{hash}`; se um arquivo tem hash e outro não, liste só os hashes); arquivo fora de repositório (da sessão ou em `docs/jarvis/`; no modo workspace, também na raiz do workspace, como `AGENTS.md`), `—`.
- **Corrigido em:** nas situações `Ainda presente` e `Não reavaliada`, `—`. Para as `Corrigida`, rode `git merge-base --is-ancestor {Commit da rodada anterior} HEAD`; se falhar (rebase, amend, squash ou outro clone), escreva `— (commit anterior fora do histórico)`. Se passar, ache o hash com `git log --format=%h {Commit da rodada anterior}..HEAD -- {arquivo}` (com mais de um, liste todos, separados por vírgula). Se a correção está no diretório de trabalho sem commit, `sem commit: {arquivo}`; se o log volta vazio (por exemplo, a correção criou um teste novo e não tocou o arquivo apontado), `— (não identificado)`. O hash é indicativo: mostra o commit que mexeu no arquivo apontado, não prova que foi a correção.
- **Modo workspace (`WORKSPACE_MODE=workspace`):** o `Commit:` traz um `{repo}@{sha}` por repositório com mudanças na branch (cada repositório tem o seu `.git`; como em `eng.start.md`), e o git roda no repositório da lacuna: `git -C {repo} …` (o `{repo}` e o arquivo vêm da coluna "Onde", acima). Repositório que não está no `Commit:` da rodada anterior (não tinha mudanças): `— (repositório sem commit na rodada anterior)`. Com `project`, o `Commit:` é um sha só e o git roda na raiz.
- **Rodada anterior sem `Commit:`** (relatório de versão antiga): `—`.

## Fechamento

**Critério de parada.** Calcule-o depois dos gates e antes de gravar o relatório, e grave a linha `Critério de parada:` no Resumo. Ele não impede a rodada de rodar nem de gravar o relatório: muda só o que o fechamento mostra e pergunta. Parecido com o orçamento de etapas do `ReAct` e com o do `/eng.debug` (ver #171).

- **Teto de rodadas**, pela `urgencia` do `context.md` (o mesmo campo do orçamento do `/eng.debug`): `alta` 3 · `normal` 5 · `baixa` 8; sem `context.md`, vale `normal`. Atingido quando o `Rodada:` desta rodada é igual ou maior que o teto.
- **Rodada sem lacuna nova** (da rodada 2 em diante, e só se os gates de código e de cobertura de testes, itens 2 e 3, rodaram nesta rodada): nenhuma lacuna 🔴 ou 🟡 desta rodada é nova. Nova é a que não aparece na "Resolução da rodada anterior" como `Ainda presente` ou `Não reavaliada`. Atingido, leva à variante B (abaixo), mas não aceita 🟡 sozinho: só o teto aceita 🟡; com este gatilho, as 🟡 sem decisão são decididas uma a uma na própria variante B.
- **Aviso de teto:** sempre que o teto for atingido e houver lacuna pendente, de qualquer severidade, comece a mensagem do passo 1 com: "⚠️ Teto de {T} rodadas da urgência `{u}` atingido; as pendências seguem abertas e cada rodada a mais fica registrada no PR."

Lacuna **pendente** é a sem decisão ou a herdada com `🔧 Corrigir`, inclusive as copiadas como "(não reavaliada nesta rodada)". Uma decisão herdada nunca é trocada por outra opção da variante B. O passo 2 tem duas variantes:

| Situação | Variante |
|---|---|
| Nenhuma 🔴 pendente, nenhuma 🟡 herdada com `🔧 Corrigir`, há lacuna sem decisão, e as sem decisão são só ⚪, ou também 🟡 com o critério de parada atingido (teto ou rodada sem lacuna nova) | **B** (severidade como gatilho) |
| Qualquer outro caso (inclusive sem lacuna pendente) | **A** (as perguntas de sempre) |

1. Mostre o semáforo, o resumo e a lista de lacunas por severidade, com o consolidado de links da sessão (regra 5 de `eng.transitions-rules.md`: tudo o que já existe, com o `gate-checklist.md` novo e, antes dele e em ordem, as rodadas anteriores `gate-checklist-rodada-{N}.md`; o atual leva a nota "rodada {N}, atual").
2. Peça as decisões com `AskUserQuestion`, depois da mensagem em markdown do passo 1 (com o link clicável).

   **Variante A.** Se o gatilho "sem lacuna nova" foi atingido (há 🔴 pendente ou 🟡 herdada com `🔧 Corrigir`, senão seria a B), comece com: "ℹ️ Nenhuma 🔴 ou 🟡 nova nesta rodada: as pendentes são as da rodada anterior." Pergunta: **"O que fazer com as {n} lacunas encontradas ({a} 🔴 bloqueadoras, {b} 🟡 importantes)? Relatório: gate-checklist.md."**
   - **Corrigir todas antes do PR:** marca as {n} como "🔧 Corrigir"; você corrige à mão ou com o `/eng.work`.
   - **Corrigir só as bloqueadoras 🔴:** marca as 🔴 sem decisão como "🔧 Corrigir"; as 🟡 sem decisão ficam "👍 Aceitar", com um motivo só, pedido uma vez. As lacunas herdadas continuam "🔧 Corrigir".
   - **Decidir uma a uma:** mostra cada lacuna 🔴 e 🟡 (as herdadas já com "🔧 Corrigir") e você escolhe "🔧 Corrigir" ou "👍 Aceitar" (com o motivo), com `AskUserQuestion` por lacuna.
   - **Só gerar o relatório (vou analisar com calma):** não registra decisão agora; a coluna **Decisão** fica vazia (exceto as decisões herdadas), o `gate-checklist.md` fica na sessão para você analisar e o comando termina sem as perguntas 3 e 4. Rode o `/eng.pre-pr` de novo (este relatório é preservado como `gate-checklist-rodada-{N}.md`), ou preencha o arquivo à mão, quando decidir.

   **Variante B.** A resposta já decide como seguir, e o passo 4 não é feito. Pergunta: **"Restam {lista} sem decisão{ (motivo)}. Relatório: gate-checklist.md. Como seguir?"**, com `{lista}` = "{c} lacunas ⚪", "{c} ⚪ e {b} 🟡" ou "{b} 🟡" (sem termo em zero) e o motivo, quando há 🟡: "teto de {T} rodadas atingido" ou "nenhuma 🔴 ou 🟡 nova nesta rodada" (com os dois gatilhos atingidos, vale o teto).
   - **Aceitar as ⚪ e seguir para o PR** (é a primeira opção, a recomendada). Grava `👍 Aceitar: aceito no fechamento da rodada {N}` nas ⚪ sem decisão; depois do passo 3, chame o `/eng.pr {TASK_MANAGER_KEY}` (ou mostre o comando). O rótulo muda conforme o caso:
     - com 🟡 sem decisão e o **teto** atingido: "Aceitar as 🟡 e as ⚪ e seguir para o PR" (ou "Aceitar as 🟡 e seguir para o PR", sem ⚪); as 🟡 levam `👍 Aceitar: teto de rodadas atingido na rodada {N}`;
     - com 🟡 sem decisão e só o gatilho **sem lacuna nova**: "Aceitar as ⚪ e decidir as 🟡 uma a uma" (ou "Decidir as 🟡 uma a uma", sem ⚪); cada 🟡 é perguntada com `AskUserQuestion` (🔧 Corrigir ou 👍 Aceitar com o motivo); as ⚪ mantêm o Aceitar já gravado; depois do passo 3, chame o `/eng.work {TASK_MANAGER_KEY}` se alguma 🟡 ficou `🔧 Corrigir`, senão o `/eng.pr {TASK_MANAGER_KEY}` (ou mostre o comando);
     - com ⚪ herdadas em `🔧 Corrigir`, o rótulo acrescenta "({h} ⚪ seguem em 🔧 Corrigir)": elas mantêm a decisão e vão como pendências no PR Brief.
   - **Corrigir antes do PR:** marca as sem decisão como `🔧 Corrigir`; depois do passo 3, chame o `/eng.work {TASK_MANAGER_KEY}` para as pendentes (ou mostre o comando).
   - **Só gerar o relatório (vou analisar com calma):** como na variante A; o comando termina sem os passos 3 e 4. É a opção que mantém o fluxo de hoje e a que vale quando a pessoa não escolhe.

   Grave as decisões na coluna **Decisão** como `🔧 Corrigir` ou `👍 Aceitar: motivo`. As opções acima valem só para as lacunas sem decisão, exceto "Decidir uma a uma", que também deixa mudar as herdadas 🔴 e 🟡 (as ⚪ herdadas mudam à mão); as herdadas entram em `{n}` e, conforme a severidade, em `{a}` ou `{b}`.
3. **Modo freelance (`TASK_MANAGER` vazio):** não pergunte; o relatório fica só na sessão. **Com board**, pergunte com `AskUserQuestion` (nunca publique sem a resposta): **"Registrar o resultado do `/eng.pre-pr` como comentário no card {TASK_MANAGER_KEY}?"**
   - **Não, manter só na sessão (como hoje):** nada é enviado ao card (o texto fica no `gate-checklist.md`).
   - **Sim, só o resumo:** `/eng-global-task-comment {TASK_MANAGER_KEY}` com o semáforo, o resumo e as lacunas 🔴 com a decisão de cada uma.
   - **Sim, o relatório completo:** `/eng-global-task-comment {TASK_MANAGER_KEY}` com o conteúdo do `gate-checklist.md`.

   O texto vai para fora do workspace: converta os links pela regra 6 de `doc-links-rules.md` (URL absoluta; sessão e `docs/jarvis/` em texto).
4. Próximo passo (só na variante A do passo 2): corrigir o que foi marcado "🔧 Corrigir" (à mão ou com o `/eng.work`) e rodar o `/eng.pr`, que usa o PR Brief deste relatório. Antes, escreva uma mensagem em markdown com o consolidado de links da sessão (regra 5) e o resumo; depois pergunte com `AskUserQuestion` (`eng.transitions-rules.md`):
   - **Com {n} lacunas marcadas "🔧 Corrigir"** — **"O `/eng.pre-pr` encontrou {n} lacunas a corrigir ({a} 🔴, {b} 🟡). Leia o gate-checklist.md com calma e responda quando decidir. Como seguir?"**
     - **Corrigir as lacunas agora:** chame o `/eng.work {TASK_MANAGER_KEY}` para as {n} lacunas (ou mostre o comando).
     - **Parar aqui para corrigir à mão (como hoje):** o comando termina.
     - **Abrir o PR assim mesmo:** chame o `/eng.pr {TASK_MANAGER_KEY}`; as {n} pendências seguem registradas no PR Brief.
   - **Sem lacunas a corrigir** — **"Relatório sem lacunas a corrigir (gate-checklist.md). Como seguir?"**: **Abrir o PR agora** (chame o `/eng.pr {TASK_MANAGER_KEY}`) / **Parar aqui (como hoje)**.
