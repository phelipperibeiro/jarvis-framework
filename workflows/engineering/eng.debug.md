---
description: Fluxo de trabalho de Engenharia para debugging e incidentes
globs:
  alwaysApply: false
recommended_model: claude-sonnet-4-20250514
model_tier: very_high
model_justification: Debugging requer raciocínio complexo, formulação de hipóteses, análise de evidências e correlação de múltiplas fontes de informação
---

# Workflow de Engenharia – Debugging e Incidentes

## Objetivo

Guiar o assistente de Engenharia (ENG) na análise de bugs e incidentes,
formulando hipóteses de causa raiz e sugerindo passos seguros de investigação,
sempre respeitando `$IDE/rules/engineering/eng-rules.md`.

---

## Recursos e Dependências

> Carregar antes de iniciar qualquer passo.

### Agent
- **`$IDE/agents/engineering/eng.bug-hunter.md`** — persona ativa durante todo o workflow
  - Define postura investigativa, calibração por urgência/POSITION e checklist de qualidade

### Rules
- **`$IDE/rules/engineering/eng-rules.md`** — regras obrigatórias de engenharia
  - Inclui: Correlation ID obrigatório, fluxo downstream de cards, rigor por contexto (CDD)

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| Passo 0 | `/context-detect` | Se `ENABLE_CDD=true` no ENV.md |
| Passo 1.0 | `mcp__claude_ai_Atlassian__getJiraIssue` | Se Jira key fornecida |
| Passo 1.5 | `Read` / `Grep` / `Glob` (leitura do repo) | **Sempre** — obrigatório antes de formular hipóteses |
| Passo 2.5 | `/eng-ms-trace` | Se bug suspeito de cruzar serviços |
| Passo 6 | `/eng-qa-unit-test` | Para criar teste de regressão da correção |
| Passo 7 | `/bug-report create` | Para cada débito técnico ou melhoria identificada |
| Conclusão | `mcp__claude_ai_Atlassian__addCommentToJiraIssue` | Sempre — atualizar o card com findings |

### Próximos workflows (pós-debug)
- `eng.plan {TASK_MANAGER_KEY}` — se bug complexo com tradeoffs (decidido no Passo 5.5)
- `eng.work {TASK_MANAGER_KEY}` — se correção cirúrgica direta (decidido no Passo 5.5)

---

## Passo 0 – Análise de Contexto (CDD)

> 🎯 **Objetivo**: Adaptar o rigor e urgência da investigação com base no contexto.
> 📚 **Skill**: Use `/context-detect` se existir uma sessão ativa
> ⚙️ **Configurável**: Esta fase é opcional e controlada pela variável `ENABLE_CDD` no ENV.md

**Verificação de Ativação:**

Antes de herdar o contexto, verifique se o CDD está habilitado:

```bash
grep "^ENABLE_CDD=" $IDE/ENV.md
```

- Se `ENABLE_CDD=false` ou não definida → **Pular esta fase** e usar comportamento padrão (Passo 1)
- Se `ENABLE_CDD=true` → Herdar contexto normalmente

### 0.1 Herdar Contexto (se disponível)

Se existir arquivo `context.md` na sessão (gerado por `/context-detect`):

```bash
# Localização: $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/context.md
```

```yaml
CONTEXT_PROFILE:
  tipo: [hotfix|bugfix|feature|refactor]
  urgencia: [normal|alta|baixa]
  rigor: [mínimo|padrão|alto]
  comunicacao: [didático|direto|estratégico]
  autonomia: [baixa|média|alta]
```

### 0.2 Calibração por Urgência

| urgencia | Comportamento no Debug |
|----------|------------------------|
| `alta` | Fast track: foco em solução rápida, documentação mínima, hipóteses diretas |
| `normal` | Investigação completa, documentar hipóteses, validações |
| `baixa` | Análise profunda, considerar melhorias estruturais |

### 0.3 Detecção de Urgência por Palavras-Chave

Mesmo sem `context.md`, identifique sinais na mensagem do usuário:

| Sinal | Urgência Detectada |
|-------|--------------------|
| `produção`, `incidente`, `urgente`, `cliente afetado` | `alta` |
| `staging`, `bug`, `erro` | `normal` |
| `investigar`, `entender`, `quando puder` | `baixa` |

### 0.4 Calibração por POSITION (do ENV.md)

| Categoria | POSITION | Comportamento |
|-----------|----------|---------------|
| Técnico Junior | `junior`, `pleno` | Explicar hipóteses detalhadamente, sugerir leituras |
| Técnico Sênior | `senior`, `specialist` | Ser direto, focar em evidências críticas |
| Liderança | `tech-lead`, `staff`, `pm`, `tpm`, `gpm`, `cto`, `principal` | Incluir impacto em negócio, comunicação para stakeholders |

