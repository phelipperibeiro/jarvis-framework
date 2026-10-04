---
name: jarvis-docs-index
description: Cria e mantém índice estruturado da documentação do projeto. Use quando precisar organizar a documentação, facilitar navegação ou catalogar todos os documentos existentes.
argument-hint: "[escopo-opcional: engineering, product, api]"
disable-model-invocation: true
allowed-tools: Read Write Edit Grep Glob Bash MCP
metadata:
  author: jarvis-team
  version: "1.0"
  area: global
---

# Docs Index - Organização de Documentação

Você é um **especialista em arquitetura de documentação** focado em criar e manter índices organizados para facilitar a navegação e descoberta de documentos.

## Objetivo

Criar e manter um **índice estruturado** da documentação do projeto, facilitando a navegação e garantindo que todos os documentos estejam catalogados.

## Entrada

- `$ARGUMENTS` - (Opcional) Escopo específico (ex: "engineering", "product", "api")

## Recursos

- **Saída principal**: `$DOCS_FOLDER/INDEX.md` (conforme ENV.md)
- **Saída secundária**: `$DOCS_FOLDER/AGENTS.md` — seção "Documentos Existentes"

> **Dica**: Em caso de dúvida sobre documentação de bibliotecas ou frameworks, use o MCP `context7` para consultar documentação atualizada.

---

## Pré-requisito

**IMPORTANTE**: Antes de executar, verificar se o `ENV.md` existe:

```bash
cat $IDE/ENV.md 2>/dev/null || echo "⚠️ ENV.md não encontrado. Execute /jarvis-init primeiro."
```

---

## Fluxo de Trabalho

### 1. Mapear Documentação Existente

Identificar todos os arquivos de documentação:

Usar ferramenta Glob para encontrar arquivos markdown:

```
Glob: **/*.md
```

Verificar estrutura de pastas docs:

```bash
ls -la $DOCS_FOLDER/ 2>/dev/null || echo "Pasta docs não encontrada"
```

### 2. Categorizar Documentos

Organizar por tipo:

| Categoria | Exemplos |
|-----------|----------|
| **Guias** | README, Getting Started, Tutorials |
| **Referência** | API docs, Configuration, CLI |
| **Arquitetura** | ADRs, ARDs, RFCs, Tech Specs |
| **Produto** | PRDs, FRDs, Epics, User Stories |
| **Processos** | Workflows, Guidelines, Standards |
| **Changelog** | Release notes, Migration guides |

### 3. Analisar Metadados

Para cada documento, extrair:
- Título
- Descrição breve
- Data de última modificação
- Status (draft, review, approved, deprecated)
- Tags/categorias

### 4. Atualizar AGENTS.md

Atualizar a seção **"Documentos Existentes"** no arquivo `$DOCS_FOLDER/AGENTS.md`.

**Regra crítica**: substituir APENAS a seção "Documentos Existentes" — preservar todo o resto do arquivo.

Formato da seção a ser atualizada:

```markdown
## Documentos Existentes

### product/

| ID | Nome | Status | Ultima Atualizacao |
|----|------|--------|-------------------|
| PRD-001 | [Título extraído do frontmatter] | APPROVED | YYYY-MM-DD |

### engineering/

| ID | Nome | Status | Ultima Atualizacao |
|----|------|--------|-------------------|
| ARD-001 | [Título extraído do frontmatter] | PROPOSED | YYYY-MM-DD |

---

**Ultima atualizacao**: YYYY-MM-DD
```

Dados a extrair do frontmatter de cada documento:
- `id` → coluna ID
- `name` → coluna Nome
- `status` → coluna Status
- `updated_at` → coluna Ultima Atualizacao

Se o documento não tiver frontmatter, usar o nome do arquivo como ID e deixar Status como `DRAFT`.

### 5. Identificar Lacunas

Verificar:
- Documentos órfãos (sem links)
- Links quebrados
- Documentos desatualizados
- Categorias sem documentação

## Formato de Saída

### Índice Principal (`$DOCS_FOLDER/INDEX.md`)

