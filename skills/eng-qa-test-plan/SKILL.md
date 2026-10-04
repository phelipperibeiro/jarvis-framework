---
name: eng-qa-test-plan
description: >
  Analisa cobertura de testes da branch atual e identifica lacunas.
  Trigger: Use quando precisar verificar se o código novo ou modificado possui testes adequados antes do merge.
argument-hint: "[caminho-opcional]"
allowed-tools: Read Grep Glob Bash mcp__TestSprite__testsprite_bootstrap mcp__TestSprite__testsprite_generate_code_summary mcp__TestSprite__testsprite_generate_frontend_test_plan mcp__TestSprite__testsprite_generate_backend_test_plan mcp__TestSprite__testsprite_generate_code_and_execute
license: AGPL-3.0
metadata:
  author: jarvis-team
  version: "1.0"
  area: qa
---

# Test Planner - Análise de Cobertura de Testes

Você é um especialista em planejamento de testes focado em analisar as mudanças de código na branch atual e identificar lacunas de cobertura de testes.

## Objetivo

Garantir que todo código novo ou modificado possua cobertura de testes adequada antes do merge.

## Entrada

- `$ARGUMENTS` - (Opcional) Caminho específico ou nome da feature para análise focada

---

## Quando Usar

Use esta skill quando:
- Precisar verificar cobertura de testes antes de um merge/PR
- Quiser identificar lacunas de testes no código modificado
- Necessitar de um plano estruturado para implementar testes faltantes
- Estiver fazendo code review e precisar avaliar a cobertura de testes

---

## Padrões Críticos

### Padrão 1: Sempre analisar o diff primeiro

Antes de qualquer análise, obtenha as mudanças da branch:

```bash
git diff origin/main...HEAD --name-only
```

### Padrão 2: Priorizar código crítico

Sempre priorize testes para:
- APIs públicas e endpoints
- Lógica de negócio e regras de validação
- Código de autenticação/autorização
- Manipulação de dados sensíveis

---

## Integração com TestSprite MCP

Esta skill prioriza o uso do TestSprite MCP para geração automática de testes quando disponível.

### Verificação de Disponibilidade

Para verificar se o TestSprite está disponível:

1. **Tente chamar** `testsprite_bootstrap` com parâmetros mínimos
2. **Se a tool existir e responder**: Prossiga com o Fluxo A (MCP)
3. **Se a tool não existir ou retornar erro**: Prossiga com o Fluxo B (Manual)

**Erros que indicam indisponibilidade:**
- `Tool not found`
- `MCP server not connected`
- `Connection refused`
- Timeout sem resposta

> ⚠️ **Importante**: Não tente reconectar ou instalar o MCP automaticamente. Se indisponível, siga direto para o Fluxo B.

### Decisão de Fluxo

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  VERIFICAR TESTSPRITE MCP                                   │
│                                                             │
│  ┌─────────────────────────┐                                │
│  │ Tool testsprite_bootstrap│                               │
│  │ disponível?              │                               │
│  └───────────┬─────────────┘                                │
│              │                                              │
│         SIM  │  NÃO                                         │
│         ↓    │  ↓                                           │
│       FLUXO  │  FLUXO                                       │
│       MCP    │  MANUAL                                      │
│       (A)    │  (B)                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## FLUXO A: TestSprite MCP (Preferencial)

Se o TestSprite MCP estiver disponível, use as seguintes ferramentas:

### A.1. Detectar Tipo de Projeto

ANTES de iniciar, identifique se o projeto é frontend ou backend:

```bash
# Verificar indicadores de Frontend
ls package.json 2>/dev/null && grep -E "(react|vue|angular|next|nuxt|svelte|vite)" package.json

# Verificar indicadores de Backend
ls requirements.txt 2>/dev/null || ls go.mod 2>/dev/null || ls pom.xml 2>/dev/null || ls Cargo.toml 2>/dev/null
ls package.json 2>/dev/null && grep -E "(express|fastify|nest|koa|hapi)" package.json
```

Critérios de Detecção:

| Indicador | Tipo |
|-----------|------|
| `react`, `vue`, `angular`, `next`, `nuxt`, `svelte`, `vite` em package.json | Frontend |
| `express`, `fastify`, `nest`, `koa`, `hapi` em package.json | Backend |
| `requirements.txt`, `manage.py`, `app.py` | Backend (Python) |
| `go.mod`, `main.go` | Backend (Go) |
| `pom.xml`, `build.gradle` | Backend (Java) |
| `Cargo.toml` | Backend (Rust) |
| Pasta `src/components/`, `src/pages/`, `public/` | Frontend |
| Pasta `src/controllers/`, `src/routes/`, `src/services/` | Backend |

**Projetos Full-Stack:**
Se o projeto contém ambos (ex: Next.js com API routes, monorepo), execute os dois fluxos:
1. `testsprite_generate_frontend_test_plan` para UI/componentes
2. `testsprite_generate_backend_test_plan` para APIs/serviços

### A.2. Detectar Porta Local

Identifique a porta do projeto analisando:

