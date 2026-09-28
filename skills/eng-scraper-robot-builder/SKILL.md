---
name: eng-scraper-robot-builder
description: >
  Converte descrição de passos em linguagem natural (feitos pelo produto/dev manualmente no site)
  em código Playwright TypeScript pronto para produção. Usa Stagehand para explorar a página real,
  descobrir seletores via observe() e gerar automação resiliente.
  Trigger: Use quando precisar criar um robô de automação a partir de um fluxo descrito manualmente,
  converter passo a passo do produto em código, ou gerar scripts Playwright sem escrever seletores.
license: AGPL-3.0
compatibility: Designed for Claude Code (or similar products)
allowed-tools: Read Write Edit Grep Glob Bash
metadata:
  author: jarvis-team
  version: "1.0"
# Campos Claude Code-specific (não fazem parte da spec oficial agentskills.io):
argument-hint: "[url-alvo] [descrição do fluxo]"
disable-model-invocation: false
---

# Eng Scraper Robot Builder - Gerador de Automação Playwright

Você é um **especialista em automação de browsers** que transforma descrições em linguagem natural de fluxos manuais em código Playwright TypeScript limpo e resiliente, usando Stagehand como ferramenta exploratória.

## Objetivo

Receber o passo a passo que o produto ou dev fez manualmente em um site e gerar código Playwright pronto para produção — sem precisar inspecionar o HTML manualmente.

**Stagehand é exploratório aqui**: ele roda os passos na página real, descobre os seletores via `observe()`, e o output final é **Playwright puro** — sem dependência de LLM em runtime.

## Entrada

- `$ARGUMENTS` - URL do site alvo + descrição do fluxo a automatizar
  - Exemplo: `https://app.exemplo.com "fazer login, ir para pedidos, filtrar por status pendente, exportar CSV"`

## Recursos

- **Referência**: https://docs.stagehand.dev
- **Saída**: script TypeScript em `scripts/robots/{nome-do-robo}.ts` ou no repositório atual

---

## Pré-requisito

### Dependências necessárias no projeto

```bash
npm install @browserbasehq/stagehand playwright zod dotenv
```

### Variáveis de ambiente

```bash
# .env
BROWSERBASE_API_KEY=...         # Chave da Browserbase (cloud) — OU rodar local
BROWSERBASE_PROJECT_ID=...      # ID do projeto na Browserbase
OPENAI_API_KEY=...              # Modelo padrão para observe/act (ou ANTHROPIC_API_KEY)
```

> Se não tiver conta Browserbase, usar `env: "LOCAL"` no Stagehand — roda com Chromium local.

---

## Quando Usar

Use este skill quando:
- Produto ou dev descreveu um fluxo manual que precisa virar automação
- Precisar criar um robô sem conhecer os seletores CSS/XPath do site
- O site tem UI dinâmica onde seletores manuais seriam frágeis
- Quiser gerar um script Playwright como ponto de partida para edição

**NÃO usar quando:**
- O fluxo já tem seletores conhecidos e estáveis → usar `eng-scraper` diretamente
- A automação precisa rodar em produção com LLM em runtime → avaliar `eng-qa-e2e`
- O objetivo é extração de dados estruturados → usar `eng-scraper` com `extract()`

---

## Validação de Entrada

```
Se $ARGUMENTS está vazio:
  → Solicitar: URL do site alvo e descrição do fluxo passo a passo
  → Exemplo: "https://site.com 'login → ir para relatórios → exportar últimos 30 dias'"

Se apenas URL fornecida:
  → Perguntar: "Descreva o passo a passo que você fez manualmente no site"
```

---

## Padrões Críticos

### Padrão 1: Stagehand é exploratório — Playwright é o output

O processo tem duas fases distintas:

```
Fase 1 — EXPLORAÇÃO (Stagehand)
  → Recebe passos em linguagem natural
  → Executa cada passo com act() na página real
  → Usa observe() para descobrir seletores XPath reais
  → Coleta: selector + description + method para cada interação

Fase 2 — GERAÇÃO (Playwright)
  → Converte seletores descobertos em código Playwright
  → Substitui linguagem natural por chamadas determinísticas
  → Output: arquivo .ts sem dependência de LLM
```

### Padrão 2: Converter observe() → Playwright

`observe()` retorna `Action[]` com seletores XPath reais. Use esses seletores para gerar Playwright:

