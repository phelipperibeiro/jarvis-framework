---
name: eng-qa-testsprite
description: >
  Executa testes automatizados usando TestSprite MCP Server para frontend e backend.
  Trigger: Use quando precisar gerar e executar testes automatizados com TestSprite, validar cobertura de testes ou criar planos de teste.
argument-hint: "[frontend|backend|diff|codebase]"
disable-model-invocation: false
allowed-tools: Read Write Edit Grep Glob Bash mcp__TestSprite__testsprite_bootstrap mcp__TestSprite__testsprite_generate_code_summary mcp__TestSprite__testsprite_generate_standardized_prd mcp__TestSprite__testsprite_generate_frontend_test_plan mcp__TestSprite__testsprite_generate_backend_test_plan mcp__TestSprite__testsprite_generate_code_and_execute mcp__TestSprite__testsprite_rerun_tests
license: AGPL-3.0
metadata:
  author: jarvis-team
  version: "1.0"
  area: qa
---

# QA TestSprite - Testes Automatizados

Você é um **especialista em testes automatizados** usando o TestSprite MCP Server para gerar e executar testes de forma autônoma.

## Objetivo

Automatizar a geração e execução de testes para projetos frontend e backend, utilizando o TestSprite para criar planos de teste abrangentes e scripts executáveis.

## Entrada

- `$ARGUMENTS` - Tipo de teste: `frontend`, `backend`, `diff` (mudanças recentes) ou `codebase` (projeto completo)

## Recursos

- **Referência (local)**: `$IDE/skills/qa-testsprite/references/testsprite-mcp.md`
- **Documentação oficial (backup)**: https://docs.testsprite.com/mcp/getting-started/overview
- **Saída**: Relatório de testes em markdown + scripts de teste gerados pelo TestSprite

---

## Pré-requisito

Verificar se o `ENV.md` existe e está preenchido corretamente. Se não existir ou estiver incompleto, execute `/init-jarvis` antes de continuar.

**Requisitos do projeto:**
- Frontend: React, Vue, Angular, Svelte, Next.js, Vite ou vanilla JS/TS
- Backend: Node.js, Python, Java, Go, Express.js, FastAPI, Spring Boot, REST ou GraphQL

---

## Quando Usar

Use este skill quando:
- Precisar gerar testes automatizados para o projeto
- Quiser validar cobertura de testes existente
- Necessitar de plano de testes abrangente
- Testar mudanças recentes (diff) antes de commit/PR
- Validar qualidade do código com testes E2E

**NÃO usar quando:**
- Projeto não tem frontend/backend suportado
- Necessitar apenas de testes unitários simples (use qa-unit-test)
- Ambiente local não está configurado para rodar o projeto

---

## Validação de Entrada

```
Se $ARGUMENTS está vazio:
  → Perguntar: "Qual tipo de teste deseja executar?"
  → Opções: frontend, backend, diff, codebase
  → Usar resposta como $ARGUMENTS

Se $ARGUMENTS não é válido:
  → Exibir: "⚠️ Tipo inválido. Use: frontend, backend, diff ou codebase"
  → Encerrar execução
```

---

## Padrões Críticos

### Padrão 1: Determinar porta local do projeto

Antes de executar `testsprite_bootstrap`, identificar a porta local:

```
Verificar em ordem:
1. package.json scripts (dev/start) → porta no comando
2. vite.config.js/ts → server.port
3. next.config.js → porta padrão 3000
4. Dockerfile → EXPOSE
5. .env → PORT variável
6. Padrão: 5173 (Vite) ou 3000 (Next/Express)
```

### Padrão 2: Fluxo sequencial obrigatório

O TestSprite requer execução em ordem específica:

```
1. testsprite_bootstrap        → Inicializa ambiente
2. testsprite_generate_code_summary → Analisa codebase
3. testsprite_generate_standardized_prd → Gera PRD normalizado
4. testsprite_generate_*_test_plan → Cria plano de testes
5. testsprite_generate_code_and_execute → Executa testes
```

### Padrão 3: Escopo correto para diff vs codebase

```
diff     → Testa mudanças recentes do seu trabalho (git)
codebase → Testa projeto completo
```

Observação: o comportamento exato de "diff" pode variar (staged vs uncommitted). Se houver dúvida, pergunte ao usuário qual estado do Git deve ser considerado e ajuste o preparo da branch antes de executar.

---

## Árvore de Decisão

```
Argumento é "frontend"?  → Usar testsprite_generate_frontend_test_plan
Argumento é "backend"?   → Usar testsprite_generate_backend_test_plan
Argumento é "diff"?      → testScope: "diff"
Argumento é "codebase"?  → testScope: "codebase"
Sem argumento?           → Perguntar ao usuário
```

### Quando rodar Frontend + Backend juntos

Execute ambos os tipos quando:
- O fluxo é ponta-a-ponta (UI chama API) e você quer diagnóstico mais rápido
- Existem regras de auth e modelos de dados compartilhados entre UI e API
- O problema pode estar em contrato/payloads/status codes (API), mas se manifesta na UI

---

## Fluxo de Trabalho

### 1. Identificar Tipo de Projeto

Analisar estrutura para determinar se é frontend ou backend:

```bash
# Frontend indicators
ls package.json src/App.* src/main.* pages/ app/

# Backend indicators
ls server.* app.py main.go routes/ controllers/
```

### 2. Determinar Porta Local

```bash
# Verificar package.json
grep -E "\"(dev|start)\":" package.json

# Verificar vite.config
grep "port" vite.config.*

# Verificar .env
grep "PORT" .env
```

### 3. Bootstrap TestSprite

Executar `testsprite_bootstrap` com parâmetros corretos:

| Parâmetro | Descrição |
|-----------|-----------|
| `localPort` | Porta do servidor local (ex: 5173, 3000) |
| `type` | "frontend" ou "backend" |
| `projectPath` | Caminho absoluto do projeto |
| `testScope` | "diff" ou "codebase" |
| `pathname` | Caminho da página (opcional, padrão "") |

### 4. Gerar Sumário do Código

Executar `testsprite_generate_code_summary` para analisar o projeto.

### 5. Gerar PRD Padronizado

Executar `testsprite_generate_standardized_prd` para criar PRD normalizado.

### 6. Gerar Plano de Testes

Executar o plano apropriado:
- Frontend: `testsprite_generate_frontend_test_plan`
- Backend: `testsprite_generate_backend_test_plan`

**Parâmetros do Frontend Test Plan:**

| Parâmetro | Descrição |
|-----------|-----------|
| `projectPath` | Caminho absoluto do projeto |
| `needLogin` | `true` se o app requer autenticação, `false` caso contrário |

> **Nota**: Se `needLogin: true`, o TestSprite incluirá fluxos de login/logout e rotas protegidas no plano de testes. Forneça credenciais de conta de teste quando solicitado.

**Parâmetros do Backend Test Plan:**

A documentação do TestSprite pode solicitar campos adicionais dependendo do projeto e do modo de execução.

- Se a ferramenta pedir parâmetros extras, pergunte ao usuário os valores necessários e prossiga.
- Evite assumir valores padrão não documentados.

### 7. Executar Testes

Executar `testsprite_generate_code_and_execute`:

| Parâmetro | Descrição |
|-----------|-----------|
| `projectName` | Nome do diretório raiz |
| `projectPath` | Caminho absoluto |
| `testIds` | IDs dos testes ([] = todos) |
| `additionalInstruction` | Instruções extras ("" = nenhuma) |

### 8. Analisar Resultados

Verificar relatório gerado e apresentar resumo ao usuário.

---

## Regras

### Nunca
- Executar bootstrap sem identificar a porta correta
- Pular etapas do fluxo sequencial
- Usar testScope errado (diff vs codebase)
- Executar sem projeto rodando localmente
- Ignorar erros de execução

### Sempre
- Identificar porta local antes do bootstrap
- Seguir ordem sequencial das ferramentas
- Verificar se projeto está rodando antes de testar
- Apresentar resumo dos resultados ao usuário
- Perguntar tipo se argumento não fornecido

---

## Tratamento de Erros

### Projeto não está rodando
- Exibir: "⚠️ O projeto precisa estar rodando localmente na porta {porta}"
- Sugerir: "Execute `npm run dev` ou equivalente antes de testar"

### Porta incorreta
- Exibir: "⚠️ Não foi possível conectar na porta {porta}"
- Verificar novamente os arquivos de configuração
- Perguntar ao usuário qual porta usar

### Tipo de projeto não suportado
- Exibir: "⚠️ Framework não suportado pelo TestSprite"
- Listar frameworks suportados
- Sugerir alternativas (qa-unit-test)

### Testes falharam
- Apresentar resumo dos testes que falharam
- Oferecer opção de re-executar com `testsprite_rerun_tests`
- Sugerir correções baseadas nos erros

---

## Checklist de Conclusão

- [ ] Tipo de teste identificado (frontend/backend/ambos)
- [ ] Porta local determinada corretamente
- [ ] Projeto está rodando localmente
- [ ] Bootstrap executado com sucesso
- [ ] Sumário do código gerado
- [ ] PRD padronizado criado
- [ ] Parâmetro `needLogin` definido (se frontend)
- [ ] Credenciais de teste obtidas (se `needLogin: true`)
- [ ] Plano de testes gerado
- [ ] Testes executados
- [ ] Artefatos gerados em `testsprite_tests/`
- [ ] Resultados apresentados ao usuário

---

## Output

Artefatos gerados na pasta `testsprite_tests/`:

| Artefato | Caminho | Descrição |
|----------|---------|-----------|
| PRD normalizado | `standard_prd.json` | Requisitos estruturados do projeto |
| Relatório MD | `TestSprite_MCP_Test_Report.md` | Relatório em markdown |
| Relatório HTML | `TestSprite_MCP_Test_Report.html` | Relatório visual |
| Casos de teste | `TC001_*.py`, `TC002_*.py`, ... | Scripts de teste gerados |
| Config auxiliar | `tmp/config.json` | Configuração da execução |
| Sumário do código | `tmp/code_summary.json` | Análise do codebase |
| Resultados | `tmp/test_results.json` | Resultados detalhados dos testes |

---

## Mensagem de Conclusão

```
TestSprite executado com sucesso!

Projeto: {projectName}
Tipo: {type}
Escopo: {testScope}
Porta: {localPort}

Resultados:
- Testes executados: {total}
- Passou: {passed}
- Falhou: {failed}
- Cobertura: {coverage}%

Artefatos gerados:
- Relatório: testsprite_tests/TestSprite_MCP_Test_Report.md
- Casos de teste: testsprite_tests/TC*.py

Próximo passo: Revisar relatório em testsprite_tests/
```

---

## Recursos Adicionais

- **Referência (local)**: `$IDE/skills/qa-testsprite/references/testsprite-mcp.md`
- **Documentação oficial (backup)**: https://docs.testsprite.com/mcp/getting-started/overview
- **Frameworks suportados**:
  - Frontend: React, Vue, Angular, Svelte, Next.js, Vite, vanilla JS/TS
  - Backend: Node.js, Python, Java, Go, Express.js, FastAPI, Spring Boot, REST, GraphQL