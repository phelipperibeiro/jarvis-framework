# TestSprite MCP — Referência (Resumo Operacional)

> Esta referência consolida, em formato local, as capacidades e o fluxo do **TestSprite MCP Server**.
> 
> Fonte original: https://docs.testsprite.com/mcp/getting-started/introduction

---

## O que é

O **TestSprite MCP Server** é um MCP para IDE que funciona como um agente de testes automatizados. Ele:

- Lê PRD (quando fornecido)
- Analisa o codebase
- Gera um PRD normalizado (TestSprite PRD)
- Cria planos de teste
- Gera código de teste
- Executa testes
- Produz relatórios
- Suporta fluxo de correção com base nos resultados

A documentação descreve esse funcionamento como um fluxo em múltiplas etapas ("reads PRD" → "analyzes code" → "generates test PRD" → "creates test plans" → "generates test code" → "executes tests" → "provides results" → "enables fixes").

---

## Tipos de teste suportados

- **Frontend**: UI & Business-Flow (E2E / integração de fluxos)
- **Backend**: API & Integration

## Quando usar cada tipo

### Frontend (UI & Business-Flow)

Use quando o risco/valor está no comportamento percebido pelo usuário:

- Fluxos de navegação (multi-step), páginas e rotas
- Formulários, validações e mensagens de erro
- Componentes interativos e estados (loading/empty)
- Fluxos de autenticação/autorizações na UI (login/logout/rotas protegidas)

Evite escolher Frontend como única camada quando o objetivo é validar contrato/semântica de API (nesse caso, inclua Backend).

### Backend (API & Integration)

Use quando o risco/valor está na API/serviço e suas integrações:

- Contratos de request/response, schemas e versionamento
- Regras de autorização/autenticação (RBAC/scopes, token validation)
- Resiliência e tratamento de erro (status codes, timeouts, retries/backoff)
- Edge cases e validações de payload/paginação
- Integridade/persistência de dados (idempotência/constraints)

### Quando rodar os dois

Rode **Frontend + Backend** quando:

- O fluxo é ponta-a-ponta (UI chama API) e você quer diagnóstico mais rápido
- Existem regras de auth e modelos de dados compartilhados entre UI e API
- O problema pode estar em contrato, payloads ou status codes (camada API), mas se manifesta na UI

---

## Escopo de execução (Codebase vs Code Diff)

A documentação menciona dois modos de escopo:

- **Codebase**: varredura completa do projeto.
  - Use quando:
    - é a primeira execução do TestSprite no repo
    - você quer um baseline amplo de qualidade
    - houve mudanças grandes/estruturais e o risco é sistêmico

- **Code Diff**: executar focado nas mudanças recentes (a doc cita mudanças não commitadas/uncommitted).
  - Use quando:
    - você quer feedback rápido antes de abrir PR
    - quer validar apenas o impacto do que acabou de alterar
    - está iterando rapidamente e o full sweep seria caro/lento

Observação: se você precisar focar especificamente em staged vs uncommitted, valide com o usuário qual estado do Git deve ser considerado antes de executar.

## Tipos de testes (detalhamento)

Esta lista é uma transcrição/normalização do que a documentação descreve como capacidades suportadas.

### Frontend (UI & Business-Flow Integration)

- **User Journey Navigation**: fluxos multi-etapa, transições de página, deep linking, histórico do navegador e route guards.
  - Exemplos de quando usar:
    - Quando você alterou navegação/roteamento (ex.: novas rotas, guards, redirects pós-login).
    - Quando implementou um fluxo multi-página (ex.: onboarding, checkout, wizard).
    - Quando mudou deep links (ex.: abrir detalhes via URL) ou comportamento do back/forward.
- **Form Flows & Validation**: validação de input, mensagens de erro, dependências entre campos, submissão e persistência.
  - Exemplos de quando usar:
    - Quando criou/alterou regras de validação (ex.: email, senha, máscara, required).
    - Quando mudou mensagens de erro, estados inválidos e validação em tempo real.
    - Quando o submit depende de múltiplos campos/etapas (ex.: endereço + pagamento).
- **Visual States & Layouts**: renderização, responsividade, loading/empty states e compliance de acessibilidade.
  - Exemplos de quando usar:
    - Quando adicionou estados de carregamento/placeholder/skeleton.
    - Quando alterou layout responsivo (breakpoints) ou grid.
    - Quando implementou empty states (lista vazia, zero-state) e quer validar acessibilidade.
- **Interactive Components & Stateful UI**: dropdowns, modals, tabs, accordions, drag-and-drop, persistência de estado e updates em tempo real.
  - Exemplos de quando usar:
    - Quando adicionou/alterou modal, dropdown, tab ou accordion que controla estado.
    - Quando implementou drag-and-drop (ordenar itens, kanban).
    - Quando tem UI com updates em tempo real (polling/websocket) e precisa validar consistência visual.
- **Authorization & Auth Flows (UI)**: login/logout, rotas protegidas, visibilidade por papel, session management e token refresh.
  - Exemplos de quando usar:
    - Quando alterou fluxo de login/logout (ex.: SSO, MFA, step extra).
    - Quando introduziu nova rota protegida ou mudança de RBAC na UI.
    - Quando houve mudança em refresh/expiração de token (ex.: reauth silencioso).
