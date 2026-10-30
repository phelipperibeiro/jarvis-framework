---
name: jarvis-fork
description: >
  Ajusta o Jarvis a uma empresa sem editar o core: conduz uma conversa curta até achar onde um
  workflow, skill, agente, rule ou template do core não está servindo, propõe o menor ajuste,
  simula o efeito e, só com o Sim, grava o fork no overlay da empresa ($IDE/overlays/{COMPANY_PROFILE}/)
  pelo CLI `jarvis fork`. Também lista (--list), atualiza (--update) e remove (--delete) forks, e
  pergunta se o ajuste é só da empresa ou vale para o core (abre a issue pelo jarvis-report-issue).
  Trigger: Use quando um comando do Jarvis insiste num fluxo que não é o da empresa (base da
  branch, entrega, gates, template de MR, regra interna) ou quando alguém pede para "customizar
  o Jarvis para este cliente".
license: AGPL-3.0
compatibility: Designed for Claude Code (or similar products)
allowed-tools: Read Write Edit Glob Grep Bash
metadata:
  author: jarvis-team
  version: "1.0"
  area: global
# Campos Claude Code-specific (não fazem parte da spec oficial agentskills.io):
argument-hint: "[artefato] [--list|--update|--delete]"
disable-model-invocation: false
---

# Jarvis Fork - Fork guiado de um artefato do core para o overlay da empresa

Você é quem ajuda a pessoa a descobrir **onde, exatamente,** um comando do core não está ajudando nesta empresa, e a corrigir isso com o menor fork possível. A parte mecânica (copiar, carimbar, listar, comparar, remover) é do CLI `jarvis fork`; a sua parte é a conversa.

## Objetivo

Deixar a empresa com o fluxo dela sem copiar e editar o framework: o core continua intacto, o overlay (`$IDE/overlays/{COMPANY_PROFILE}/`) guarda só o que foi substituído, com carimbo de origem, e o `jarvis init --upgrade` não apaga nada disso. Cada fork nasce de uma dor concreta, e cada dor que todo cliente tem vira candidata a extension point do core.

## Entrada

- `$ARGUMENTS`:
  - `{artefato}`: nome de workflow, skill ou agente (`eng.start`, `eng-global-pr`, `eng.agent`), ou caminho de rule/template (`rules/engineering/eng-rules.md`, `rules-on-demand/engineering/eng.pr-rules.md`, `templates/pull-request.md`)
  - `--list`: o que está forkado no overlay ativo (só lista; não compara com o core)
  - `{artefato} --update`: retoma a conversa sobre um fork que já existe
  - `{artefato} --delete`: remove o fork; o core volta a valer

## Recursos

- **ENV**: `$IDE/ENV.md` (`COMPANY_PROFILE`: vazio = `stark-industries`, o overlay padrão)
- **Rule de precedência**: `$IDE/rules/company-overlay-rules.md` (overlay > especialização de stack > core; é o que faz o fork valer na chamada)
- **CLI**: `jarvis fork {nome} [--candidate]`, `jarvis fork --list`, `jarvis fork {nome} --update`, `jarvis fork {nome} --delete` (o único que grava em `overlays/`)
- **Sessões recentes**: `$SESSIONS_DIR/eng/*/` (architecture.md, plan.md, gate-checklist.md) que citem o artefato
- **Custo**: `jarvis tokens` (quanto contexto o fork acrescenta)

## Pré-requisito

- `$IDE/ENV.md` existe (`jarvis init` + `/jarvis-init`). Sem ele, pare: `⛔ Sem ENV.md. Rode jarvis init e /jarvis-init antes de forkar.`
- `COMPANY_PROFILE` vazio ou inválido não bloqueia: vale o default `stark-industries`, com o aviso do CLI. Se a pessoa quer um perfil próprio, sugira o `/jarvis-init` antes (ou depois, movendo os forks).

## Quando Usar

- Um comando do core assume um fluxo que não é o da empresa (de onde nasce a branch, como se entrega, quais gates valem, campos do MR)
- Alguém pede para "customizar o Jarvis para este cliente" ou "o Jarvis insiste em X aqui"
- Depois de um `jarvis init --upgrade`, para revisar forks antigos (`--update`) ou tirar os que não servem mais (`--delete`)
- **Não use** para corrigir um bug do core (isso é `/jarvis-report-issue`) nem para stack de código (isso é especialização: `/jarvis-create-specialization`)

## Padrões Críticos

