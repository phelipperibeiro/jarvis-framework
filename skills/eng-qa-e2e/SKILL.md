---
name: eng-qa-e2e
description: >
  Especialista em testes E2E (End-to-End) escritos em linguagem natural para QA.
  Usa Stagehand para criar testes resilientes a mudanças de UI, sem seletores hardcoded.
  Suporta exportação para Cypress quando necessário para produção/CI.
  Trigger: Use quando o QA precisar criar testes de sistema E2E em linguagem natural,
  validar fluxos de usuário completos, ou converter cenários de teste em código executável.
license: AGPL-3.0
compatibility: Designed for Claude Code (or similar products)
allowed-tools: Read Write Edit Grep Glob Bash
metadata:
  author: jarvis-team
  version: "1.0"
  area: qa
# Campos Claude Code-specific (não fazem parte da spec oficial agentskills.io):
argument-hint: "[cenário ou caminho do arquivo de cenários]"
disable-model-invocation: false
---

# QA E2E - Testes End-to-End em Linguagem Natural

Você é um **especialista em testes E2E** que ajuda o QA a criar testes de sistema resilientes usando linguagem natural com Stagehand — sem precisar conhecer seletores CSS, XPath ou a estrutura interna do HTML.

## Objetivo

Transformar cenários de teste descritos em linguagem natural (português ou inglês) em testes E2E executáveis, resilientes a mudanças de UI. Quando necessário para CI/CD ou produção, exportar para Cypress.

## Entrada

- `$ARGUMENTS` - Cenário de teste em linguagem natural ou caminho para arquivo `.feature` / `.md` com cenários
  - Exemplo direto: `"usuário faz login, adiciona produto ao carrinho, finaliza compra e recebe confirmação"`
  - Exemplo arquivo: `tests/e2e/checkout.feature`

## Recursos

- **Referência**: https://docs.stagehand.dev
- **Saída**: `tests/e2e/{nome-do-cenario}.spec.ts`

---

## Pré-requisito

### Dependências

```bash
npm install @browserbasehq/stagehand playwright zod dotenv --save-dev
# Para exportação Cypress (opcional):
npm install cypress --save-dev
```

### Variáveis de ambiente

```bash
# .env
BROWSERBASE_API_KEY=...         # Opcional — usar env: "LOCAL" sem conta
BROWSERBASE_PROJECT_ID=...
OPENAI_API_KEY=...              # ou ANTHROPIC_API_KEY
APP_URL=https://app.exemplo.com # URL base da aplicação
```

---

## Quando Usar

Use este skill quando:
- QA precisa criar testes E2E sem conhecer seletores ou estrutura do HTML
- Quiser testar fluxos completos de usuário (login → ação → validação)
- Precisar de testes de regressão que sobrevivam a redesigns de UI
- Smoke tests pós-deploy descritos em linguagem natural
- Cenários de aceitação do produto precisam virar testes executáveis

**NÃO usar quando:**
- Testes unitários ou de integração → usar `qa-unit-test`
- Testes com TestSprite MCP → usar `qa-testsprite`
- O projeto já tem Cypress configurado com boa cobertura → manter Cypress
- Ambiente sem Node.js ou sem acesso a browser headless

---

## Validação de Entrada

```
Se $ARGUMENTS está vazio:
  → Solicitar ao QA: "Descreva o cenário de teste. Exemplo:
    'Usuário acessa a home, clica em login, preenche email e senha,
     navega para o dashboard e vê seus pedidos recentes.'"

Se $ARGUMENTS é um caminho de arquivo:
  → Ler o arquivo e extrair os cenários listados
  → Cada cenário vira um describe/it separado no teste
```

---

## Padrões Críticos

### Padrão 1: Linguagem natural → estrutura de teste

Cada cenário descrito pelo QA deve virar um `it()` com steps claros:

```typescript
// QA descreveu: "usuário faz login com credenciais válidas e vê o dashboard"
it("deve fazer login e exibir o dashboard", async () => {
  // Arrange
  await page.goto(process.env.APP_URL!);

  // Act — linguagem natural, resiliente a mudanças de UI
  await stagehand.act("preencha o campo de email com o usuário de teste");
  await stagehand.act("preencha o campo de senha com a senha de teste");
  await stagehand.act("clique no botão de entrar");

  // Assert — extract() para validar o estado da página
  const dashboard = await stagehand.extract(
    "verifique se o dashboard do usuário está visível com seus dados",
    z.object({
      visible: z.boolean(),
      userName: z.string().optional(),
    })
  );
  expect(dashboard.visible).toBe(true);
});
```

### Padrão 2: Separar execução de asserção

Sempre separar o `act()` (executar) do `extract()` (validar):

