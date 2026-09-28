> **Applies to:** HUB: BACKEND | POSITION: all | AREA: ENGINEERING | SQUAD: all

# Eng RPA Rules — Padrões de Arquitetura e Código para Robôs de Automação

## Objetivo

Definir padrões de arquitetura, estrutura de projeto, resiliência, observabilidade e segurança
para robôs de automação RPA. Toda implementação nova deve seguir estas regras.

---

## 0. Princípios Fundamentais

### HTTP-first

Sempre tentar quebrar o site via requisição HTTP antes de recorrer ao browser.
Browser é mais lento, frágil e custoso — só usar quando HTTP não for viável.

1. Inspecionar as requests de rede do fluxo alvo (DevTools, Playwright MCP, CLI codegen)
2. Se existir API ou endpoint HTTP → implementar sem browser
3. Só partir para browser se renderização JS for obrigatória ou não houver API exposta

### Infraestrutura Anti-bot é Pré-requisito Compartilhado

Captcha solving e proxy rotation são recursos de infraestrutura do projeto — **não implementar do zero por robô**.

- Antes de criar um robô novo, verificar se esses serviços já existem no projeto
- Se não existirem, escalar para o TL — o robô não deve ser iniciado sem essa infraestrutura quando o sistema-alvo exigir
- Cada robô consome a infraestrutura existente, nunca a reimplementa

---

## 1. Estrutura de Projeto

### Localização dos Robôs

```
src/
  robots/
    {robot-tag}/
      {robot-tag}.robot.ts       ← classe principal do robô
      {robot-tag}.types.ts       ← tipos e interfaces
      {robot-tag}.config.ts      ← configurações (sem credenciais hardcodadas)
      {robot-tag}.spec.ts        ← testes unitários (mocks de browser/HTTP)
```

### Nomenclatura

- `{robot-tag}` sempre em `kebab-case` (ex: `consulta-orgao`, `extrator-dados`)
- Classe do robô: `{RobotTag}Robot` em PascalCase (ex: `ConsultaOrgaoRobot`)
- Método principal: `execute(input: Input): Promise<Output>`
- Métodos internos de fase: `_phaseNome()` — prefixo `_` para métodos privados de fase

---

## 2. Resiliência

### Seletores CSS/XPath

Prioridade obrigatória (do mais para o menos estável):

1. `id` do elemento
2. `data-*` atributo semântico (ex: `data-testid`, `data-cy`)
3. CSS estável baseado em estrutura semântica (ex: `.form-login input[type="password"]`)
4. XPath por texto literal (ex: `//button[text()="Entrar"]`)
5. ❌ **NUNCA** seletor posicional sem fallback (ex: `tr:nth-child(3) > td:nth-child(2)`)

Se seletor posicional for inevitável, documentar no `{robot-tag}-robot.md` com razão explícita.

### Retry com Backoff

Todo I/O que pode falhar (navegação, clique, requisição HTTP) deve ter retry:

```typescript
// Padrão mínimo aceitável
const retryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  backoffFactor: 2,    // 1s → 2s → 4s
  jitterMs: 500,       // evita thundering herd
};
```

Use `p-retry` ou implemente wrapper equivalente. Nunca `try/catch` com `setTimeout` fixo.

### Timeout por Fase

Definir timeout explícito por operação — nunca depender do timeout padrão do framework:

```typescript
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30_000 });
await page.waitForSelector(selector, { timeout: 10_000 });
```

---

## 3. Observabilidade

### Logs Estruturados por Fase

Todo robô deve logar no início e fim de cada fase, com contexto suficiente para diagnóstico:

```typescript
// Início de fase
logger.log({ phase: 'autenticacao', status: 'iniciando', robotTag, inputId });

// Sucesso
logger.log({ phase: 'autenticacao', status: 'ok', robotTag, durationMs });

// Falha
logger.error({ phase: 'autenticacao', status: 'falha', robotTag, error: err.message, attempt });
```

Usar `@nestjs/common` Logger ou equivalente configurado no projeto. Nunca `console.log`.

### Screenshot em Falha

Para robôs com browser headless, capturar screenshot automaticamente em qualquer erro não recuperável:

```typescript
catch (err) {
  await page.screenshot({ path: `./debug/${robotTag}-${Date.now()}.png`, fullPage: true });
  logger.error({ phase, status: 'falha', screenshot: true, error: err.message });
  throw err;
}
```

### Métricas Mínimas

Registrar ao final de cada execução:
- `durationMs` — tempo total de execução
- `recordsExtracted` — quantidade de registros obtidos (0 é um valor válido, mas deve ser logado)
- `attempt` — número de tentativas utilizadas

---

## 4. Configuração e Segurança

### Credenciais

- ❌ **NUNCA** hardcodar credenciais, tokens, cookies ou senhas no código
- ✅ Sempre via variáveis de ambiente: `process.env.ROBOT_USER`, `process.env.ROBOT_PASSWORD`
- Documentar quais variáveis são necessárias no `{robot-tag}-robot.md` (sem os valores)

### User-Agent e Headers

- Nunca usar `headless: true` sem configurar user-agent realista
- Configurar viewport, user-agent e idioma conforme o sistema-alvo espera
- Não falsificar identidade de formas que violem ToS do sistema-alvo

### robots.txt e ToS

**Obrigatório antes de qualquer implementação:**

```bash
curl -s "{sistema-alvo}/robots.txt"
```

Se houver restrições, comunicar ao usuário antes de escrever qualquer linha de código.
Documentar o resultado no `{robot-tag}-robot.md` na seção de Visão Geral.

---

## 5. Testes

### Testes Unitários (obrigatório)

- Mockar o browser (Puppeteer/Playwright) ou HTTP client — nunca testar contra o sistema-alvo real em CI
- Testar pelo menos: fluxo feliz, falha de autenticação, timeout de seletor, resposta vazia
- Cobertura mínima: 70% das branches do método `execute()`

### Testes de Integração (condicional)

- Executar manualmente antes do PR em ambiente com acesso ao sistema-alvo
- Não incluir no pipeline de CI sem ambiente controlado

### TestSprite (recomendado para fluxos de UI)

Quando o robô interage com interface visual (browser headless), usar o skill `eng-qa-testsprite` para gerar e executar testes do fluxo de automação:

```
/eng-qa-testsprite
```

- Útil para validar que o fluxo completo (login → navegação → extração) continua funcionando após mudanças
- Complementa os testes unitários com validação end-to-end contra o sistema-alvo em ambiente controlado
- Referência: `$IDE/skills/eng-qa-testsprite/SKILL.md`

---

## 6. Documentação (obrigatório ao final de cada implementação)

Seguir `$IDE/rules/engineering/eng.docs-scraping-rules.md` sem exceções.

Criar ou atualizar `docs/engineering/robots/{robot-tag}-robot.md` com:
- Visão Geral (o que coleta e o que **não** coleta)
- Fluxo de Execução (sequência de passos com URLs)
- Fontes de Dados e Campos Extraídos
- Variáveis de Ambiente necessárias
- Limitações Conhecidas
- Histórico de Bugs

---

## 7. Definição de Pronto para Robôs RPA

Um robô está pronto para PR quando:

- [ ] Classe implementada seguindo a estrutura de projeto definida
- [ ] Retry com backoff em todos os I/Os que podem falhar
- [ ] Logs estruturados por fase com contexto de diagnóstico
- [ ] Screenshot automático em falha (para browser headless)
- [ ] Testes unitários com cobertura ≥ 70% das branches do `execute()`
- [ ] Nenhuma credencial hardcodada (todas via `process.env`)
- [ ] `{robot-tag}-robot.md` criado ou atualizado
- [ ] robots.txt verificado e resultado documentado

---

## Exceções

Qualquer exceção a estas regras deve ser documentada no `{robot-tag}-robot.md`
com justificativa explícita. Exceções recorrentes devem ser propostas como atualização desta rule.

## Referências

- `$IDE/rules/engineering/eng.docs-scraping-rules.md` — padrão de documentação de robôs
- `$IDE/skills/eng-scraper/SKILL.md` — skill de scraping (Puppeteer, Playwright, ETL)
- `$IDE/skills/eng-scraper-robot-builder/SKILL.md` — skill de automação via Stagehand
- `$IDE/agents/engineering/eng.rpa.agent.md` — agente especializado RPA (ARACHNE)