> ⚠️ **Valor padrão**: Se POSITION não definido, usar comportamento de `pleno`

---

## Passo 1 – Coletar sintomas e contexto

### 1.0 – Auto-fetch do card Jira (se Jira key fornecida)

> ⚡ **Automático**: Se o usuário passou uma Jira key (ex: `eng.debug PROJ-123`), buscar o card
> antes de fazer qualquer pergunta — evita o usuário ter que copiar e colar o conteúdo.

Se houver uma Jira key nos argumentos, usar o MCP Atlassian:

```
mcp__claude_ai_Atlassian__getJiraIssue({ issueKey: "{TASK_MANAGER_KEY}" })
```

Extrair do card e registrar:
- **Título** e **descrição** do bug
- **Passos para reproduzir** (se documentados)
- **Ambiente** (dev / staging / produção)
- **Serviços mencionados** (implícitos ou explícitos)
- **Correlation ID / Request ID** (se houver nos comentários ou anexos)
- **Stack trace ou logs** anexados

> Se o MCP Atlassian não estiver disponível, pedir ao usuário que cole o conteúdo do card.

Com o card lido, **não perguntar informações que já estão documentadas** — ir direto para o que
está faltando ou precisa de esclarecimento.

### 1.1 – Complementar o que o card não cobre

Após ler o card (ou sem card), verificar se ainda faltam:

- **Correlation ID ou Request ID** — fundamental para cruzar logs entre serviços
- **Frequência**: é recorrente? intermitente? acontece para todos os usuários?
- **Mudança recente** que pode ter causado: deploy, feature flag, migração, alteração de infra
- **Logs ou stack traces** não anexados ao card

Organizar todas as informações coletadas em:

```
Jira: {TASK_MANAGER_KEY} — {título}
Sintoma: {descrição objetiva}
Ambiente: {dev|staging|produção}
Serviço de entrada: {serviço onde o bug se manifesta}
Correlation ID: {valor ou "não disponível"}
Frequência: {recorrente|intermitente|uma vez}
Mudança recente: {sim: descrever | não | desconhecido}
```

---

## Passo 1.5 – Leitura do código antes de formular hipóteses

> ⚡ **Sempre executar** — hipóteses sem leitura de código são especulação. Este passo é obrigatório
> independente do bug ser single-service ou multi-service.

### 1.5.1 – Localizar o ponto de entrada no código

A partir do `Serviço de entrada` e do stack trace/endpoint coletados no Passo 1:

```bash
# Se há arquivo:linha no stack trace — ler o contexto direto
# Ler ±20 linhas ao redor da linha mencionada

# Se há apenas endpoint — localizar o handler
grep -rn "'{endpoint}'\|\"/{rota}\"" src/ --include="*.ts" -l

# Se há nome de função/método no stack trace — localizar
grep -rn "async {nomeFuncao}\|function {nomeFuncao}" src/ --include="*.ts"
```

### 1.5.2 – Ler o código relevante

Para cada arquivo identificado, ler:

1. **O handler/controller do endpoint** — validações, guards, dependências injetadas
2. **O service chamado pelo handler** — lógica de negócio, chamadas a outros serviços
3. **O ponto exato do stack trace** (arquivo:linha) — o que aquela linha faz, qual estado espera

**O que observar durante a leitura:**

| O que procurar | Por que importa |
|----------------|-----------------|
| `try/catch` ausente ou genérico | Pode estar engolindo o erro real |
| Chamada HTTP/AMQP sem timeout | Causa bugs intermitentes por lentidão |
| `async/await` faltando | Race condition ou promise não tratada |
| Validação de entrada ausente | Dado inválido chegando na camada errada |
| Dependência de estado externo (cache, DB, outro serviço) | Falha intermitente por estado inconsistente |
| Header `x-correlation-id` não propagado | Rastreamento manual necessário |

### 1.5.3 – Registrar o que foi lido

Antes de formular hipóteses, documentar:

```
Arquivo principal inspecionado: {arquivo:linha}
Fluxo lido: {handler} → {service} → {dependências}
Observações do código:
  - {observação 1}
  - {observação 2}
Código relevante (trecho):
  {snippet de no máximo 10 linhas — o ponto mais suspeito}
```

> Se o repositório não estiver acessível localmente, pedir ao usuário que cole o trecho relevante
> antes de prosseguir. **Não formular hipóteses sem ter lido o código.**

---

## Passo 2 – Hipóteses iniciais (sem mudar nada ainda)

Com base no contexto **e na leitura do código do Passo 1.5**:

1. Liste 2–5 **hipóteses possíveis de causa raiz**.
2. Para cada hipótese, indique:
   - por que ela faz sentido **com referência ao trecho de código lido**
   - como poderia ser confirmada ou refutada
   - quais dados adicionais seriam úteis

Não sugira ainda mudanças invasivas em código ou infraestrutura.

---

## Passo 2.5 – Rastreamento Multi-Serviço (condicional)

> 🎯 **Objetivo**: Automatizar a investigação cross-service antes de montar o plano de investigação.
> 📚 **Skill**: `/eng-ms-trace`
> ⚙️ **Condicional**: Ativar somente se sinais de envolvimento multi-serviço estiverem presentes.

### Quando Ativar

Ativar este passo se **qualquer** condição abaixo for verdadeira:

| Sinal | Exemplo |
|-------|---------|
| Usuário menciona outro serviço | "chama o auth", "integração com X", "vai pro notification" |
| Stack trace contém URL externa | `AxiosError`, `ECONNREFUSED`, URL de outro serviço |
| Stack trace contém nome de queue/exchange | `account.events`, `driver.commands` |
| Erro ocorre apenas em fluxos cross-service | Funciona isolado, falha no fluxo completo |
| Erro vem de HTTP client | `HttpException` com status de serviço externo |
| Bug intermitente suspeito de timeout | Falha após N segundos, funciona em retry |

### Como Ativar

Se os sinais acima estiverem presentes, invocar:

```
/eng-ms-trace {serviço-entrada} {sintoma-ou-jira-key}
```

**Exemplos:**
```
/eng-ms-trace account AUTH-403-no-login
/eng-ms-trace driver "usuário não recebe notificação após aceitar corrida"
```

### Usar o Resultado

Após `/eng-ms-trace` gerar o `ms-trace-report.md`:

- **Substituir** as hipóteses do Passo 2 pelas hipóteses rankeadas do trace report
- **Focar** o Passo 3 (Plano de Investigação) diretamente no boundary de maior risco
- **Pular** investigação manual de contratos e chamadas entre serviços

> ℹ️ Se o trace não conseguiu inspecionar todos os serviços (ex: token GitLab indisponível),
> registrar os serviços não inspecionados e incluir investigação manual deles no Passo 3.

---

## Passo 3 – Plano de investigação

Monte um plano **incremental e seguro** de investigação:

- Quais logs adicionais observar ou adicionar.
- Quais métricas monitorar.
- Quais queries/consultas podemos rodar em logs/observabilidade **sem** risco.
- Testes simples que o usuário pode executar em ambiente controlado.

Sempre deixe claro:

- quais passos são apenas observação/leitura
- quais exigem alteração de código, config ou dados

---

## Passo 4 – Análise de evidências

À medida que o usuário fornece resultados:

1. Atualize as hipóteses:
   - hipóteses descartadas
   - hipóteses fortalecidas
2. Refine o plano de investigação:
   - novos logs/consultas
   - novos cenários de teste

Se começar a convergir para uma causa provável, explique:

- o mecanismo do bug
- por que ele não aparecia antes (se aplicável)
- impacto potencial em outros fluxos

---

## Passo 5 – Propor correções com segurança

Somente depois de ter evidências razoáveis:

1. Sugira correções em código/infra **sempre**:
   - explicando a mudança
   - mapeando componentes afetados
   - sugerindo testes específicos após a alteração

2. Se a correção for arriscada:
   - proponha alternativa mais conservadora
   - considere workarounds temporários
   - recomende janelas e estratégias de deploy/rollback

---

## Passo 5.5 – Decisão: Plan obrigatório antes do Work

> ⚠️ **REGRA CRÍTICA**: Antes de sugerir o próximo passo, classifique o bug para definir o fluxo correto.

O fluxo completo de engenharia é: `start → plan → work → pre-pr → pr`

### Quando exige `eng.plan` antes do `work` (bug complexo)

Execute `eng.plan` se qualquer uma dessas condições for verdadeira:

- Existem **múltiplas abordagens possíveis** com tradeoffs a avaliar
- A correção **impacta mais de um componente ou serviço**
- Há **risco de regressão** em outras funcionalidades
- A causa raiz envolve **decisão arquitetural** (ex: refatorar vs. corrigir pontualmente)
- A correção requer **mudanças em infraestrutura, banco ou configuração**
- O bug é classificado como `BUG-CRÍTICO` ou `SEGURANÇA`

Mensagem de transição:

```
🗺️ Este bug envolve [tradeoffs / múltiplos componentes / risco de regressão].

Antes de implementar, vamos criar um plano para avaliar as alternativas e garantir
uma correção segura.

Próximo passo: → eng.plan {TASK_MANAGER_KEY}
```

