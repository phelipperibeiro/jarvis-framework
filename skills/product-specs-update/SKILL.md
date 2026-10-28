---
name: product-specs-update
description: >
  Sincroniza especificações de produto (PRD/FRD) em cascata e mantém o
  índice local de specs (`$PROD_DOCS/specs-index.md`) atualizado. Trigger:
  quando um PRD ou FRD é criado ou modificado, ou quando o usuário pede para
  sincronizar ou indexar specs.
argument-hint: "[path-do-arquivo-criado-ou-modificado]"
disable-model-invocation: false
allowed-tools: Read Write Edit Grep Glob Bash
license: AGPL-3.0
metadata:
  author: jarvis-team
  version: "2.0"
  area: product
---

# Update Specs — Sincronização de Especificações de Produto

## Objetivo

Manter PRDs, FRDs e o índice de specs sempre consistentes. Quando uma spec
muda, você propaga em cascata (a seção `## Solução` do PRD e o `related_prd`
da FRD) e atualiza o índice local do projeto (`$PROD_DOCS/specs-index.md`).

O índice é só local: PRD e FRD são documentos de trabalho e não vão para o
Central docs, que guarda só o que foi implementado (`feature-*` e
`delivery-*`, publicados pelo `/eng.spec-consolidate`). Para saber o que já
foi implementado, leia o índice do Central docs com
`jarvis docs fetch {SQUAD}/index.md` (skill `jarvis-docs-central`); este skill
não escreve nada lá.

## Entrada

- `$ARGUMENTS` — (Opcional) Path do arquivo criado ou modificado.

## Recursos

- `rules/product/prod-rules.md`: layout de `$PROD_DOCS` e status das specs
- `templates/product/prod-prd-template.md` e `prod-frd-template.md`: frontmatter (`id`, `name`, `status`, `related_prd`)
- Template do índice local: seção "Templates", abaixo

---

## Pré-requisito — Carregar ENV.md

Antes de qualquer ação, ler o `$IDE/ENV.md`. `$IDE` é a pasta da IDE ativa
(`.claude/`, `.cursor/`, `.windsurf/`…), e não o valor de `IDE=` do `ENV.md`:
troque-a pela pasta real antes de rodar.
```bash
cat "$IDE/ENV.md"
```

Resolver `$PROD_DOCS` até o caminho real, expandindo as variáveis do próprio
`ENV.md` (ex.: `PROD_DOCS=$JARVIS_DOCS/$PROD_FOLDER_NAME` → `docs/jarvis/product`,
relativo à pasta do workspace). Os comandos abaixo usam esse caminho, entre
aspas. Se `$PROD_DOCS` ficar vazio, pare e avise: um `grep -r` sem caminho lê
a entrada padrão e fica parado.

Se não existir um `ENV.md`, crie executando a skill `jarvis-init` com Skill tool.

---

## Quando Usar

- Um PRD ou FRD foi criado ou modificado (pelos `/prod.spec.*` ou à mão)
- O usuário pede para sincronizar specs ou reconstruir o índice local

**Não usar** para publicar specs ou índice no Central docs: ele recebe só a
consolidação do `/eng.spec-consolidate`.

## Padrões Críticos

- **Frontmatter, não a linha solta.** Leia `id`, `name`, `status` e
  `related_prd` só do bloco entre os dois primeiros `---`. O `related_prd`
  aparece de vários jeitos e todos valem: vazio, `[]`, `PRD-001` na mesma
  linha ou lista em várias linhas (`related_prd:` seguido de `  - PRD-001`).
  Só trate como vazio depois de olhar as linhas de baixo.
- **FRD é quem tem `id: FRD-`.** Breakdowns, revisões e arquivos de `issues/`
  também podem ter `related_prd`, mas não são FRDs.
- **Spec é identificada pelo caminho.** O mesmo `id` pode existir em pastas
  diferentes (dois `PRD-001`). Liste as duas e avise o id repetido; nunca
  junte nem descarte nenhuma.
- **Só local.** Nada é publicado fora da máquina; toda gravação mostra o
  diff e aguarda confirmação.