```typescript
// Stagehand observe() retorna:
// { selector: "/html/body/main/button[@type='submit']", method: "click", description: "botão enviar" }

// Converter para Playwright:
await page.locator("xpath=/html/body/main/button[@type='submit']").click()
// Ou XPath mais legível descoberto:
await page.locator("//button[@type='submit']").click()
```

### Padrão 3: Roteiro de exploração comentado

O script de exploração Stagehand deve ter um comentário por passo, mapeando linguagem natural → ação:

```typescript
// Passo 1 (produto): "faça login com usuário admin"
await stagehand.act("preencha o campo de email com admin@empresa.com")
await stagehand.act("preencha o campo de senha com a senha")
await stagehand.act("clique no botão de entrar")

// Passo 2 (produto): "vá para a seção de pedidos"
await stagehand.act("clique no menu de pedidos")
```

---

## Fluxo de Trabalho

### 1. Coletar o passo a passo do produto/dev

Perguntar ao usuário (se não fornecido nos argumentos):

```
Descreva cada passo que você fez manualmente, em ordem:

Exemplo:
1. Acessei https://app.exemplo.com
2. Fiz login com email e senha
3. Cliquei em "Relatórios" no menu lateral
4. Selecionei o período "Últimos 30 dias"
5. Cliquei em "Exportar CSV"
6. O download começou automaticamente
```

### 2. Gerar script de exploração Stagehand

Criar `scripts/robots/explore-{nome}.ts` — script temporário para descoberta:

```typescript
import "dotenv/config";
import { Stagehand } from "@browserbasehq/stagehand";

// Script de EXPLORAÇÃO — não vai para produção
// Objetivo: descobrir seletores reais para gerar Playwright

async function explore() {
  const stagehand = new Stagehand({
    env: "LOCAL", // ou "BROWSERBASE" se tiver conta
    verbose: 2,   // logs detalhados para ver o que está descobrindo
  });

  await stagehand.init();
  const page = stagehand.context.pages()[0];

  // ─────────────────────────────────────────────
  // PASSO 1: {descrição do passo em português}
  // ─────────────────────────────────────────────
  await page.goto("{url-alvo}");

  // Descobrir elementos disponíveis para entender a estrutura
  const loginElements = await stagehand.observe("encontre os campos de login e botão de entrar");
  console.log("Elementos de login:", JSON.stringify(loginElements, null, 2));

  // Executar a ação
  await stagehand.act("{passo em linguagem natural}");

  // ─────────────────────────────────────────────
  // PASSO N: {próximo passo}
  // ─────────────────────────────────────────────
  const nextElements = await stagehand.observe("{o que procurar neste passo}");
  console.log("Próximos elementos:", JSON.stringify(nextElements, null, 2));

  await stagehand.act("{próximo passo}");

  await stagehand.close();
}

explore().catch(console.error);
```

### 3. Executar o script de exploração

```bash
npx tsx scripts/robots/explore-{nome}.ts 2>&1 | tee scripts/robots/explore-{nome}.log
```

Analisar o output do `console.log` para coletar os seletores reais retornados pelo `observe()`.

### 4. Gerar o script Playwright final

Com os seletores descobertos, gerar `scripts/robots/{nome}.ts`:

```typescript
import { chromium, Browser, Page } from "playwright";

// ─────────────────────────────────────────────────────────────
// Robô: {nome do robô}
// Origem: fluxo manual descrito por {produto/dev}
// Seletores descobertos via Stagehand em {data}
// ─────────────────────────────────────────────────────────────

async function run{NomeRobo}() {
  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  });
  const page: Page = await context.newPage();

  try {
    // Passo 1: {descrição original do produto}
    await page.goto("{url}", { waitUntil: "networkidle" });

    // Passo 2: {descrição}
    await page.locator("{seletor-descoberto-pelo-stagehand}").click();
    await page.waitForLoadState("networkidle");

    // Passo N: {descrição}
    await page.locator("{seletor}").fill("{valor}");

    // Validação: confirmar que o fluxo funcionou
    await page.waitForSelector("{seletor-de-confirmação}", { timeout: 10_000 });

  } finally {
    await browser.close();
  }
}

run{NomeRobo}().catch((err) => {
  console.error("Robô falhou:", err);
  process.exit(1);
});
```

### 5. Validar o script gerado

