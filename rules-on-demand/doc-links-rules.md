> **Applies to:** HUB: all | POSITION: all | AREA: all | SQUAD: all

# Links clicáveis nos documentos

## Objetivo

Toda citação com lugar exato num documento gerado pelo Jarvis vira um link markdown clicável, que abre o ponto exato no VS Code (e no GitHub). Vale para requisito, item de documento, código, card e PR. Quem lê decide sem procurar o arquivo, a linha ou o requisito à mão.

## Escopo

Lida pelo comando antes de escrever o documento. A tabela mostra quem lê:

| Documento | Comando |
|---|---|
| `architecture.md`, `plan.md`, `gate-checklist.md`, `pull-request.md` | `eng.start`, `eng.plan`, `eng.pre-pr`, `eng.pr` |
| PRD, FRD, épico, história/tarefa, discovery, breakdown | `prod.spec.prd`, `prod.spec.frd`, `prod.spec.epic`, `prod.spec.issue`, `prod.spec.discovery`, `prod.spec.breakdown`, `prod.spec.clarify` |
| ARD, RFC, SPEC | `prod.spec.ard`, `eng.create-ard`, `eng.create-ard-from-code`, `eng.create-rfc`, `eng.build-tech-spec` |

## Regras

### Obrigatório

1. **Caminho relativo ao próprio arquivo gravado**, e não à raiz nem à sessão. Conte as pastas do arquivo até a pasta do workspace (a que contém `$IDE/`):

   | Arquivo gravado em | Até o workspace |
   |---|---|
   | `$SESSIONS_DIR/eng/{KEY}/` | `../../../../` |
   | `docs/jarvis/product/prd-{id}-{nome}/` | `../../../../` |
   | `docs/jarvis/product/prd-{id}-{nome}/issues/` | `../../../../../` |
   | `docs/jarvis/engineering/{ARD,RFC,SPEC}/` | `../../../../` |

   Com `WORKSPACE_MODE=workspace`, o código fica dentro da pasta do repositório (`{repo}/…`). Com `project`, a pasta do workspace já é a raiz do repositório.
2. **Código:** `` [`{símbolo}` (`{arquivo}:{n}`)]({caminho}#L{n}) ``, ou `#L{a}-L{b}` para um trecho.
   - O símbolo (função, classe, chave, título) entra só quando há um nome estável. Sem nome: `` [`{arquivo}:{n}`]({caminho}#L{n}) ``.
   - As linhas são as do commit base gravado no cabeçalho do documento. Depois que o código muda, o nome é o guia; a linha original sai com `git show {sha}:{caminho}`.
3. **Requisito ou item de documento** (`RQT-n`, `feat-00n`, uma seção de PRD/FRD/ARD/RFC/SPEC, as decisões `D1`/`P4` de uma revisão): link para o arquivo com a **âncora do título**, montada a partir do título real:
   1. leia o título no arquivo: `grep -n "^#\+ .*{ID}" {arquivo}`;
   2. passe para minúsculas; mantenha letras (com acento), números, espaços e hífens; tire o resto (`:`, `—`, parênteses, crases, `/`);
   3. troque **cada** espaço por `-`, sem juntar hífens repetidos;
   4. se o título se repete no arquivo, a segunda ocorrência ganha `-1`, a terceira `-2`.

   Sem o título no arquivo, o link vai só para o arquivo, com o ID no texto.
4. **Card:** URL pela tabela "URL do card" de `rules/engineering/eng.integrations-rules.md` (não copie a tabela). No freelance (`TASK_MANAGER` vazio), o card fica em texto.
5. **PR/MR:** `{remote}/pull/{n}` (GitHub) ou `{remote}/-/merge_requests/{n}` (GitLab), com `{remote}` = `git remote get-url origin` em HTTPS e sem `.git`. No GitHub, `#n` serve para issue e PR: o contexto decide ("PR #183").
6. **Documentos que saem do workspace:** o `pull-request.md` (vira o PR) e o `{nome}.public.md` (versão humanizada, `rules/artifact-style-rules.md`).
   - Issue, PR e card como URL.
   - Código como `{remote}/blob/{sha}/{caminho}#L{n}` (GitLab: `{remote}/-/blob/{sha}/…`).
   - Sessão e `docs/jarvis/` em texto, sem link: quem lê fora do workspace não abre esses arquivos.
   - O `{sha}` é o `HEAD` no momento em que o `eng.pr` escreve o `pull-request.md` (Fase 4.1). Se a conferência de marcas (Fase 3.0) reescrever commits, atualize o sha dos links. Com "Só gerar os arquivos", os links valem quando o push for feito sem rebase.
7. **Texto que vem do Advisor:** quem registra no documento converte as citações dele (caminho absoluto e linha) no formato desta rule.

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
- Card: [#124](https://github.com/{dono}/{repo}/issues/124) · Jira: [ABC-12]({TASK_MANAGER_URL_BASE}/browse/ABC-12)
- PR: [PR #183](https://github.com/{dono}/{repo}/pull/183)
```

No `pull-request.md`:

```markdown
- Código: [`api.js:55`](https://github.com/{dono}/{repo}/blob/{sha}/bin/lib/vcs/api.js#L55)
- Decisões: no `architecture.md` da sessão (texto, sem link)
```

## Exceções

- Com `ARTIFACT_STYLE=human-generated`, a versão humanizada segue a regra 6. O documento original segue as regras 1 a 5.
- Documento que nunca sai do workspace e cita só o próprio repositório pode usar o caminho do repositório (modo project).

## Referências

- `rules/engineering/eng.integrations-rules.md`: tabela "URL do card"
- `rules/artifact-style-rules.md`: versão humanizada e o `pull-request.md`
- `workflows/engineering/eng.pr.md`: Fases 3.0 e 4.1 (sha do PR)