- **Error Handling (UI)**: toasts, modals, inline errors, feedback de validação e graceful degradation.
  - Exemplos de quando usar:
    - Quando mudou o padrão de exibição de erros (toast vs inline vs modal).
    - Quando adicionou tratamento para falhas de rede/timeout.
    - Quando precisa validar que o usuário recebe feedback correto em cenários de erro.

### Backend (API & Integration)

- **Functional API Workflows**: comportamento de endpoints, workflows multi-step, orquestração de serviços e padrões de integração.
  - Exemplos de quando usar:
    - Quando introduziu um fluxo que chama múltiplos endpoints (ex.: criar pedido → pagar → confirmar).
    - Quando mudou orquestração/integração entre serviços (ex.: webhook + job async).
    - Quando há dependência de estados/transições (ex.: status de pedido).
- **Contract & Schema Validation**: schemas request/response, data types, required fields, formatos de serialização e versionamento.
  - Exemplos de quando usar:
    - Quando adicionou/removeu campos no payload (request/response).
    - Quando alterou tipos/formatos (ex.: date string → epoch) ou regras de required/optional.
    - Quando mudou versionamento de API ou contratos entre serviços.
- **Error Handling & Resilience**: status codes, error bodies, retry/backoff, timeouts e graceful degradation.
  - Exemplos de quando usar:
    - Quando ajustou códigos de status (ex.: 400/404/409/422) e mensagens de erro.
    - Quando adicionou timeouts, retries/backoff ou circuit breaker.
    - Quando precisa validar comportamento em dependência instável (ex.: serviço terceiro).
- **Authorization & Authentication**: token validation, RBAC, permission scopes, session management e credential handling.
  - Exemplos de quando usar:
    - Quando alterou regras de permissão (RBAC/scopes) por endpoint.
    - Quando mudou validação de token (claims, expiração, audience/issuer).
    - Quando introduziu novo mecanismo de autenticação (ex.: API key, OAuth).
- **Boundary & Edge Cases**: limites de payload, paginação, valores null/empty, inputs malformados e constraint validation.
  - Exemplos de quando usar:
    - Quando adicionou paginação/filters/sorting e precisa validar limites.
    - Quando o endpoint aceita payload grande ou novos formatos.
    - Quando adicionou validações de input e quer cobrir casos inválidos.
- **Data Integrity & Persistence**: consistência de dados, transações, idempotência, state management e database constraints.
  - Exemplos de quando usar:
    - Quando introduziu escrita em banco (insert/update) com constraints novas.
    - Quando implementou idempotência (ex.: POST com idempotency-key).
    - Quando adicionou transações/sagas e quer validar consistência sob falha.
- **Security Testing**: vulnerabilidades comuns (injection, XSS, CSRF), auth bypass, authorization flaws, data exposure e security misconfigurations.
  - Exemplos de quando usar:
    - Quando expôs endpoint novo e quer validar que não há bypass de auth.
    - Quando mexeu em sanitização/validação e quer detectar injection.
    - Quando lida com dados sensíveis e quer checar exposição indevida.

---

## Lifecycle (modelo mental)

A documentação descreve um lifecycle conceitual:

- Discover & Understand
- Plan
- Generate
- Execute
- Analyze
- Heal & Maintain
- Report & Integrate

---

## Fluxo de "primeiro teste" (Getting Started)

A documentação sugere:

1. Subir o projeto localmente (ex.: `npm run dev`, `node index.js`, etc.)
2. Abrir um chat no IDE e pedir:

```text
Can you test this project with TestSprite?
```

3. Fornecer configuração obrigatória (conforme solicitado pelo fluxo do MCP), incluindo:
   - Tipo: Frontend ou Backend
   - Scope: Codebase (varredura completa) ou Code Diff (mudanças recentes / uncommitted)
   - Credenciais de conta de teste (se houver login)
   - URLs locais (ex.: frontend `http://localhost:5173`, backend `http://localhost:4000`)
   - PRD (quando aplicável)

---

## Artefatos gerados

A documentação mostra um output típico em `testsprite_tests/`, incluindo:

- `standard_prd.json` (PRD normalizado)
- `TestSprite_MCP_Test_Report.md` e `TestSprite_MCP_Test_Report.html`
- `tmp/` com dados auxiliares (ex.: `config.json`, `code_summary.json`, `test_results.json`)
- Arquivos de casos de teste (ex.: `TC001_...py`, `TC002_...py`, etc.)

---

## Pré-requisitos / instalação (pontos essenciais)

- Conta TestSprite e **API key**
- **Node.js >= 22** (para rodar o MCP via `npx`)
- Instalação do MCP depende do IDE, mas o comando base é:

```text
npx @testsprite/testsprite-mcp@latest
```

Em configurações de MCP, é comum usar `API_KEY` via variável de ambiente.

---

## Referências

- Introduction: https://docs.testsprite.com/mcp/getting-started/introduction
- Overview: https://docs.testsprite.com/mcp/getting-started/overview
- Installation: https://docs.testsprite.com/mcp/getting-started/installation
- First MCP Test: https://docs.testsprite.com/mcp/getting-started/first-test
- Test Types & Lifecycle: https://docs.testsprite.com/mcp/concepts/test-type-lifecycle