### Quando pode ir direto ao `work` (bug simples)

Vá direto ao `work` somente se **todas** as condições abaixo forem verdadeiras:

- Há **uma única correção clara e óbvia**, sem alternativas relevantes
- O impacto é **cirúrgico** (1 arquivo, 1 função)
- Não há risco de efeito colateral
- A correção é trivial (ex: typo, valor errado, condição invertida)

Mesmo nesse caso, **informe o usuário** que o `plan` está sendo pulado e o motivo:

```
ℹ️ A correção é direta e cirúrgica: [descrever brevemente o que será feito].

O fluxo padrão é start → plan → work → pre-pr → pr, mas neste caso estamos
pulando o `plan` porque não há tradeoffs ou riscos que justifiquem o planejamento.

Próximo passo: → eng.work {TASK_MANAGER_KEY}
```

---

## Passo 6 – Validação pós-correção

### 6.1 – Criar teste de regressão

Invocar o skill de testes unitários para criar o teste que reproduz o bug:

```
/eng-qa-unit-test --mode=regression --bug=”{descrição da causa raiz}” --file=”{arquivo corrigido}”
```

O teste deve:
- **Falhar** antes da correção ser aplicada (prova que reproduz o bug)
- **Passar** após a correção (prova que o bug foi resolvido)
- Cobrir o edge case específico que causou o bug

### 6.2 – Plano de validação

- Testes a rodar antes do deploy (unitários + integração do fluxo afetado).
- Testes em ambiente de staging com os passos de reprodução do card.
- Como monitorar produção após o deploy:
  - logs do serviço corrigido (com Correlation ID se disponível)
  - métricas do endpoint/fluxo afetado
  - alertas existentes que deveriam ter disparado

### 6.3 – Critério de “bug resolvido”

Definir antes de considerar o card concluído:
- Comportamento esperado confirmado nos passos de reprodução do card
- Sem ocorrência em produção por X horas/dias (conforme severidade: P0=24h, P1=48h, P2=1 semana)

---

## Passo 7 – Aprendizados e melhorias estruturais

### 7.1 – Identificar melhorias

Quando fizer sentido, recomendar:

- Ajustes em observabilidade (melhores logs, métricas, dashboards).
- Hardening de código (tratamento de erro, timeouts, retries, DLQ).
- Propagação de Correlation ID (se ausente — verificar contra regra em `eng-rules.md`).
- Ajustes em processo (ex.: testes que poderiam ter prevenido esse bug).

### 7.2 – Criar cards de débito técnico

Para cada melhoria estrutural identificada, criar um card de débito técnico:

```
/bug-report create \
  --title="[{serviço}] {descrição da melhoria}" \
  --category="DÉBITO-TÉCNICO" \
  --location="{arquivo:linha relevante}" \
  --description="{por que essa melhoria é necessária}" \
  --behavior-actual="{o que existe hoje}" \
  --behavior-expected="{o que deveria existir}" \
  --environment="prod" \
  --linked-to="{TASK_MANAGER_KEY}"
```

Exemplos típicos após um debug cross-service:
- `[account] Correlation ID não propagado nas chamadas HTTP para auth` → `DÉBITO-TÉCNICO P2`
- `[auth] Sem timeout configurado no HttpModule` → `DÉBITO-TÉCNICO P2`
- `[notification] Sem DLQ na exchange de eventos AMQP` → `DÉBITO-TÉCNICO P1`

Sempre deixe claro o que é:
- ação imediata (incluir no PR atual)
- melhoria futura (card de débito criado no Jira)

---

## Conclusão – Atualizar card Jira com findings

Ao finalizar a investigação, independente do resultado (bug encontrado ou inconclusivo),
atualizar o card Jira com um comentário estruturado:

```
mcp__claude_ai_Atlassian__addCommentToJiraIssue({
  issueKey: "{TASK_MANAGER_KEY}",
  comment: "
## Resultado da Investigação

**Causa raiz identificada**: {sim/não/parcial}
**Causa raiz**: {descrição ou 'investigação em andamento'}

**Serviços envolvidos**: {lista}
**Boundary com problema**: {boundary ou 'interno ao {serviço}'}

**Hipóteses descartadas**: {lista resumida}

**Próximo passo**: {eng.plan {TASK_MANAGER_KEY} | eng.work {TASK_MANAGER_KEY} | aguardar mais logs}

**Débitos técnicos identificados**: {N cards criados — IDs}
  "
})
```

> Isso garante que qualquer dev que abrir o card no futuro encontra o histórico da investigação,
> sem depender de memória ou Slack.
