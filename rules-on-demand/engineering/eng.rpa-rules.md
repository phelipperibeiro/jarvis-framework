> **Applies to:** HUB: all | POSITION: all | AREA: ENGINEERING | SQUAD: all

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

### Validação E2E (recomendada para fluxos de UI)

Quando o robô interage com interface visual (browser headless), usar a especialização de testes automatizados registrada em `QA_SPECIALIZATIONS` (via a base `eng-qa`) para gerar e executar testes do fluxo de automação:

- Útil para validar que o fluxo completo (login → navegação → extração) continua funcionando após mudanças
- Complementa os testes unitários com validação end-to-end contra o sistema-alvo em ambiente controlado
- Referência: `$IDE/skills/eng-qa/SKILL.md`

---

## 6. Documentação (obrigatório ao final de cada implementação)

Padrão de documentação técnica dos robôs. Vale sempre que um robô novo for implementado, um bug estrutural for resolvido ou descobertas relevantes sobre o site-alvo forem feitas.

### Localização

- Sempre criar em `docs/engineering/robots/{robot-tag}-robot.md`
- Exemplos: `docs/engineering/robots/consulta-orgao-robot.md`, `docs/engineering/robots/extrator-dados-robot.md`

### Conteúdo obrigatório

Todo arquivo `{robot-tag}-robot.md` deve conter:

| Seção | O que documentar |
|---|---|
| **Visão Geral** | O que o robô coleta e o que **não** coleta (limitações por design) |
| **Fluxo de Execução** | Sequência de chamadas HTTP com URLs completas de cada etapa |
| **Fontes de Dados** | Cada fonte (PDF, HTML, API) com mapeamento de campos/colunas |
| **Campos Extraídos** | Tabela por `situation` (ex: CONCLUIDO vs PENDENTE) — quais campos existem em cada uma e a fonte |
| **Limitações Conhecidas** | Campos indisponíveis na fonte do sistema/órgão externo — documentar por que não é possível extrair |
| **Histórico de Bugs** | Bugs resolvidos com referência ao Jira key, sintoma, causa e fix aplicado |
| **Checklist de Troubleshooting** | Tabela: sintoma → causa provável → ação |

Documentar também as variáveis de ambiente necessárias (sem os valores).

### Quando atualizar

- Ao implementar um robô novo
- Ao resolver qualquer bug estrutural (ex: campo retornando vazio, matching falho)
- Ao fazer descobertas relevantes sobre o comportamento do site-alvo (ex: estrutura de colunas HTML, campos disponíveis por situação do registro)
- Sempre referenciar o Jira key no histórico de bugs

### Proibido

- ❌ Criar em `docs/robots/` — pasta incorreta, usar `docs/engineering/robots/`
- ❌ Omitir a seção de **Limitações Conhecidas** — é fundamental para evitar que outros devs tentem implementar algo impossível
- ❌ Omitir o **Histórico de Bugs** — descobertas custam tempo; documentar evita retrabalho

### Recomendado

- Chamar `/jarvis-docs-index` após criar ou atualizar qualquer `{robot-tag}-robot.md` para manter o índice atualizado
- Incluir o índice de colunas da tabela HTML (com numeração `[0]`, `[1]`, etc.) sempre que for inspecionado via log

### Exceção

Nenhuma — todo robô deve ter sua documentação, independente do tamanho ou complexidade.

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

- `$IDE/skills/eng-automation/SKILL.md` — skill base de automação (+ especializações em `AUTOMATION_SPECIALIZATIONS`)
- `$IDE/agents/engineering/eng.rpa.agent.md` — agente especializado RPA (ARACHNE)