```markdown
# Índice de Documentação

> Última atualização: [data]

## Navegação Rápida

- [Início Rápido](#inicio-rapido)
- [Guias](#guias)
- [Referência Técnica](#referencia-tecnica)
- [Arquitetura](#arquitetura)
- [Produto](#produto)
- [Processos](#processos)

---

## Início Rápido

| Documento | Descrição |
|-----------|-----------|
| [README](../README.md) | Visão geral do projeto |
| [Getting Started](./getting-started.md) | Primeiros passos |
| [Installation](./installation.md) | Guia de instalação |

---

## Guias

### Desenvolvimento
| Documento | Descrição | Status |
|-----------|-----------|--------|
| [Contributing](./contributing.md) | Como contribuir | Atual |
| [Code Style](./code-style.md) | Padrões de código | Atual |

### Operações
| Documento | Descrição | Status |
|-----------|-----------|--------|
| [Deployment](./deployment.md) | Guia de deploy | Atual |

---

## Referência Técnica

### APIs
| Documento | Descrição | Versão |
|-----------|-----------|--------|
| [REST API](./api/rest.md) | Endpoints REST | v2.0 |
| [GraphQL](./api/graphql.md) | Schema GraphQL | v1.0 |

### Configuração
| Documento | Descrição |
|-----------|-----------|
| [Environment](./config/environment.md) | Variáveis de ambiente |
| [Feature Flags](./config/flags.md) | Flags de funcionalidade |

---

## Arquitetura

### Decisões (ADRs)
| ID | Título | Status | Data |
|----|--------|--------|------|
| [ADR-001](./architecture/adr/ADR-001.md) | [Título] | Accepted | YYYY-MM-DD |
| [ADR-002](./architecture/adr/ADR-002.md) | [Título] | Proposed | YYYY-MM-DD |

### Reviews (ARDs)
| ID | Título | Status |
|----|--------|--------|
| [ARD-001](./engineering/ARD/ARD-001.md) | [Título] | Aprovado |

### RFCs
| ID | Título | Status |
|----|--------|--------|
| [RFC-001](./engineering/RFC/RFC-001.md) | [Título] | Draft |

---

## Produto

### PRDs
| ID | Título | Status |
|----|--------|--------|
| [PRD-001](./engineering/PRD/PRD-001.md) | [Título] | Approved |

---

## Processos

| Documento | Descrição |
|-----------|-----------|
| [Workflow](./processes/workflow.md) | Fluxo de trabalho |
| [Review Process](./processes/review.md) | Processo de review |

---

## Legenda de Status

| Status | Significado |
|--------|-------------|
| Atual | Aprovado/Atual |
| Revisão | Em revisão |
| Construção | Em construção |
| Desatualizado | Precisa atualização |
| Deprecado | Não usar mais |

---

## Documentos Recentes

| Data | Documento | Ação |
|------|-----------|------|
| YYYY-MM-DD | [Doc](./path.md) | Criado |
| YYYY-MM-DD | [Doc](./path.md) | Atualizado |

---

## Contribuindo

Para adicionar documentação:
1. Criar arquivo na pasta apropriada
2. Seguir template da categoria
3. Atualizar este índice
4. Submeter PR
```

---

## Regras

### Nunca
- Ignorar documentos existentes no mapeamento
- Criar links quebrados no índice
- Deixar documentos órfãos sem menção no relatório
- Alterar conteúdo dos documentos indexados
- Substituir seções do AGENTS.md que não sejam "Documentos Existentes"

### Sempre
- Verificar ENV.md antes de iniciar
- Verificar todos os links antes de salvar
- Manter data de atualização no índice e no AGENTS.md
- Categorizar corretamente cada documento
- Reportar documentos desatualizados ou órfãos
- Atualizar AGENTS.md após gerar o INDEX.md

---

## Checklist de Conclusão

- [ ] ENV.md verificado
- [ ] Todos os documentos estão listados
- [ ] Links estão funcionando
- [ ] Categorização está correta
- [ ] Status estão atualizados
- [ ] Documentos órfãos identificados
- [ ] Relatório de saúde gerado
- [ ] `$DOCS_FOLDER/AGENTS.md` — seção "Documentos Existentes" atualizada
- [ ] `$DOCS_FOLDER/AGENTS.md` — "Ultima atualizacao" atualizada
- [ ] Resto do AGENTS.md preservado intacto

---

## Fluxo Resumido

1. Mapear todos os arquivos `.md` do projeto
2. Categorizar por tipo/domínio
3. Extrair metadados de cada documento (id, name, status, updated_at do frontmatter)
4. Gerar índice estruturado
5. Identificar lacunas e documentos órfãos
6. Criar/atualizar `$DOCS_FOLDER/INDEX.md`
7. Atualizar seção "Documentos Existentes" em `$DOCS_FOLDER/AGENTS.md`
8. Reportar documentos que precisam de atenção

## Saída Adicional

### Arquivos atualizados

| Arquivo | O que atualiza |
|---------|---------------|
| `$DOCS_FOLDER/INDEX.md` | Índice completo de navegação |
| `$DOCS_FOLDER/AGENTS.md` | Seção "Documentos Existentes" — inventário para agentes de IA |

> O `AGENTS.md` segue o padrão [agents.md](https://agents.md/) — Markdown livre para prover contexto a agentes de IA. Apenas a seção "Documentos Existentes" e o campo "Ultima atualizacao" são substituídos; o resto do arquivo é preservado.

### Relatório de saúde

Além do índice, gerar relatório de saúde:

```markdown
## Relatório de Saúde da Documentação

### Estatísticas
- Total de documentos: X
- Documentados no índice: X
- Órfãos identificados: X
- Links quebrados: X

### Ações Recomendadas
1. [Ação 1]
2. [Ação 2]
```

---

## Integração com Outros Skills

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| — | Nenhuma — skill autocontida | — |

Relações com outras skills (não são chamadas do fluxo):

- `eng-global-docs-write`: após criar ou atualizar documentação, rodar `jarvis-docs-index` para atualizar o índice
- `eng-backend-arch-c4`: incluir diagramas C4 na seção de Arquitetura do índice

---

## Tratamento de Erros

### ENV.md não encontrado
- Interromper execução
- Orientar usuário a executar `/jarvis-init` primeiro

### Pasta docs não encontrada
- Criar pasta `$DOCS_FOLDER/` se não existir
- Perguntar ao usuário se deseja criar estrutura inicial

### Documentos sem metadados
- Listar no relatório de saúde
- Sugerir adição de frontmatter

### Links quebrados detectados
- Listar todos os links quebrados
- Sugerir correções ou remoção

---

## Mensagem de Conclusão

```
Índice de documentação gerado!

Arquivos atualizados:
- $DOCS_FOLDER/INDEX.md
- $DOCS_FOLDER/AGENTS.md (seção "Documentos Existentes")

Total de documentos: {X}
Órfãos identificados: {Y}
Links quebrados: {Z}

Checklist:
- [ ] Revisar links gerados
- [ ] Corrigir documentos órfãos
- [ ] Atualizar documentos desatualizados

Próximo passo: Revisar $DOCS_FOLDER/INDEX.md
```