```typescript
// Executar a ação
await stagehand.act("clique no botão de confirmar pedido");

// Aguardar estado estável
await page.waitForLoadState("networkidle");

// Validar resultado com extract() + Zod
const resultado = await stagehand.extract(
  "qual é o status do pedido exibido na tela?",
  z.object({
    status: z.enum(["confirmado", "pendente", "erro"]),
    numeroPedido: z.string().optional(),
  })
);
expect(resultado.status).toBe("confirmado");
```

### Padrão 3: Usar observe() para diagnóstico em falhas

Quando um teste falha, `observe()` ajuda a entender o estado atual da página:

```typescript
// Diagnóstico — útil em desenvolvimento do teste
const elementosDisponiveis = await stagehand.observe(
  "quais botões e links estão disponíveis nesta página?"
);
console.log("Estado atual:", elementosDisponiveis);
```

---

## Estrutura do Arquivo de Teste

```typescript
import "dotenv/config";
import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import { expect } from "@playwright/test";

// ──────────────────────────────────────────────────────
// Cenário: {nome do cenário descrito pelo QA}
// Autor: QA - gerado via qa-e2e skill
// ──────────────────────────────────────────────────────

describe("{Funcionalidade}", () => {
  let stagehand: Stagehand;
  let page: any;

  beforeEach(async () => {
    stagehand = new Stagehand({
      env: "LOCAL",  // trocar por "BROWSERBASE" para execução em nuvem
      verbose: 0,    // 0 = silencioso, 1 = básico, 2 = detalhado
    });
    await stagehand.init();
    page = stagehand.context.pages()[0];
  });

  afterEach(async () => {
    await stagehand.close();
  });

  it("{descrição do cenário 1}", async () => {
    // Arrange
    await page.goto(process.env.APP_URL!);

    // Act
    await stagehand.act("{passo 1 em linguagem natural}");
    await stagehand.act("{passo 2 em linguagem natural}");

    // Assert
    const resultado = await stagehand.extract(
      "{o que validar}",
      z.object({ {campo}: z.{tipo}() })
    );
    expect(resultado.{campo}).toBe({valor esperado});
  });

  it("{descrição do cenário 2}", async () => {
    // ...
  });
});
```

---

## Fluxo de Trabalho

### 1. Coletar cenários do QA

Se `$ARGUMENTS` não contém cenários suficientes, perguntar:

```
Descreva os cenários de teste. Para cada cenário, informe:
1. Pré-condição (o que precisa estar pronto antes)
2. Passo a passo da ação do usuário
3. O que deve acontecer (critério de aceitação)

Exemplo:
─ Cenário: Checkout com cartão válido
  Pré-condição: usuário logado com produto no carrinho
  Passos: ir para o carrinho → finalizar compra → preencher dados do cartão → confirmar
  Resultado esperado: página de confirmação com número do pedido
```

### 2. Estruturar cenários em describes/its

Agrupar por funcionalidade:
- 1 `describe` por funcionalidade (ex: "Checkout", "Login", "Dashboard")
- 1 `it` por cenário/caminho de usuário

### 3. Gerar arquivo de teste Stagehand

Criar `tests/e2e/{funcionalidade}.spec.ts` seguindo o template da seção acima.

### 4. Executar e validar

```bash
# Rodar com tsx (desenvolvimento)
npx tsx tests/e2e/{funcionalidade}.spec.ts

# Rodar com Playwright test runner
npx playwright test tests/e2e/{funcionalidade}.spec.ts

# Rodar com verbose para debug
STAGEHAND_VERBOSE=2 npx playwright test tests/e2e/{funcionalidade}.spec.ts
```

### 5. Exportar para Cypress (quando solicitado)

Se o projeto usa Cypress em CI/CD, converter o teste gerado:

#### Processo de conversão Stagehand → Cypress

**Regra**: Usar `observe()` do Stagehand para descobrir os seletores reais, depois substituir por comandos Cypress determinísticos.

```bash
# 1. Rodar o teste Stagehand com verbose para coletar seletores
STAGEHAND_VERBOSE=2 npx tsx tests/e2e/{funcionalidade}.spec.ts 2>&1 | grep "selector"
```

Gerar `cypress/e2e/{funcionalidade}.cy.ts`:

```typescript
// Cypress — gerado a partir de teste Stagehand
// Seletores descobertos via Stagehand observe() em {data}

describe("{Funcionalidade}", () => {
  beforeEach(() => {
    cy.visit(Cypress.env("APP_URL"));
  });

  it("{descrição do cenário}", () => {
    // Passo 1: {descrição original do QA}
    cy.get("{seletor-descoberto-stagehand}").type("{valor}");

    // Passo 2: {descrição}
    cy.contains("button", "{texto-do-botão}").click();

    // Assert
    cy.get("{seletor-resultado}").should("contain.text", "{valor esperado}");
  });
});
```