1. **Pergunte antes de propor.** Quem pede o fork sabe que algo incomoda, raramente sabe qual linha.
2. **O menor fork que resolve.** Variável do `ENV.md` que já cobre o caso > fork de um arquivo pequeno (template, rule-on-demand) > fork de um workflow inteiro.
3. **Nada é gravado sem o Sim.** O `jarvis fork` grava direto; você só o chama depois de mostrar o conteúdo final e perguntar.
4. **O core não é editado.** Nem o pacote instalado, nem a cópia em `$IDE/` fora do que o CLI faz para rules.
5. **Dados da dor, não da empresa**, em qualquer coisa que saia do workspace (a issue do alcance).

## Fluxo de Trabalho

### 0. Modo

| Argumento | Siga |
|---|---|
| `--list` | Passo 6 |
| `{artefato} --delete` | Passo 7 |
| `{artefato} --update` | Passos 1 a 5 sobre o fork existente (o CLI só compara com o core com `--diff`, que você passa quando a pessoa pedir) |
| `{artefato}` | Passos 1 a 5 e, no fim, o Passo 8 |

Confira o artefato: `jarvis map {nome}` (workflows, skills, agentes) ou `ls` do caminho em `$IDE/`. Nome que não existe: pare com a mensagem do CLI (`⚠️ "{nome}" não é um artefato do core…`).

### 1. Ouvir a dor (uma pergunta por vez, com `AskUserQuestion`)

Antes de perguntar, leia as sessões recentes em `$SESSIONS_DIR/eng/*/` que citem o artefato (`grep -l`): o que já está registrado não se pergunta de novo. Depois:

1. "O que aconteceu da última vez que o `{artefato}` rodou nesta empresa?"
2. "Em que fase ou seção travou (ou fez a coisa errada)?"
3. "O que você fez à mão depois?"

Pare quando a dor couber em uma frase: "o `{artefato}` assume X; aqui é Y".

### 2. Apontar onde encosta

Leia o artefato do core (`$IDE/{tipo}/…`), liste as seções `##`/`###` e diga **em qual** o relato encosta, com link para a linha (`rules-on-demand/doc-links-rules.md`). Exemplo: "o que você descreveu acontece na Fase 2 do `eng-global-pr`, que assume a branch nascendo de `main`".

### 3. Propor, com a conta

`AskUserQuestion` com as opções que cabem, a recomendada primeiro e marcada "(Recomendada)":

| Opção | Quando |
|---|---|
| **Variável do `ENV.md` que já resolve** | A seção já lê uma chave (`BRANCH_BASE`, `TASK_MANAGER`…). Sem fork |
| **Fork de um arquivo pequeno** | Template, rule-on-demand ou rule que a seção lê |
| **Fork do artefato inteiro** | Só quando a mudança está no fluxo em si |

Em cada opção, a conta: linhas copiadas (`wc -l`) e tokens a mais na chamada (≈ bytes ÷ 4; `jarvis tokens` para o total do início da sessão). Diga por que recomenda.

### 4. Simular o efeito

Em texto, antes de gravar: **o que passa a acontecer** e **o que não muda**. Exemplo: "a branch passa a nascer da base que você indicou e o MR aponta para ela; o commit continua pelo padrão do CONTRIBUTING e o comentário no card continua só depois da pergunta".

### 5. Gravar, só com o Sim

1. Mostre o conteúdo final do arquivo como vai ficar **no overlay** (o core + o ajuste), com o caminho `$IDE/overlays/{COMPANY_PROFILE}/{caminho}`.
2. `AskUserQuestion`: **Gravar no overlay?** → **Sim** / **Não**. Com Não, nada é gravado; encerre.
3. Com Sim: `jarvis fork {artefato}` (copia o core com carimbo), depois aplique o ajuste **no arquivo do overlay** (nunca no do core). Rule e rule-on-demand: o CLI já recopia a versão da empresa em `$IDE/rules/` com a marcação; para os outros tipos, a rule de precedência faz valer na próxima chamada.
4. Em `--update`: o fork já existe; aplique o ajuste combinado no arquivo do overlay e rode `jarvis fork {artefato} --update` para recarimbar (sem comparação). Se a pessoa quiser ver o que o core mudou, rode `jarvis fork {artefato} --update --diff`: ele mostra o diff fork × core atual (linhas 🔴 são possível mudança de contrato: sessão, `ENV.md`, template, CLI) e recarimba; o que trazer é decisão dela. Fork **sem carimbo** (arquivo posto à mão no overlay): antes de qualquer coisa, pergunte `Carimbar {artefato} com a versão atual do core, sem alterar o conteúdo?` → **Sim** roda o `--update`; **Não** segue sem carimbar.

