> **Applies to:** HUB: all | POSITION: all | AREA: all | SQUAD: all

# Links clicáveis nos documentos

## Objetivo

Toda citação com lugar exato num documento gerado pelo Jarvis vira um link markdown clicável, que abre o ponto exato no VS Code (nos documentos que saem do workspace, no GitHub/GitLab, regra 6). Vale para requisito, item de documento, código, card e PR. Quem lê decide sem procurar o arquivo, a linha ou o requisito à mão.

## Escopo

Lida pelo comando antes de escrever o documento. A tabela mostra quem lê:

| Documento | Comando |
|---|---|
| `architecture.md`, `plan.md` (inclusive os comentários de fase), `gate-checklist.md` (e as rodadas anteriores `gate-checklist-rodada-{N}.md`), `pull-request.md` | `eng.start`, `eng.plan`, `eng.work`, `eng.pre-pr`, `eng.pr` |
| PRD, FRD, épico, história/tarefa, discovery, breakdown | `prod.spec.prd`, `prod.spec.frd`, `prod.spec.epic`, `prod.spec.issue`, `prod.spec.discovery`, `prod.spec.breakdown`, `prod.spec.clarify` |
| ARD, RFC, SPEC | `prod.spec.ard`, `eng.create-ard`, `eng.create-ard-from-code`, `eng.create-rfc`, `eng.build-tech-spec` |
| Outros documentos gravados por comando (subtarefas, arquitetura leve, relatório de investigação, documentação do repositório (regra 7), revisão, robô, Central docs) | `eng.breakdown-subtasks`, `eng.light-arch`, `eng.debug`, `eng.docs`, `eng.review`, `eng.rpa.robot`, `eng.spec-consolidate` |

## Regras

### Obrigatório

1. **Caminho relativo ao próprio arquivo gravado**, e não à raiz nem à sessão. Conte as pastas do arquivo até a pasta do workspace (a que contém `$IDE/`):

   | Arquivo gravado em | Até o workspace |
   |---|---|
   | `$SESSIONS_DIR/eng/{KEY}/` | `../../../../` |
   | `docs/jarvis/product/prd-{id}-{nome}/` | `../../../../` |
   | `docs/jarvis/product/prd-{id}-{nome}/issues/` | `../../../../../` |
   | `docs/jarvis/engineering/{ARD,RFC,SPEC}/` | `../../../../` |
   | `docs/jarvis/discoveries/` | `../../../` |
   | `$SESSIONS_DIR/prod/{KEY}/` | `../../../../` |

   A tabela supõe `DOCS_FOLDER=docs` e `SESSIONS_DIR=.jarvis/sessions`. Com outros valores, ou com o documento em outra pasta, conte de novo a partir do arquivo.

   Com `WORKSPACE_MODE=workspace`, o código fica dentro da pasta do repositório (`{repo}/…`). Com `project`, a pasta do workspace já é a raiz do repositório, e o caminho do código não leva o prefixo `{repo}/`.