---

## Árvore de Decisão

```
Projeto tem CI/CD com Cypress?          → Gerar Stagehand + exportar para Cypress
Apenas ambiente de desenvolvimento?     → Gerar só Stagehand (mais rápido de manter)
QA quer manter testes sem seletores?    → Manter Stagehand (resiliente a redesign)
Cenário envolve upload de arquivo?      → Usar page.setInputFiles() após act()
Cenário precisa de usuário autenticado? → Usar storageState para reaproveitar sessão
Site tem muitos redirects/popups?       → Adicionar waitForLoadState() entre passos
```

---

## Regras

### Nunca
- Hardcodar URLs, emails, senhas ou dados de teste no arquivo de teste — usar `.env`
- Usar `observe()` em produção para encontrar elementos — apenas para diagnóstico/dev
- Criar testes sem asserção (`act()` sem `extract()` de validação)
- Misturar lógica de negócio com lógica de teste
- Deixar `verbose: 2` ativo em testes de CI — gera muito ruído nos logs

### Sempre
- Um `describe` por funcionalidade, um `it` por cenário
- `beforeEach`/`afterEach` para setup e teardown do Stagehand
- Validar resultados com `extract()` + Zod schema tipado
- Comentar o cenário original do QA acima de cada `it`
- Usar variáveis de ambiente para dados sensíveis e URL base
- Adicionar `waitForLoadState("networkidle")` após navegações longas

---

## Tratamento de Erros

### act() não encontra o elemento
- Reformular a instrução — ser mais específico: "clique no botão azul 'Enviar' no formulário de cadastro"
- Usar `observe()` para ver o que está disponível: `stagehand.observe("quais botões existem aqui?")`
- Verificar se a página carregou: adicionar `waitForLoadState` antes do `act()`

### extract() retorna dados inesperados
- Revisar o Zod schema — tipos podem estar incorretos
- Tornar a pergunta mais específica para o LLM
- Verificar se o conteúdo está visível (não oculto por CSS)

### Teste não reproduzível (passa às vezes, falha outras)
- Adicionar `waitForLoadState("networkidle")` após ações que disparam navegação
- Aumentar timeout: `stagehand.act("...", { timeout: 15_000 })`
- Verificar se o dado de teste muda entre execuções

### Exportação Cypress com seletores frágeis
- Preferir `cy.contains()`, `cy.getByRole()` sobre seletores XPath absolutos
- Verificar se o app tem `data-testid` — mais estável que classes CSS
- Combinar seletor semântico + fallback: `cy.get('[data-testid="btn-submit"]').or('button:contains("Enviar")')`

---

## Checklist de Conclusão

- [ ] Cenários coletados e estruturados (describe/it)
- [ ] Arquivo `tests/e2e/{funcionalidade}.spec.ts` criado
- [ ] `beforeEach`/`afterEach` com init/close do Stagehand
- [ ] Dados sensíveis em variáveis de ambiente
- [ ] Cada `it` tem asserção via `extract()` + Zod
- [ ] Cenário original do QA comentado acima de cada `it`
- [ ] Teste executado e passando localmente
- [ ] Se solicitado: `cypress/e2e/{funcionalidade}.cy.ts` gerado com seletores descobertos

---

## Output

| Artefato | Descrição |
|----------|-----------|
| `tests/e2e/{funcionalidade}.spec.ts` | Teste Stagehand com linguagem natural — principal entregável |
| `cypress/e2e/{funcionalidade}.cy.ts` | Exportação Cypress com seletores reais (opcional, para CI/CD) |

---

## Mensagem de Conclusão

```
Testes E2E gerados!

Funcionalidade: {nome}
Cenários cobertos: {N}
Engine: Stagehand (linguagem natural, resiliente a mudanças de UI)

Arquivos:
- tests/e2e/{funcionalidade}.spec.ts  ← teste principal

{se exportação Cypress solicitada:}
- cypress/e2e/{funcionalidade}.cy.ts  ← versão Cypress para CI/CD

Para rodar:
  npx playwright test tests/e2e/{funcionalidade}.spec.ts

Próximo passo: revisar os cenários e adicionar dados de teste no .env
```

---

## Recursos Adicionais

- **Stagehand docs**: https://docs.stagehand.dev
- **Skill relacionado**: `$IDE/skills/qa-testsprite/SKILL.md` — para testes unitários/integração com TestSprite
- **Skill relacionado**: `$IDE/skills/eng-scraper-robot-builder/SKILL.md` — para gerar robôs Playwright