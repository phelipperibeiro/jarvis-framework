---
name: prod-specs-update
description: >
  Sincroniza especificações de produto (PRD/FRD) em cascata e mantém dois
  índices atualizados: um local (projeto atual) e um global no Google Drive
  (todos os projetos). Trigger: quando um PRD ou FRD é criado ou modificado,
  ou quando o usuário pede para sincronizar ou indexar specs.
allowed-tools: Read Write Edit Grep Glob Bash MCP
metadata:
  author: jarvis-team
  version: "1.0"
  area: product
argument-hint: "[path-do-arquivo-criado-ou-modificado]"
disable-model-invocation: false
---

# Update Specs — Sincronização de Especificações de Produto

Você é responsável por manter PRDs, FRDs e os índices de specs sempre
consistentes. Quando uma spec muda, você propaga em cascata e atualiza
dois índices: o local do projeto na pasta `docs` e o global no repositório `$CENTRAL_DOCS_REPO`.

O Central Docs é a pasta que centralizamos todas as especificações de produto. Ele serve como referência para todos os projetos e deve ser atualizada sempre que houver mudanças em qualquer spec.


## Entrada

- `$ARGUMENTS` — (Opcional) Path do arquivo criado ou modificado.
- Pergunte para o usuário qual o path do Centarl Docs, que é onde devemos adicionar e atualizar as especificações de produto.

---

## Pré-requisito — Carregar ENV.md

Antes de qualquer ação, ler o `ENV.md` e extrair as variáveis necessárias:
```bash
cat ENV.md
```

Se não existir um `ENV.md`, crie executando a skill `init-jarvis`  com  Skill tool.

---

## Árvore de Decisão
```
$ARGUMENTS fornecido?
  → SIM: Ler frontmatter do arquivo
      id começa com "PRD"? → Fluxo PRD  
      id começa com "FRD"? → Fluxo FRD  
      Nem um nem outro?    → Avisar e encerrar
  → NÃO: Ir direto para Reconstrução Completa dos Índices
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

### 3. Reconstrução dos Índices

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
de Índice Local abaixo.

#### 3.4 Escanear specs no Drive (se MCP disponível)

Acessar `$CENTRAL_DOCS_REPO` via MCP e listar todos os arquivos `.md`.

Para cada arquivo encontrado, extrair os metadados YAML (`id`, `name`,
`status`, `related_prd`). Consolidar com os dados locais, deduplizando
por `id`.

#### 3.5 Gerar o índice global no Drive (se MCP disponível)

Verificar se `specs-index.md` já existe na raiz da pasta do Drive.
Reutilizar mapeamentos de projeto/repositório já registrados. Perguntar
apenas o que estiver faltando.

Escrever ou atualizar o `specs-index.md` no Drive seguindo o template
de Índice Global abaixo.

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

### Índice Global (`specs-index.md` no Drive)
```markdown
# Índice Global de Especificações

Índice consolidado de todas as especificações de produto, abrangendo todos
os projetos. Atualizado automaticamente pela skill `prod-update-specs`.

_Última atualização: {YYYY-MM-DD}_

---

## Relação de Arquivos e Projetos

| Spec | Status | Projeto | Repositório Git |
|------|--------|---------|-----------------|
| [PRD-001 — Nome](link-drive) | in_progress | Projeto A | [repo-a](url) |
| [PRD-002 — Nome](link-drive) | in_review   | Projeto B | [repo-b](url) |
| [FRD-001 — Nome](link-drive) | in_progress | Projeto A | [repo-a](url) |

---

## Projetos

| Projeto | Specs relacionadas |
|---------|--------------------|
| Projeto A | PRD-001, FRD-001, FRD-002 |
| Projeto B | PRD-002, FRD-003 |

---

## Repositórios

| Repositório | Specs relacionadas |
|-------------|-------------------|
| [repo-a](url) | PRD-001, FRD-001, FRD-002 |
| [repo-b](url) | PRD-002, FRD-003 |

---

## Relação PRD → FRDs

### PRD-001: Nome — Projeto A
- [FRD-001 — Nome](link-drive) · `in_progress`
- [FRD-002 — Nome](link-drive) · `in_review`

### PRD-002: Nome — Projeto B
- [FRD-003 — Nome](link-drive) · `icebox`
```

---

## Regras

### Nunca
- Remover entradas existentes de specs ou do índice sem confirmação explícita
- Sobrescrever mapeamentos de projeto/repositório já registrados sem perguntar
- Escrever mudanças em cascata sem mostrar o diff antes
- Alterar o bloco de versionamento dos docs

### Sempre
- Mostrar resumo das mudanças propostas e aguardar confirmação
- Preservar paths relativos corretos entre os arquivos
- Tratar Drive como indisponível graciosamente — nunca bloquear o fluxo local
- Reutilizar mapeamentos de projeto/repo já existentes nos índices

---

## Checklist de Conclusão

- [ ] ENV.md lido — `$PROD_DOCS`, `$PROD_DOCS_FRD` e `$CENTRAL_DOCS_REPO` extraídos
- [ ] Disponibilidade do Drive MCP verificada
- [ ] Tipo do arquivo identificado (PRD / FRD / scan completo)
- [ ] Cascata de atualizações mapeada e confirmada pelo usuário
- [ ] Projeto e repositório obtidos para specs sem mapeamento
- [ ] Índice local gerado em `$PROD_DOCS/specs-index.md`
- [ ] Índice global gerado no Drive (se MCP disponível)
- [ ] Links internos validados

---

## Output

| Artefato | Escopo | Condição |
|----------|--------|----------|
| `$PROD_DOCS/specs-index.md` | Projeto atual | Sempre |
| `specs-index.md` no Drive | Todos os projetos | MCP conectado ou Integração ativa |
| PRDs afetados | Seção "Solução" sincronizada | Quando FRD muda |
| FRDs afetadas | `related_prd` preenchido | Quando ausente |