```bash
# Verificar em package.json (scripts de dev/start)
grep -E "PORT|port|:[\d]{4}" package.json

# Verificar em arquivos de configuração
cat .env 2>/dev/null | grep -i port
cat docker-compose.yml 2>/dev/null | grep -E "ports:|[\d]{4}:"
```

Portas comuns por framework:
| Framework | Porta Padrão |
|-----------|-------------|
| Vite/React | 5173 |
| Create React App | 3000 |
| Next.js | 3000 |
| Vue CLI | 8080 |
| Angular | 4200 |
| Express/Node | 3000 |
| Django | 8000 |
| FastAPI | 8000 |
| Spring Boot | 8080 |

### A.3. Bootstrap e Análise

```javascript
// Inicializar análise do projeto com foco nas mudanças (diff)
// IMPORTANTE: Ajustar 'type' e 'localPort' baseado na detecção acima
testsprite_bootstrap({
  localPort: 5173,  // ⚠️ Ajustar conforme detectado no passo A.2
  type: "frontend", // ⚠️ Usar "frontend" ou "backend" conforme detectado
  projectPath: "$PROJECT_ROOT",  // ⚠️ Substituir pelo caminho absoluto do projeto
  testScope: "diff" // Foca apenas nas mudanças da branch
})
```

### A.4. Gerar Sumário do Código

```javascript
testsprite_generate_code_summary({
  projectRootPath: "$PROJECT_ROOT"  // ⚠️ Substituir pelo caminho absoluto do projeto
})
```

### A.5. Gerar Plano de Testes

Para Frontend:
```javascript
testsprite_generate_frontend_test_plan({
  projectPath: "$PROJECT_ROOT",  // ⚠️ Substituir pelo caminho absoluto do projeto
  needLogin: true // Ajustar conforme necessidade
})
```

Para Backend:
```javascript
testsprite_generate_backend_test_plan({
  projectPath: "$PROJECT_ROOT"  // ⚠️ Substituir pelo caminho absoluto do projeto
})
```

### A.6. Gerar e Executar Testes

```javascript
testsprite_generate_code_and_execute({
  projectName: "$WORKSPACE",  // ⚠️ Substituir pelo nome do workspace
  projectPath: "$PROJECT_ROOT",  // ⚠️ Substituir pelo caminho absoluto do projeto
  testIds: [], // Vazio = todos os testes
  additionalInstruction: "Foco nas mudanças da branch atual"
})
```

### A.7. Saída do TestSprite

O TestSprite gera automaticamente:
- `testsprite_tests/` - Pasta com todos os testes gerados
- `TestSprite_MCP_Test_Report.md` - Relatório legível
- `TestSprite_MCP_Test_Report.html` - Relatório HTML
- `testsprite_tests/tmp/test_results.json` - Resultados detalhados

### A.8. Projeto sem Testes Existentes

Se o projeto não possui testes, o TestSprite cria testes do zero:

```
Código → Análise → PRD Normalizado + ARD + FRDs → Plano de Testes → Geração de Código → Execução
```

Comportamento por `testScope`:

| testScope | Projeto sem testes |
|-----------|-------------------|
| `"diff"` | Cria testes apenas para o código modificado na branch |
| `"codebase"` | Cria testes para todo o projeto (ideal para legados) |

Quando usar `codebase` em vez de `diff`:
- Projeto legado sem nenhuma cobertura de testes
- Refatoração grande que impacta múltiplos módulos
- Primeira execução do TestSprite no projeto

```javascript
// Para projetos sem testes - cobertura completa
testsprite_bootstrap({
  localPort: 5173,
  type: "frontend",
  projectPath: "$PROJECT_ROOT",  // ⚠️ Substituir pelo caminho absoluto do projeto
  testScope: "codebase" // ⚠️ Testa todo o projeto
})
```

> **Nota:** O TestSprite não depende de testes existentes. Ele analisa o código-fonte, entende a funcionalidade e gera testes baseados no comportamento esperado.

---

## FLUXO B: Análise Manual (Fallback)

Se o TestSprite MCP NÃO estiver disponível, siga o fluxo manual abaixo.

### B.1. Analisar Mudanças da Branch

Execute os seguintes comandos para entender o que mudou:

```bash
# Listar arquivos alterados
git diff origin/main...HEAD --name-only

# Ver mudanças em detalhe
git diff origin/main...HEAD

# Histórico de commits
git log origin/main..HEAD --oneline
```

Foque especialmente em:
- Novas funções/métodos/classes
- Lógica modificada em código existente
- Novos endpoints ou interfaces de API
- Mudanças de configuração
- Breaking changes

### B.2. Mapear Código para Testes

Para cada arquivo alterado, identifique o arquivo de teste correspondente:

| Padrão | Exemplo |
|--------|---------|
| `[filename].test.[ext]` | `user.test.ts` |
| `[filename].spec.[ext]` | `user.spec.ts` |
| `tests/[filename]_test.[ext]` | `tests/user_test.py` |
| `__tests__/[filename].[ext]` | `__tests__/user.ts` |
| `test_[filename].[ext]` | `test_user.py` |

### B.3. Analisar Cobertura Existente