2. **Código:** `` [`{símbolo}` (`{arquivo}:{n}`)]({caminho}#L{n}) ``, ou `#L{a}-L{b}` para um trecho.
   - O símbolo (função, classe, chave, título) entra só quando há um nome estável. Sem nome: `` [`{arquivo}:{n}`]({caminho}#L{n}) ``.
   - As linhas são as do commit base gravado no cabeçalho do documento (no `architecture.md`, a linha `Commit base:`; no modo workspace, um `{repo}@{sha}` por repositório citado). Depois que o código muda, o nome é o guia; a linha original sai com `git show {sha}:{caminho}`.
   - O trecho `#L{a}-L{b}` destaca as linhas no GitHub; no VS Code, o link abre pelo menos na primeira linha do trecho.
3. **Requisito ou item de documento** (`RQT-n`, `feat-00n`, uma seção de PRD/FRD/ARD/RFC/SPEC, as decisões `D1`/`P4` de uma revisão): link para o arquivo com a **âncora do título**, montada a partir do título real:
   1. leia o título no arquivo: `grep -n "^#\+ .*{ID}" {arquivo}`;
   2. passe para minúsculas; mantenha letras (com acento), números, `_`, espaços e hífens; tire o resto (`:`, `—`, parênteses, crases, `/`);
   3. troque **cada** espaço por `-`, sem juntar hífens repetidos;
   4. se o título se repete no arquivo, a segunda ocorrência ganha `-1`, a terceira `-2`.

   Sem o título no arquivo, o link vai só para o arquivo, com o ID no texto.
4. **Card:** URL pela tabela "URL do card" de `rules/engineering/eng.integrations-rules.md` (não copie a tabela). No freelance (`TASK_MANAGER` vazio), o card fica em texto.
5. **PR/MR:** `{remote}/pull/{n}` (GitHub) ou `{remote}/-/merge_requests/{n}` (GitLab), com `{remote}` = `git remote get-url origin` em HTTPS e sem `.git` (remote SSH `git@{host}:{dono}/{repo}.git` → `https://{host}/{dono}/{repo}`). No GitHub, `#n` serve para issue e PR, e o contexto decide ("PR #183"); no GitLab, a issue é `#n` e o MR é `!n`.
6. **Documentos que saem do workspace:** o `pull-request.md` (vira o PR), o `{nome}.public.md` (versão humanizada, `rules/artifact-style-rules.md`), os documentos do Central docs (`feature-*`/`delivery-*`, que podem ser lidos em outro workspace) e o texto publicado no card ou no board (comentário pelo `/eng-global-task-comment`, como o `gate-checklist.md` ou a auditoria do Advisor, e as subtarefas copiadas para o board). Antes de publicar, converta os links relativos do documento de origem.
   - Issue, PR e card como URL.
   - Código como `{remote}/blob/{sha}/{caminho}#L{n}` (GitLab: `{remote}/-/blob/{sha}/…`). O trecho é `#L{a}-L{b}` no GitHub e `#L{a}-{b}` no GitLab.
   - Sessão e `docs/jarvis/` em texto, sem link: quem lê fora do workspace não abre esses arquivos.
   - O `{sha}` é o `HEAD` no momento em que o `eng.pr` escreve o `pull-request.md` (Fase 4.1). Se a conferência de marcas (Fase 3.0) reescrever commits, atualize o sha dos links. Com "Só gerar os arquivos", os links valem quando o push for feito sem rebase.
   - No Central docs, o `{sha}` é o do merge na branch base (a consolidação roda depois do merge).
   - No `.public.md` (gerado no fim do próprio comando, muitas vezes sem push), o `{sha}` é o último commit já enviado ao remoto (`git rev-parse @{u}`), ou o sha do cabeçalho se ele já estiver no remoto. Sem nenhum dos dois, o código fica em texto.
7. **Documento versionado no repositório** (`README.md`, `docs/` do projeto, gravados por exemplo pelo `eng.docs`): o caminho é relativo dentro do próprio repositório (nada de subir até o workspace com `../../{repo}/…`), porque ele é lido no GitHub/GitLab. A sessão e o `docs/jarvis/` ficam em texto, sem link.
8. **Texto que vem do Advisor:** quem registra no documento converte as citações dele (caminho absoluto e linha) no formato desta rule.

### Proibido

- Link sem lugar exato ("o padrão do projeto", "a documentação"): fica em texto.
- Caminho absoluto do disco (`/home/…`) num documento.
- Link relativo para fora do workspace no `pull-request.md` ou no `.public.md`.
- Âncora inventada sem ler o título real.

### Recomendado

- Texto do link curto: o nome do arquivo, a linha e o símbolo, e não o caminho inteiro.
- Na seção de referências, os mesmos links das citações, sem repetir o mesmo arquivo várias vezes.

## Exemplos

Num `architecture.md` em `$SESSIONS_DIR/eng/{KEY}/`, modo workspace:

```markdown
- Requisito: [RQT-5](../../../../docs/jarvis/product/prd-{id}-{nome}/frd-{id}-{nome}.md#rqt-5-upgrade-de-env-antigo-feat-007)
- Decisão com travessão: [D1](../../../../docs/jarvis/product/prd-{id}-{nome}/frd-{id}-{nome}-revisao.md#d1--formas-de-acesso-aos-vendors-alta)
  (`### D1 — Formas de acesso aos vendors (alta)`: o `—` sai e os dois espaços viram `--`)
- Código: [`createMergeRequest` (`api.js:55`)](../../../../{repo}/bin/lib/vcs/api.js#L55)
- Trecho: [`filesystem.js:15-68`](../../../../{repo}/bin/lib/docs/storage/filesystem.js#L15-L68)
- Card: [#124](https://github.com/{dono}/{repo}/issues/124) · Jira: [ABC-12]({URL do card pela tabela de `eng.integrations-rules.md`})
- PR: [PR #183](https://github.com/{dono}/{repo}/pull/183)
```

No `pull-request.md`:

```markdown
- Código: [`api.js:55`](https://github.com/{dono}/{repo}/blob/{sha}/bin/lib/vcs/api.js#L55)
- Decisões: no `architecture.md` da sessão (texto, sem link)
```

## Exceções

- Com `ARTIFACT_STYLE=human-generated`, a versão humanizada segue a regra 6. O documento original segue as demais regras.
- No modo project, o caminho do código sai da raiz do repositório, sem o prefixo `{repo}/` (regra 1).

## Referências

- `rules/engineering/eng.integrations-rules.md`: tabela "URL do card"
- `rules/artifact-style-rules.md`: versão humanizada e o `pull-request.md`
- `workflows/engineering/eng.pr.md`: Fases 3.0 e 4.1 (sha do PR)
