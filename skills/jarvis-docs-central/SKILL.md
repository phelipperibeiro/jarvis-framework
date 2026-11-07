---
name: jarvis-docs-central
description: Integração com o Central docs (o registro do implementado, com um documento por funcionalidade e um por entrega, gerados pelo /eng.spec-consolidate), num adaptador de armazenamento (pasta do disco, git opcional). Busca, publica e indexa pelo CLI jarvis docs.
argument-hint: "[contexto da tarefa]"
allowed-tools: Bash Read Write
disable-model-invocation: false
metadata:
  author: jarvis-team
  version: "5.0"
  area: global
---

# jarvis-docs-central

## Objetivo

Integrar os comandos do framework com o **Central docs**: o registro do que **de fato foi implementado** em cada produto do squad, com um índice (`{SQUAD}/index.md`) que os outros comandos consultam.

**Duas camadas de documentação:**

| Camada | O que é | Onde fica |
|---|---|---|
| Documentos de trabalho | PRD, FRD, épicos, histórias, ARD, RFC, SPEC, QA, swagger, robôs, C4: o que se pretende e se discute, **enquanto não estão ligados a uma entrega consolidada** | `$JARVIS_DOCS` (`$PROD_DOCS`, `$ENG_DOCS`), fora do versionamento |
| Sessões | `$SESSIONS_DIR/eng/{card}/`: `architecture.md`, `plan.md`, `context.md`, rodadas do pré-PR, scripts e saídas. **Vão inteiras para o Central docs** depois da entrega (#229), e a pasta pode ser apagada | `$SESSIONS_DIR` (rascunho local, fora do versionamento) |
| **Central docs** | O que foi implementado: um documento **completo e autossuficiente** por funcionalidade (estado atual), um **registro por entrega** (PR, commits, autores), o conteúdo transversal do produto, o histórico de cada entrega e os documentos de trabalho **já ligados** a uma entrega consolidada | Pasta do Central docs (adaptador), por funcionalidade |

Quem escreve no Central docs é o **`/eng.spec-consolidate`** (agente `eng.docs-consolidator.agent`), depois do merge do PR. Um documento de trabalho **só** chega lá quando está ligado a uma entrega consolidada (Q1 da #220); o que não está ligado continua em `$JARVIS_DOCS`, intocado.

**Modos deste skill:**
- buscar o que já foi implementado (Modo 1);
- publicar a consolidação (Modo 2);
- reparar o índice (Modo 3).

## Adaptadores de armazenamento

`CENTRAL_DOCS_STORAGE` escolhe o adaptador e `CENTRAL_DOCS_LOCATION` diz onde ele guarda. Os comandos são sempre os mesmos (`jarvis docs fetch | sync | publish`).

| `CENTRAL_DOCS_STORAGE` | `CENTRAL_DOCS_LOCATION` | Situação |
|---|---|---|
| `filesystem` (**padrão**) | Pasta (relativa à pasta do workspace ou absoluta) | Disponível |
| *(vazio)* | — | Desligado: os comandos pulam em silêncio; o `/eng.spec-consolidate` orienta ligar |
| `s3`, `gdrive` | — | Ainda não suportados (#144, #145) |

**Camada git do `filesystem`:** se a pasta tiver `.git` (clone de um repositório de documentação):
- antes de ler: `git pull --ff-only` em `CENTRAL_DOCS_REF` (se falhar, avisa e lê a cópia local);
- ao publicar: branch → cópia → índice → commit → push → PR para `CENTRAL_DOCS_TARGET_BRANCH`.

Sem `.git`, grava direto na pasta.

**Onde fica a pasta** (o `/jarvis-init` configura no Passo 5.2): `$JARVIS_DOCS/central-docs` (padrão do template; hoje `docs/jarvis/central-docs`; o valor escrito por extenso em um `ENV.md` antigo continua valendo), nos dois modos de trabalho, junto dos documentos de trabalho (no projeto único, coberto por `$JARVIS_DOCS/` no `.gitignore`; no modo workspace a raiz não é versionada). Nunca no versionamento de um repositório de código.

## Pré-condição

Ler do `$IDE/ENV.md`:
- `CENTRAL_DOCS_STORAGE` e `CENTRAL_DOCS_LOCATION` (vazio: encerrar em silêncio)
- `CENTRAL_DOCS_REF`, `CENTRAL_DOCS_TARGET_BRANCH` (só com `.git`)
- `SQUAD` (ALL-CAPS-COM-HIFEN) e `WORKSPACE` (vira a pasta do produto)

O `jarvis docs publish` só roda depois da pergunta do `/eng.spec-consolidate` (regra de ouro, `rules/engineering/eng.integrations-rules.md`).

Com `.git`, o PR é aberto pela CLI do host (`gh pr create` / `glab mr create`), com o login dela, respeitando o `VERSION_CONTROL_ACCESS` do `ENV.md` do projeto (não do repositório do Central docs). Sem a CLI, sem login, ou com `manual`/valor inválido/ENV.md ilegível, a branch fica no remote e a publicação mostra o link para abrir o MR à mão. ❌ **Nunca** colar token no chat nem gravar no `ENV.md`.

---

## Estrutura do Central docs

Por **funcionalidade** (Q2 da #220), no padrão do Confluence (uma página por documento, pastas como páginas pai, hierarquia rasa):

```
{SQUAD}/
├── index.md                              # GERADO a cada publicação — não editar à mão
├── home.md                               # Página inicial do squad: criada uma vez, nunca sobrescrita
└── {produto}/                            # WORKSPACE do ENV.md (ou --produto)
    ├── {produto}.md                      # Página do produto: o que é transversal a mais de uma funcionalidade
    ├── history/
    │   └── {task_key}/                   # A sessão dessa entrega (#229)
    │       ├── {task_key}.md             # Página-índice da sessão: o que fez, funcionalidades, artefatos, ausentes e fontes
    │       ├── context.md, gate-checklist*.md, pull-request.md, daily.md, task-comment-*.md…
    │       └── fontes/, ferramentas/, … # Subpastas da sessão, com o caminho relativo preservado
    └── {funcionalidade}/                 # Slug da funcionalidade (ex.: checkout)
        ├── {funcionalidade}.md           # A página: estado atual, completo
        ├── deliveries/
        │   └── delivery-{AAAA-MM-DD}-{task_key}[-{funcionalidade}].md
        ├── decisions/                    # Documentos de trabalho ligados a uma entrega consolidada (Q1) e architecture/plan/light-arch da sessão, com o card no nome (architecture-{card}.md)
        └── archive/                      # Originais, fora do índice — rede de segurança antes do Sim final
```

- Templates: `templates/engineering/central-feature-template.md` (12 seções), `central-delivery-template.md`, `central-session-template.md` (página-índice da sessão), `central-product-template.md` e `central-home-template.md`.
- `related_docs`/`feature` citam só o **basename**.
- **Uma funcionalidade só é quebrada quando o documento de trabalho cobre mais de uma** (ver "Regra de separação por funcionalidade", abaixo).

### Frontmatter obrigatório (validado no `publish`)

| Tipo | Campos |
|------|--------|
| `feature` | `id`, `name`, `status`, `product`, `updated_at` |
| `delivery` | `id`, `feature`, `task_key`, `pr`, `date` |
| `product` | `id`, `name`, `updated_at` |
| `home` | `name` |
| `prd`, `frd`, `feat`, `epic`, `story`, `task`, `ard`, `rfc`, `discovery`, `qa-report` | O próprio frontmatter do documento (templates de `$JARVIS_DOCS`) |
| `swagger`, `history`, `architecture`, `plan`, `light-arch` | Nenhum campo exigido (os arquivos da sessão não têm frontmatter; a página-índice da sessão usa o do `central-session-template.md`, sem campo obrigatório) |

Status da funcionalidade: a lista de produto (`icebox`, `in_review`, `backlog`, `in_progress`, `in_production`, `cancelled`, `deprecated`). `labels` (opcional, em todos os tipos): minúsculas, no singular, sem espaço (ex.: `arquitetura`, `decisao`) — padrão Confluence.

### Regra de separação por funcionalidade (Q9 da #220)

Um documento de trabalho (`decisions/`) às vezes cobre **mais de uma** funcionalidade (ex.: o `architecture.md` de uma sessão com várias entregas). Antes de publicar:

1. **Mapeie primeiro, escreva depois.** O agente propõe, para cada funcionalidade citada, qual trecho é dela; nunca inventa conteúdo nem deixa parte de fora.
2. **Uma parte por funcionalidade só com o que é dela.** Nome publicado: `{tipo}-{card}-{funcionalidade}.md` para os documentos da sessão (ex.: `architecture-229-checkout.md`; o CLI monta o nome) e `{tipo}-{funcionalidade}.md` para os demais. Cada parte vai para `decisions/` da sua própria funcionalidade.
3. **Cabeçalho comum em cada parte:** a issue, o MR/PR e links para as partes irmãs (mesma entrega, outras funcionalidades) — a mesma issue e o mesmo MR são citados em todas. No frontmatter, o campo `sibling_parts` (lista dos caminhos das outras partes em `decisions/`) é reconhecido, mas não exigido — quem publica preenche quando o documento foi de fato quebrado.
4. **O que é transversal** (não pertence a uma funcionalidade só) vai para `{produto}/{produto}.md`, e cada parte linka essa página em vez de repetir o texto.
5. **O documento inteiro, sem quebrar, vai para `archive/`** de cada funcionalidade citada — é a rede de segurança até o Sim final de remoção. A cópia em `archive/` ganha, no frontmatter, `origin` (caminho de origem) e `original_status` (o status do documento antes de arquivar) — gravados pelo próprio `jarvis docs archive`, para a restauração manual (Q14).
6. **Documento de uma funcionalidade só não é quebrado:** o original inteiro é o que vai para `decisions/` (Q12).

### Índice

O `{SQUAD}/index.md` é **regenerado** a cada publicação:
- a página de cada produto (`{produto}/{produto}.md`), se existir;
- cada funcionalidade com página publicada (status, nome, data da última atualização);
- as **10 entregas mais recentes** de cada produto, deduplicadas por `task_key` (uma entrega quebrada em partes, Q9, cita o mesmo `task_key` em mais de uma funcionalidade e entra uma vez só).

`decisions/`, `archive/`, `history/` e `home.md` ficam **fora** do índice: não são "o que foi implementado", são o rastro de como se chegou lá (ou, no caso do `home.md`, uma página mantida à mão).

Com `.git` e um `scripts/build-index.sh` no repositório de documentação, o adaptador usa o script dele.

```markdown
# CORE

## loja

> [Loja](loja/loja.md)

- [checkout](loja/checkout/checkout.md) | in_production | Checkout | 2026-10-15

> Entregas recentes

- [delivery-2026-10-15-task-123.md](loja/checkout/deliveries/delivery-2026-10-15-task-123.md) | TASK-123 | 2026-10-15
```

---

## Quando Usar

- `/warm-up`, `/eng.start`, `/prod.spec.*`, `/eng.create-ard*`, `/eng.create-rfc`, `/eng.build-tech-spec`: conhecer o que **já foi implementado** (Modo 1)
- `/eng.spec-consolidate`: publicar a consolidação de uma entrega ou a carga inicial (Modo 2)
- Índice ausente ou divergente (Modo 3)
- `/jarvis-init` (Upgrade C): Central docs ainda no layout antigo (Modo 4)

---

## Fluxo de Trabalho

### Modo 1: Buscar o que foi implementado

```bash
jarvis docs sync                                           # resumo: funcionalidades e entregas recentes
jarvis docs fetch {SQUAD}/index.md
jarvis docs fetch {SQUAD}/{produto}/checkout/checkout.md
```

1. Buscar o índice do squad.
2. Identificar as funcionalidades relacionadas à tarefa (nome, produto, card citado no histórico).
3. Buscar cada `feature-*` com `jarvis docs fetch` (e um `delivery-*`, se o detalhe de uma entrega importar).
4. Devolver o resumo: funcionalidades, status e o que cada uma faz hoje.

Os documentos de trabalho da tarefa (PRD, FRD, ARD, RFC, SPEC) moram em `$PROD_DOCS`/`$ENG_DOCS`: leia-os primeiro de lá. **Não achou?** Desde a #220, um documento ligado a uma entrega consolidada pode ter sido removido de `$JARVIS_DOCS` (`--finalize`/`--force`) depois de publicado em `decisions/`. Busque pelo mesmo basename em `jarvis docs fetch {SQUAD}/{produto}/{funcionalidade}/decisions/{basename}`, na funcionalidade já identificada no passo 2. Enquanto o documento ainda existir em `$JARVIS_DOCS`, é essa versão que vale, não a cópia publicada (Q13 da #220).

### Modo 2: Publicar a consolidação

Feito pelo `/eng.spec-consolidate`, depois do **Sim** do usuário — em três passos, cada um numa execução própria (Q3/Q15 da #220):

```bash
jarvis docs publish --file .../consolidation/feature-checkout.md --tipo feature
jarvis docs publish --file .../consolidation/delivery-2026-10-15-task-123.md --tipo delivery --feature checkout
```

- **Tipos aceitos:** `feature`, `delivery`, `product`, `history`, `home` e os documentos de trabalho (`prd`, `frd`, `feat`, `epic`, `story`, `task`, `ard`, `rfc`, `spec`, `swagger`, `qa-report`, `discovery`) **quando ligados a uma entrega consolidada** (Q1) — o que não está ligado fica em `$JARVIS_DOCS`, sem passar por aqui. Da sessão (#229): `architecture`, `plan` e `light-arch` (em `decisions/`, nomeados `{tipo}-{card}.md`) e `history` para o resto, com `relPath` para preservar subpastas.
- **Campos do manifesto** (`--manifest`): `file` (relativo à pasta do manifesto), `tipo`, `feature`, `taskKey`, `relPath` (só `history`), `fromSession` (arquivo vindo da sessão: versiona por hash, converte os links do `.md` e libera a remoção só dentro da pasta do card), `confirmed` (a pessoa aprovou o arquivo sinalizado: não é `.md`, binário, acima de 1 MB ou com possível segredo; sem isso o CLI recusa publicá-lo), `originalPath` (o arquivo na sessão ou em `$JARVIS_DOCS`, base do `--archive`/`--finalize` e dos links). O `publish` grava de volta `publishedAs` (destino efetivo, com `-vN` se o conteúdo mudou) e `publishedHash`.
- **`--dry-run`** (com `--manifest`): simula e mostra, por arquivo, **novo**, **igual**, **nova versão** ou **sobrescreve**, sem gravar nada nem mudar o manifesto.
- **Versionamento (`-v1`, `-v2`…):** só para arquivos da sessão. Conteúdo igual ao já publicado não cria nada; conteúdo diferente entra como a próxima versão livre e a anterior permanece (sem mesclar). `feature-*`, `delivery-*` e `product` são "estado atual" e continuam sendo sobrescritos.
- **Links:** os `.md` da sessão chegam ao Central docs com os links convertidos (regra 6 de `doc-links-rules.md`): arquivo da mesma entrega vira link relativo dentro do Central docs; código vira `{remote}/blob/{sha do commit base}/…`; sessão e `$JARVIS_DOCS` viram texto. O original não muda. Links relativos que ainda não resolvem dentro do Central docs geram um aviso.
- **`--feature <slug>`:** opcional para `feature` (se o arquivo seguir `feature-{slug}.md`); obrigatório para `delivery` e para os documentos de trabalho — é a funcionalidade dona da pasta. Um documento que cobre mais de uma funcionalidade segue a "Regra de separação" acima **antes** de publicar, uma chamada por parte.
- **`--task-key <chave>`:** obrigatório para `--tipo history`.
- `--produto` troca o `WORKSPACE`.

**Fluxo (três passos, reaproveitando o `publish` acima para cada arquivo):**
1. **Publicar** (este Modo): validar o frontmatter, calcular o destino pela estrutura por funcionalidade. Sem `.git`: copiar e regenerar o índice. Com `.git`: branch, cópia, índice, commit, push e PR (só depois da pergunta, regra de ouro). Só copia; os originais continuam onde estão.
2. **Arquivar** (`--archive` do `/eng.spec-consolidate`): guarda os originais em `archive/`, sem apagar nada.
3. **Finalizar** (`--finalize`): apaga os originais das pastas de trabalho **e os arquivos da sessão**, só depois de validado — ou `--force` para fazer os três de uma vez, sem perguntar e sem guardar em `archive/` (zero reversão). Arquivo de sessão só é apagado dentro da pasta `$SESSIONS_DIR/eng/{card}/` do próprio card, e o `--force` ainda confere que a cópia publicada existe e bate o hash. Depois do finalize completo, o workflow **oferece apagar a pasta da sessão** (pergunta própria).

### Inventário das sessões (só leitura)

`jarvis docs sessions` lista cada sessão de `$SESSIONS_DIR/eng/` com os arquivos, o que falta (`architecture.md`, `plan.md`, `context.md`), se a entrega já está no Central docs (`delivered`) e se a página-índice já foi publicada (`capituloPublicado`; sem ela a sessão está **pendente**). `--json` dá os dados, `--pendentes` filtra e `--proxima` imprime o card da próxima pendente: é o estado do modo "uma sessão por vez". Não escreve nada nem usa a rede.

### Modo 3: Reparar o índice

- **Sem `.git`:** a próxima publicação regenera o índice.
- **Com `.git`:** no clone, rodar `bash scripts/build-index.sh` (se existir) e abrir um PR `repair/index-{SQUAD}-{data}` (só depois de mostrar o que será enviado e perguntar, regra de ouro).

### Modo 4: Migrar o layout antigo

Quem já tinha o Central docs no layout anterior (`{SQUAD}/product/{produto}/feature-*.md`, `{SQUAD}/engineering/{produto}/delivery-*.md`) migra para a estrutura por funcionalidade com:

```bash
jarvis docs migrate                 # dry-run: só mostra o plano, nada muda
jarvis docs migrate --apply          # move de verdade; guarda uma cópia antes
```

Só move e reorganiza, nunca reescreve conteúdo. Entrega citada por mais de uma funcionalidade (Q9) **não é movida** pelo comando: ela entra na lista "exige quebra", para o agente separar, uma a uma, com revisão (o `/jarvis-init`, Upgrade (C), oferece os dois passos — ver `jarvis-init/assets/upgrade.md`).

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| — | Nenhuma — skill autocontida | — |

## Migração para o Confluence

O Central docs foi organizado para migrar ao Confluence sem refazer o conteúdo:

- **Uma página por documento** (Markdown); a **pasta é a página-pai**: a página da funcionalidade é a pai de `deliveries/` e `decisions/`, e a página-índice da sessão (`history/{card}/{card}.md`) é a pai dos artefatos dela.
- **Hierarquia rasa**: `{SQUAD}/{produto}/{funcionalidade}/…` (até 4 níveis); a sessão fica em `history/{card}/`, sem duplicar arquivos de cards que tocam várias funcionalidades.
- **Links relativos que resolvem dentro do Central docs**, nunca para o workspace (o CLI converte na publicação e avisa dos que não resolvem).
- **Labels** no padrão do Confluence (minúsculas, no singular, sem espaço) e `status` no frontmatter.
- Arquivos que não são Markdown (`.txt`, `.json`, scripts) viram **anexos** da página-índice da sessão, que os lista.
- Nada é enviado ao Confluence: esta skill só organiza.

---

## Regras

### Nunca

- Publicar documento de trabalho **sem** vínculo com uma entrega consolidada (Q1) — ele fica em `$JARVIS_DOCS`
- Quebrar (Q9) um documento de uma funcionalidade só, ou inventar/perder conteúdo ao separar as partes
- Publicar sem o Sim do usuário (Modo 2 é sempre pelo `/eng.spec-consolidate`); `--finalize`/`--force` sem o Sim do passo correspondente
- Editar `{SQUAD}/index.md` à mão, ou sobrescrever `home.md` depois que ele já existe
- Push direto para a branch base quando a pasta tem `.git` (sempre por PR)
- Inventar metadados; incluir e-mails, tokens ou valores de variáveis
- Colocar o Central docs no versionamento de um repositório de código

### Sempre

- Ler e publicar só pelo CLI (`jarvis docs fetch | sync | publish | migrate`)
- Se o Central docs tiver `AGENTS.md` na raiz, lê-lo antes de operar
- Usar `SQUAD` em ALL-CAPS-COM-HIFEN

---

## Troubleshooting

| Mensagem | Causa | O que fazer |
|---|---|---|
| `Central docs desligado (CENTRAL_DOCS_STORAGE vazio)` | Desligado no ENV | `/jarvis-init` → Passo 5.2 |
| `… não é mais usado. Rode o /jarvis-init e escolha Upgrade (C)` | `ENV.md` da versão anterior | `/jarvis-init` → Upgrade (C) |
| `Armazenamento "s3" ainda não suportado` | Valor de `STORAGE` sem adaptador | Use `filesystem` |
| `Pasta do Central docs não encontrada` | `LOCATION` errado ou pasta não criada | Criar a pasta ou ajustar `LOCATION` |
| `Arquivo não encontrado no Central docs: {SQUAD}/index.md` | Squad sem consolidação ainda | `/eng.spec-consolidate --inicial` ou consolidar a próxima entrega |
| `O tipo "…" precisa de --feature <slug>` | `delivery` ou documento de trabalho sem a funcionalidade dona | Informar `--feature` (a página de qual funcionalidade o documento liga) |
| `O tipo "history" precisa de --task-key <chave>` | Publicação de rodada/comentário/diário sem a chave da entrega | Informar `--task-key` |
| `Campos obrigatórios ausentes` | Frontmatter incompleto | Completar conforme a tabela |
| `Labels fora do padrão` | `labels` com maiúscula, espaço ou símbolo fora de letras/números/hífen | Corrigir para minúsculas, no singular, sem espaço |
| `destino já existe (…), não sobrescrito` (`jarvis docs migrate --apply`) | Já existe arquivo no caminho novo | Conferir se não é duplicidade; mover à mão se for intencional |
| `git pull`/`push` falhou (com `.git`) | Rede, permissão ou pasta suja | `git status` na pasta; o commit local fica para repetir |
| `MR não aberto (…)` (com `.git`) | CLI do host ausente ou sem login; `VERSION_CONTROL_ACCESS` `manual` ou inválido; ENV.md ambíguo | Abrir o MR pelo link da mensagem, ou fazer o login da CLI / corrigir o `ACCESS` / passar `--ide` ou `--env-file` |