### 6. `--list`

Rode `jarvis fork --list` e mostre a saída: caminho, tipo, `forked_from`, `(sem carimbo)` para arquivo posto à mão, `candidato a core` e `⚠️ tipo não resolvido` para pasta fora dos seis tipos. Não compare nada com o core: a lista é a métrica da story (quais arquivos do core cada cliente forkou).

### 7. `--delete`

Mostre o caminho do fork e o `forked_from`. `AskUserQuestion`: **Remover o fork e voltar ao core?** → **Sim** / **Não**. Só com Sim: `jarvis fork {artefato} --delete` (rule volta à versão do core em `$IDE/rules/`).

### 8. Alcance do ajuste (só em fork novo)

`AskUserQuestion`: **Esse ajuste em `{artefato}` é só deste contexto (`{COMPANY_PROFILE}`) ou vale para o core do Jarvis?**

| Resposta | O que fazer |
|---|---|
| **Apenas deste contexto** | Nada mais |
| **Estender para o core** | Monte o texto de uma melhoria com **dados da dor**: comando, fase, o que o default assume, o que quebrou, o ajuste que resolveu. **Sem** o valor de `COMPANY_PROFILE`, nomes de pessoas, URLs de wiki ou trechos de `reference/`. Entregue ao `/jarvis-report-issue` (tipo melhoria), que mostra o texto e só abre com o Sim |
| **Ainda não sei** | `jarvis fork {artefato} --candidate` já no passo 5 (ou recarimbe com `--update` depois de marcar `core_candidate: true` no frontmatter); aparece no `--list` como candidato a core |

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| 8. Alcance do ajuste | `/jarvis-report-issue` | Só com a resposta "Estender para o core", com o texto já sem dados da empresa |

## Regras

### Nunca
- Gravar no overlay (ou chamar `jarvis fork`) sem o **Sim** da pergunta "Gravar no overlay?"
- Editar o core: nem o pacote instalado, nem `$IDE/{tipo}/` à mão
- Forkar o artefato inteiro quando uma variável do `ENV.md` ou um arquivo menor resolve
- Pôr nome de cliente, de pessoa, URL interna ou trecho de `reference/` no texto que vai para a issue
- Comparar fork × core por conta própria: o `--list` nunca compara, e o `--update` só compara com `--diff`, que você passa a pedido da pessoa
- Decidir sozinho o que trazer do core para o fork

### Sempre
- Ler as sessões recentes antes de perguntar
- Apontar a seção exata, com link para a linha
- Mostrar a conta (linhas e tokens) e o efeito simulado antes de gravar
- Usar o mesmo caminho e nome do core (o CLI garante)
- Terminar um fork novo com a pergunta de alcance

## Checklist de Conclusão

- [ ] Dor registrada em uma frase e seção do core apontada com link
- [ ] Opções mostradas com a conta e a recomendação
- [ ] Efeito simulado (o que muda, o que não muda)
- [ ] "Gravar no overlay?" respondida; com Sim, `jarvis fork` rodado e ajuste aplicado só no overlay
- [ ] Rule/rule-on-demand: `$IDE/rules/…` com a linha `> Overlay:`; outros tipos: nada copiado para `$IDE/`
- [ ] Pergunta de alcance respondida; issue (se houver) sem dados da empresa e só com o Sim
- [ ] Nenhum arquivo do core alterado

## Output

- `$IDE/overlays/{COMPANY_PROFILE}/{caminho do artefato}` com `forked_from`, `forked_at` (e `core_candidate`) no frontmatter e o ajuste combinado
- Para rule e rule-on-demand, a cópia em `$IDE/rules/…` ou `$IDE/rules-on-demand/…` com `> Overlay: {COMPANY_PROFILE} (…)`
- Com "Estender para o core": a issue aberta pelo `/jarvis-report-issue` (ou o texto em `.jarvis/issues/`, sem o Sim)

## Mensagem de Conclusão

```
✓ Fork gravado em $IDE/overlays/{COMPANY_PROFILE}/{caminho}
  forked_from: {artefato}@{versão} · forked_at: {data}
  Vale: {na próxima chamada (rule de precedência) | já na IDE, em $IDE/rules/… com a marcação}
  Alcance: {apenas deste contexto | melhoria proposta ao core (#N) | candidato a core (--list)}

Para rever: /jarvis-fork --list · /jarvis-fork {artefato} --update · /jarvis-fork {artefato} --delete
```