Leitura do frontmatter (usada em todos os passos):
```bash
# Bloco do frontmatter
awk '/^---[[:space:]]*$/{n++; next} n==1' "{arquivo}"

# Só os PRDs do related_prd, em qualquer um dos formatos (um por linha; "[]" = vazio)
awk '/^---[[:space:]]*$/{n++; next} n==1' "{arquivo}" \
  | awk '/^related_prd:/{p=1; sub(/^related_prd:[[:space:]]*/,""); if($0!="")print; next} p&&/^[[:space:]]+-/{sub(/^[[:space:]]+-[[:space:]]*/,""); print; next} {p=0}'
```

---

## Árvore de Decisão
```
$ARGUMENTS fornecido?
  → SIM: Ler frontmatter do arquivo
      id começa com "PRD"? → Fluxo PRD  
      id começa com "FRD"? → Fluxo FRD  
      Nem um nem outro?    → Avisar e encerrar
  → NÃO: Ir direto para Reconstrução do Índice
```

---

## Fluxo de Trabalho

### 1. Fluxo FRD — quando uma FRD foi criada ou modificada

Extrair do frontmatter `id`, `name`, `status` e `related_prd` (ver "Padrões
Críticos").

**Se `related_prd` estiver ausente ou vazio** (sem nenhum `PRD-xxx` em
nenhum dos formatos), perguntar:
```
A FRD "{id}: {name}" não tem PRD pai definido.
→ Qual é o id do PRD relacionado? (ex.: PRD-001)
```
Atualizar o frontmatter da FRD com o id informado antes de continuar.

**Abrir o PRD referenciado** e verificar a seção `## Solução`. Se houver mais
de um PRD com esse id, use o da mesma pasta da FRD; sem PRD na mesma pasta,
pergunte qual é:

- FRD **não aparece na lista** → Adicionar entry:
  `- **[{id}]({path_relativo}) ({status}):** {name}`
- FRD **já aparece** → Corrigir status se divergente. Não alterar mais nada.

Mostrar diff proposto ao usuário. Aguardar confirmação antes de escrever.

---

### 2. Fluxo PRD — quando um PRD foi criado ou modificado

Extrair do frontmatter `id`, `name` e `status`.

Buscar as FRDs de todo o `$PROD_DOCS` (na pasta do PRD ou em pasta própria):
```bash
grep -rlE --include="*.md" --exclude-dir=issues "^id: FRD-" "$PROD_DOCS"
```

Ficar só com as que têm o id deste PRD no `related_prd`. Se o id do PRD se
repete em outra pasta, ficar só com as FRDs da mesma pasta deste PRD e
perguntar sobre as de pasta própria. Para cada FRD encontrada, verificar na
seção `## Solução` do PRD se o entry está presente e com status correto.
Atualizar divergências.

Mostrar diff proposto ao usuário. Aguardar confirmação antes de escrever.

---

### 3. Reconstrução do Índice

Executado sempre após os fluxos acima, ou diretamente quando `$ARGUMENTS`
está vazio.

#### 3.1 Escanear specs locais
Layout de `$PROD_DOCS` (`prod-rules.md`): cada PRD fica em
`prd-{id}-{nome}/prd-{id}-{nome}.md`, com as FRDs na mesma pasta
(`frd-{id}-{nome}.md`); uma FRD sem PRD pai pode ter pasta própria
(`frd-{id}-{nome}/`). A varredura é recursiva e lê o `id` do frontmatter:
```bash
# PRDs e FRDs em qualquer pasta de $PROD_DOCS (épicos e histórias de issues/ ficam de fora)
grep -rlE --include="*.md" --exclude-dir=issues "^id: (PRD|FRD)-" "$PROD_DOCS"
```

Arquivos sem `id: PRD-`/`id: FRD-` (revisões, breakdowns) ficam de fora.

Para cada arquivo, extrair do frontmatter `id`, `name`, `status` e, nas FRDs,
`related_prd` (ver "Padrões Críticos").

Identificar cada spec pelo **caminho**, e não só pelo `id`. Com id repetido,
listar as duas no índice e avisar o usuário. Para pôr uma FRD sob o PRD certo
em "Relação PRD → FRDs": o PRD com o id do `related_prd` na mesma pasta da
FRD; se não houver um na mesma pasta e o id se repetir, perguntar ao usuário
em vez de escolher. FRD sem `related_prd` vai para "FRDs sem PRD pai".

#### 3.2 Obter projeto e repositório para cada PRD

Se o índice local já existir (`$PROD_DOCS/specs-index.md`), reutilizar
os mapeamentos já registrados.

Para cada PRD **sem mapeamento registrado**, perguntar:
```
O PRD "{id}: {name}" ainda não tem projeto ou repositório mapeado.
→ Projeto: (nome, URL ou "nenhum")
→ Repositório Git: (nome, URL ou "nenhum")
```

#### 3.3 Gerar o índice local

Escrever ou atualizar `$PROD_DOCS/specs-index.md` seguindo o template
de Índice Local abaixo. Mostrar o diff proposto e aguardar confirmação
antes de gravar.

O índice fica só na máquina: não é publicado no Central docs nem em
outro lugar.

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| Pré-requisito — Carregar ENV.md | `/jarvis-init` | Se o `ENV.md` não existir (executado via Skill tool) |

---

## Templates

### Índice Local (`$PROD_DOCS/specs-index.md`)
```markdown
# Índice de Especificações — {WORKSPACE}

Índice das especificações do projeto atual. Atualizado automaticamente
pela skill `product-specs-update`.

_Última atualização: {YYYY-MM-DD}_

---

## Relação de Arquivos e Projetos

| Spec | Status | Projeto | Repositório Git |
|------|--------|---------|-----------------|
| [PRD-001 — Nome](./prd-001-nome/prd-001-nome.md) | in_progress | Projeto A | [repo-a](url) |
| [FRD-001 — Nome](./prd-001-nome/frd-001-nome.md) | in_review | Projeto A | [repo-a](url) |
| [FRD-002 — Nome](./frd-002-nome/frd-002-nome.md) | backlog | Projeto A | [repo-a](url) |

---

## Relação PRD → FRDs

### PRD-001: Nome do PRD
- [FRD-001 — Nome](./prd-001-nome/frd-001-nome.md) · `in_review`

### FRDs sem PRD pai
- [FRD-002 — Nome](./frd-002-nome/frd-002-nome.md) · `backlog`
```

Os links são relativos ao `specs-index.md`, que fica na raiz de `$PROD_DOCS`.

---

## Regras

### Nunca
- Remover entradas existentes de specs ou do índice sem confirmação explícita
- Sobrescrever mapeamentos de projeto/repositório já registrados sem perguntar
- Escrever mudanças em cascata sem mostrar o diff antes
- Alterar o bloco de versionamento dos docs
- Publicar o índice ou as specs no Central docs ou em qualquer lugar fora da máquina
- Escolher sozinho entre dois PRDs com o mesmo id

### Sempre
- Mostrar resumo das mudanças propostas e aguardar confirmação
- Preservar paths relativos corretos entre os arquivos
- Reutilizar mapeamentos de projeto/repo já existentes no índice
- Ler o `related_prd` em todos os formatos antes de tratá-lo como vazio

---

## Checklist de Conclusão

- [ ] ENV.md lido — `$PROD_DOCS` resolvido até o caminho real
- [ ] Tipo do arquivo identificado (PRD / FRD / scan completo)
- [ ] Cascata de atualizações mapeada e confirmada pelo usuário
- [ ] Ids repetidos avisados e resolvidos (mesma pasta ou pergunta)
- [ ] Projeto e repositório obtidos para specs sem mapeamento
- [ ] Índice local gerado em `$PROD_DOCS/specs-index.md`
- [ ] Links internos validados

---

## Output

| Artefato | Escopo | Condição |
|----------|--------|----------|
| `$PROD_DOCS/specs-index.md` | Projeto atual | Sempre |
| PRDs afetados | Seção "Solução" sincronizada | Quando FRD muda |
| FRDs afetadas | `related_prd` preenchido | Quando ausente |

## Mensagem de Conclusão

```
✅ Specs sincronizadas

📄 Índice: $PROD_DOCS/specs-index.md ({n} PRDs, {m} FRDs)
🔁 Cascata: {k} arquivos atualizados (PRD "Solução" / FRD related_prd)
⚠️ Ids repetidos: {lista ou "nenhum"}

O índice é local: nada foi publicado.
```
