# `/eng.rpa.robot` — criar ou manter um robô de automação

Workflow: `workflows/engineering/eng.rpa.robot.md` · Agente: `ARACHNE` (`eng.rpa.agent`) · Regras: `rules/engineering/rpa/eng.rpa-rules.md`

## Em uma frase

Conduz o ciclo de vida de um robô RPA (scraping ou automação de um sistema externo): criar um novo (`new`) ou manter um existente (`update`).

## O que é

Um fluxo único que usa o ciclo normal de engenharia (`eng.plan`, `eng.work`, `eng.pre-pr` e `eng.pr`), acrescentando as etapas específicas de robô: analisar o sistema-alvo, escolher a ferramenta certa e documentar o robô.

## Quando usar

- Criar um robô novo para um sistema externo
- Corrigir ou evoluir um robô existente (seletor quebrado, campo novo, fluxo novo)

## Quando **não** usar

- Você só quer investigar um bug comum → [`eng.debug`](./eng.debug.md)
- O código que você quer escrever não é um robô → [`eng.start`](./eng.start.md)

## Como usar

```
/eng.rpa.robot new {TASK_MANAGER_KEY}
/eng.rpa.robot update {TASK_MANAGER_KEY}
```

Se faltar informação, ele pergunta nesta ordem: o modo, o card, o **tag do serviço** (`consulta-orgao`, `extrator-dados`...) quando for novo, ou qual robô manter (listando `docs/engineering/robots/`) quando for atualização. O tag é o nome do serviço em kebab-case, e **nunca** o nome hardcoded de um sistema externo.

## Como funciona

**Setup:** confere o `ENV.md`, roda o CDD se estiver ligado e cria a branch `{TASK_MANAGER_KEY}-{robot-tag}` a partir de `dev` e a pasta da sessão.

### Modo `new`

| Fase | O que acontece |
|---|---|
| N1. Análise do sistema-alvo (**obrigatória antes de qualquer código**) | Verifica o `robots.txt` e os termos de uso; reconhece o fluxo (autenticação, URLs, campos, formato de saída, anti-bot); mapeia campos que existem contra os que faltam; decide a ferramenta |
| N1.5 | Cria o `architecture.md` |
| N2 | `eng.plan` |
| N3 | `eng.work`, com a checklist do robô |
| N4 | Documenta em `docs/engineering/robots/{robot-tag}-robot.md` |
| N5 | `eng.pre-pr` e `eng.pr` |

**Escolha da ferramenta** (princípio **HTTP-first**): tenta primeiro achar uma API ou endpoint HTTP; só usa navegador se a renderização de JS for obrigatória.

| Situação | Ferramenta |
|---|---|
| API HTTP identificada | axios com retry |
| HTML estático | Cheerio com axios |
| JS obrigatório, sem API | Puppeteer ou Playwright |
| Anti-bot agressivo | Puppeteer stealth |
| Fluxo em linguagem natural, seletores desconhecidos | `/eng-scraper-robot-builder` (Stagehand) |

Para explorar o sistema, usa o Playwright MCP, o Playwright CLI (`codegen`) ou o Stagehand. Com `MAX_AI_EXECUTION_PERCENTAGE=100`, escolhe sozinho; nos demais casos, pergunta.

### Modo `update`

Lê o documento do robô, entende a mudança (e, se envolver o sistema-alvo, inspeciona o que mudou antes de propor código), cria um `architecture.md` de manutenção, implementa, atualiza a documentação e segue para `eng.pre-pr` e `eng.pr`.

## Regras que importam

- **Nunca** pula a análise do sistema-alvo (`new`) nem a leitura do documento do robô (`update`)
- **Nunca** hardcoda credenciais: vão em `process.env`
- **Sempre** verifica o `robots.txt` antes de qualquer implementação nova
- Seletores em ordem de estabilidade: id, `data-*`, CSS estável e XPath por texto; nunca posicional sem fallback
- Retry com backoff em todo I/O, logs estruturados por fase e captura de tela em falha
- Captcha e proxy são infraestrutura compartilhada: se não existirem no projeto, escala para o Tech Lead em vez de reimplementar
- A documentação do robô (com limitações conhecidas e histórico de bugs) é obrigatória

## Próximo passo típico

Revisar o MR criado pelo [`eng.pr`](./eng.pr.md)