Para arquivos com testes existentes, verificar:
- Testes para novas funções/métodos
- Testes para comportamento modificado
- Casos de borda da nova lógica
- Tratamento de erros para novos caminhos

### B.4. Identificar Lacunas

Determinar quais testes estão faltando:
- Funcionalidades novas sem testes
- Comportamentos modificados não refletidos
- Casos de borda ausentes
- Cenários de erro não cobertos
- Pontos de integração não testados

### B.5. Priorizar por Criticidade

| Prioridade | Critério |
|------------|----------|
| Alta | APIs públicas, lógica de negócio crítica, código de segurança |
| Média | Utilitários compartilhados, tratamento de erros |
| Baixa | Código de apresentação, configurações simples |

### B.6. Formato de Saída (Fluxo Manual)

Gerar arquivo `$DOCS_FOLDER/engineering/qa/{task-id}-test_coverage_branch_report.md`:

```markdown
# Análise de Cobertura de Testes da Branch

## Informações da Branch
- **Branch:** [nome]
- **Base:** main
- **Arquivos alterados:** [número]
- **Arquivos com gaps de cobertura:** [número]

## Resumo Executivo
[Visão geral da cobertura e principais preocupações]

---

## Análise por Arquivo

### 1. `[caminho/do/arquivo.ts]`

**Mudanças Realizadas:**
- [Resumo das mudanças]

**Cobertura Atual:**
- Arquivo de teste: `[caminho]` ou ❌ Não encontrado
- Status: [✅ Totalmente coberto | ⚠️ Parcialmente coberto | ❌ Não coberto]

**Testes Ausentes:**
- [ ] [Cenário específico]
- [ ] [Outro cenário]

**Prioridade:** [Alta | Média | Baixa]

---

## Plano de Implementação

### Alta Prioridade

#### `[arquivo/funcionalidade]`
- **Arquivo de teste:** `[criar/atualizar em caminho]`
- **Cenários:**
  1. [Caso de teste com descrição]
  2. [Outro caso]
- **Estrutura sugerida:**
```[linguagem]
describe('[Funcionalidade]', () => {
  it('should [comportamento esperado]', () => {
    // arrange
    // act
    // assert
  });
});
```

### Média Prioridade
[Mesma estrutura]

### Baixa Prioridade
[Mesma estrutura]

---

## Estatísticas

| Métrica | Valor |
|---------|-------|
| Arquivos analisados | X |
| Com cobertura adequada | X |
| Precisam de testes | X |
| Cenários identificados | X |

## Recomendações

1. [Recomendação principal]
2. [Outra recomendação]
```

---

## Diretrizes Gerais

### Foco nas Mudanças
- Analise apenas arquivos modificados na branch
- Não reporte código existente não alterado

### Qualidade > Quantidade
- Recomende testes significativos
- Priorize caminhos críticos e casos de borda
- Sugira tipo adequado (unitário/integração/e2e)

### Consciência de Framework
- Respeite padrões de teste existentes no projeto
- Utilize helpers e utilitários já existentes
- Mantenha consistência com testes atuais

---

## Execução

### Com TestSprite MCP (Fluxo A)
1. Verificar disponibilidade tentando usar `testsprite_bootstrap`
2. Detectar tipo de projeto (frontend/backend)
3. Detectar porta local do projeto
4. Executar `testsprite_bootstrap` com `testScope: "diff"`
5. Gerar sumário do código
6. Gerar plano de testes (frontend/backend)
7. Executar testes e gerar relatório

### Sem TestSprite MCP (Fluxo B)
1. Executar comandos git para analisar mudanças
2. Mapear arquivos alterados para arquivos de teste
3. Analisar cobertura existente
4. Identificar lacunas e priorizar
5. Gerar relatório `$DOCS_FOLDER/engineering/qa/{task-id}-test_coverage_branch_report.md`

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| — | Nenhuma — skill autocontida | — |

---

## Resumo dos Fluxos

| Aspecto | Fluxo A (TestSprite) | Fluxo B (Manual) |
|---------|---------------------|------------------|
| Quando usar | TestSprite MCP disponível | TestSprite não instalado |
| Automação | Total - gera e executa testes | Parcial - apenas análise |
| Saída | Testes + Relatório HTML/MD | Relatório MD |
| Esforço | Mínimo | Requer implementação manual |

---

## Output

O skill gera artefatos diferentes dependendo do fluxo utilizado:

### Fluxo A (TestSprite MCP)

| Artefato | Descrição |
|----------|-----------|
| `testsprite_tests/` | Pasta com todos os testes gerados automaticamente |
| `TestSprite_MCP_Test_Report.md` | Relatório legível em Markdown |
| `TestSprite_MCP_Test_Report.html` | Relatório visual em HTML |
| `testsprite_tests/tmp/test_results.json` | Resultados detalhados em JSON |

### Fluxo B (Manual)

| Artefato | Descrição |
|----------|-----------|
| `$DOCS_FOLDER/engineering/qa/{task-id}-test_coverage_branch_report.md` | Relatório de análise de cobertura com plano de implementação |

> **Nota**: Os artefatos são gerados na raiz do projeto ou no diretório especificado em `$ARGUMENTS`.