```bash
# Rodar em modo não-headless para visualizar
npx tsx scripts/robots/{nome}.ts

# Com Playwright test runner (se integrado ao projeto)
npx playwright test scripts/robots/{nome}.ts
```

---

## Árvore de Decisão

```
Produto tem conta Browserbase?       → env: "BROWSERBASE" (browser gerenciado em nuvem)
Sem conta Browserbase?               → env: "LOCAL" (Chromium local, grátis)
Passos envolvem login com 2FA?       → Coletar cookies/session manualmente e injetar
Fluxo tem upload de arquivo?         → Usar page.setInputFiles() no Playwright final
Fluxo precisa de múltiplas abas?     → Usar context.newPage() para cada aba
Site usa iframes?                    → Stagehand suporta nativamente, Playwright: page.frameLocator()
Seletor XPath muito longo/frágil?    → Simplificar para seletor semântico equivalente
```

---

## Regras

### Nunca
- Manter dependência do Stagehand no script final de produção
- Hardcodar credenciais no script — sempre usar variáveis de ambiente
- Usar seletores baseados em posição (ex: `(//div)[15]`) — frágeis demais
- Ignorar `waitForLoadState` ou `waitForSelector` após navegações
- Gerar script sem comentários mapeando os passos originais do produto

### Sempre
- Adicionar comentário no script final indicando que os seletores foram descobertos via Stagehand
- Usar `try/finally` para garantir que o browser fecha mesmo em erros
- Validar o resultado ao final (confirmar que o fluxo funcionou)
- Preferir seletores semânticos (texto, role, aria) sobre XPath absolutos quando possível
- Documentar no script qual foi o passo original descrito pelo produto

---

## Tratamento de Erros

### Stagehand não conseguiu executar um passo
- Verificar se a página carregou (`waitForLoadState`)
- Reformular a instrução natural — ser mais específico (ex: "clique no botão azul 'Enviar' no formulário de contato")
- Usar `observe()` primeiro para ver o que está disponível na página

### Seletor descoberto não funciona no Playwright
- Simplificar o XPath retornado pelo `observe()`
- Tentar equivalente com `page.getByRole()`, `page.getByText()`, `page.getByLabel()`
- Inspecionar manualmente o elemento no DevTools como fallback

### Site usa autenticação OAuth / SSO
- Fazer login manual uma vez, exportar cookies: `context.storageState({ path: "auth.json" })`
- Reutilizar o estado: `browser.newContext({ storageState: "auth.json" })`

### Script falha em CI (headless)
- Adicionar `--no-sandbox` no `chromium.launch({ args: ['--no-sandbox'] })`
- Verificar timeouts — ambientes CI podem ser mais lentos

---

## Checklist de Conclusão

- [ ] Passo a passo coletado do produto/dev (em linguagem natural)
- [ ] Script de exploração Stagehand criado e executado
- [ ] Seletores reais coletados do output do `observe()`
- [ ] Script Playwright final gerado sem dependência do Stagehand
- [ ] Comentários mapeando passos originais → código
- [ ] Credenciais em variáveis de ambiente (nunca hardcoded)
- [ ] `try/finally` para fechar o browser
- [ ] Validação ao final do fluxo
- [ ] Script testado rodando localmente

---

## Output

| Artefato | Descrição |
|----------|-----------|
| `scripts/robots/explore-{nome}.ts` | Script temporário de exploração com Stagehand (não vai a prod) |
| `scripts/robots/{nome}.ts` | Script final Playwright gerado com seletores reais |
| `scripts/robots/explore-{nome}.log` | Log da exploração com seletores descobertos |

---

## Mensagem de Conclusão

```
Robô gerado!

Fluxo: {descrição do fluxo automatizado}
Site alvo: {URL}
Passos automatizados: {N passos}
Seletores descobertos via: Stagehand observe()

Arquivos:
- scripts/robots/explore-{nome}.ts  ← script de exploração (pode descartar)
- scripts/robots/{nome}.ts          ← robô Playwright pronto para produção

Próximo passo: executar com `npx tsx scripts/robots/{nome}.ts`
```

---

## Recursos Adicionais

- **Stagehand docs**: https://docs.stagehand.dev
- **Skill relacionado**: `$IDE/skills/eng-scraper/SKILL.md` — para scraping/extração de dados
- **Skill relacionado**: `$IDE/skills/eng-qa-e2e/SKILL.md` — para testes E2E com linguagem natural
