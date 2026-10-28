---
name: product-specs-update
description: >
  Sincroniza especificações de produto (PRD/FRD) em cascata e mantém o
  índice local de specs (`$PROD_DOCS/specs-index.md`) atualizado. Trigger:
  quando um PRD ou FRD é criado ou modificado, ou quando o usuário pede para
  sincronizar ou indexar specs.
allowed-tools: Read Write Edit Grep Glob Bash
metadata:
  author: jarvis-team
  version: "1.0"
  area: product
argument-hint: "[path-do-arquivo-criado-ou-modificado]"
disable-model-invocation: false
---

# Update Specs — Sincronização de Especificações de Produto

Você é responsável por manter PRDs, FRDs e o índice de specs sempre
consistentes. Quando uma spec muda, você propaga em cascata e atualiza
o índice local do projeto (`$PROD_DOCS/specs-index.md`).

O índice é só local: PRD e FRD são documentos de trabalho e não vão para o
Central docs, que guarda só o que foi implementado (`feature-*` e
`delivery-*`, publicados pelo `/eng.spec-consolidate`). Para saber o que já
foi implementado, leia o índice do Central docs com
`jarvis docs fetch {SQUAD}/index.md` (skill `jarvis-docs-central`); este skill
não escreve nada lá.


## Entrada

- `$ARGUMENTS` — (Opcional) Path do arquivo criado ou modificado.
- Pergunte para o usuário qual o path do Centarl Docs, que é onde devemos adicionar e atualizar as especificações de produto.

---

## Pré-requisito — Carregar ENV.md

Antes de qualquer ação, ler o `ENV.md` e extrair as variáveis necessárias:
```bash
cat ENV.md
```

Se não existir um `ENV.md`, crie executando a skill `jarvis-init`  com  Skill tool.

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

Extrair do frontmatter:
```bash
grep -E "^(id|name|status|related_prd):" {arquivo_frd}
```

**Se `related_prd` estiver ausente ou vazio**, perguntar:
```
A FRD "{id}: {name}" não tem PRD pai definido.
→ Qual é o path do PRD relacionado?
```
Atualizar o frontmatter da FRD com o valor informado antes de continuar.

**Abrir o PRD referenciado** e verificar a seção `## Solução`:

- FRD **não aparece na lista** → Adicionar entry:
  `- **[{id}]({path_relativo}) ({status}):** {name}`
- FRD **já aparece** → Corrigir status se divergente. Não alterar mais nada.

Mostrar diff proposto ao usuário. Aguardar confirmação antes de escrever.

---

### 2. Fluxo PRD — quando um PRD foi criado ou modificado

Extrair do frontmatter:
```bash
grep -E "^(id|name|status):" {arquivo_prd}
```

Buscar FRDs filhas nos dois diretórios:
```bash
grep -rl "related_prd:" $PROD_DOCS --include="*.md"
```

Filtrar apenas as que apontam para este PRD. Para cada FRD encontrada,
verificar na seção `## Solução` do PRD se o entry está presente e com
status correto. Atualizar divergências.

Mostrar diff proposto ao usuário. Aguardar confirmação antes de escrever.

---

### 3. Reconstrução do Índice

Executado sempre após os fluxos acima, ou diretamente quando `$ARGUMENTS`
está vazio.

#### 3.1 Escanear specs locais
```bash
# PRDs
find $PROD_DOCS -maxdepth 1 -name "*.md" | xargs grep -l "^id: PRD"

# FRDs
find $PROD_DOCS_FRD -name "*.md" | xargs grep -l "^id: FRD"
```

Para cada arquivo, extrair via grep: `id`, `name`, `status`
(e `related_prd` nas FRDs).

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
pela skill `prod-update-specs`.

_Última atualização: {YYYY-MM-DD}_

---

## Relação de Arquivos e Projetos

| Spec | Status | Projeto | Repositório Git |
|------|--------|---------|-----------------|
| [PRD-001 — Nome](./prd-001.md) | in_progress | Projeto A | [repo-a](url) |
| [FRD-001 — Nome](./frds/frd-001.md) | in_review | Projeto A | [repo-a](url) |

---

## Relação PRD → FRDs

### PRD-001: Nome do PRD
- [FRD-001 — Nome](./frds/frd-001.md) · `in_review`
- [FRD-002 — Nome](./frds/frd-002.md) · `in_progress`
```

---

## Regras

### Nunca
- Remover entradas existentes de specs ou do índice sem confirmação explícita
- Sobrescrever mapeamentos de projeto/repositório já registrados sem perguntar
- Escrever mudanças em cascata sem mostrar o diff antes
- Alterar o bloco de versionamento dos docs
- Publicar o índice ou as specs no Central docs ou em qualquer lugar fora da máquina

### Sempre
- Mostrar resumo das mudanças propostas e aguardar confirmação
- Preservar paths relativos corretos entre os arquivos
- Reutilizar mapeamentos de projeto/repo já existentes no índice

---

## Checklist de Conclusão

- [ ] ENV.md lido — `$PROD_DOCS` extraído
- [ ] Tipo do arquivo identificado (PRD / FRD / scan completo)
- [ ] Cascata de atualizações mapeada e confirmada pelo usuário
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