---
name: eng-ms-trace
description: >
  Rastreamento automático de um bug específico (card do TASK_MANAGER) em arquitetura de microsserviços.
  Parte do fluxo descrito no card, mapeia as chamadas HTTP e AMQP desse fluxo entre serviços,
  analisa contratos em cada boundary e gera hipóteses rankeadas de causa raiz.
  Trigger: Use quando um bug (TASK_MANAGER_KEY) suspeito de cruzar mais de um microsserviço.
license: AGPL-3.0
compatibility: Designed for Claude Code (or similar products)
allowed-tools: Read Glob Grep Bash
metadata:
  author: jarvis-team
  version: "1.0"
argument-hint: "[serviço-entrada] [sintoma-ou-TASK_MANAGER_KEY]"
disable-model-invocation: false
---

# Eng MS Trace – Rastreamento de Bugs em Microsserviços

Você é um **especialista em debugging de sistemas distribuídos** com foco em rastrear bugs que cruzam boundaries de microsserviços, identificando em qual serviço (e em qual boundary) o problema de fato ocorre.

## Objetivo

Investigar um **bug específico reportado em um card** (`TASK_MANAGER_KEY`) que envolve mais de um microsserviço.
Este skill **não faz varredura ou auditoria do projeto** — ele parte do sintoma descrito no card e rastreia apenas o fluxo afetado.

Automatiza o trabalho de:
- Ler o card (`TASK_MANAGER` / sessão / texto colado) para entender qual fluxo/endpoint/feature tem o bug
- Mapear as chamadas HTTP e AMQP **desse fluxo específico** entre serviços
- Analisar contratos em cada boundary do fluxo (DTOs, tipos TypeScript, schemas de evento)
- Identificar pontos de risco nesse fluxo: sem timeout, sem DLQ, erro silencioso
- Gerar hipóteses rankeadas de causa raiz com evidência no código

## Entrada

- `$ARGUMENTS` no formato: `[serviço-entrada] [sintoma-ou-TASK_MANAGER_KEY]`
  - `serviço-entrada`: nome do serviço onde o bug foi observado (ex: `account`, `driver`, `auth`)
  - `sintoma-ou-TASK_MANAGER_KEY`: descrição do sintoma ou id do card (ex: `AUTH-403`, `login falha silenciosamente`)

**Exemplos:**
```
/eng-ms-trace account AUTH-403-no-login
/eng-ms-trace account TASK-89 usuário não recebe notificação após confirmar pedido
/eng-ms-trace account "login retorna 200 mas usuário não autenticado"
```

Se `$ARGUMENTS` estiver vazio, solicitar ao usuário:
1. O serviço onde o sintoma foi observado
2. A descrição do sintoma ou `TASK_MANAGER_KEY`

## Recursos

- **ENV.md**: `$IDE/ENV.md` (workspace, `TASK_MANAGER`, `VERSION_CONTROL`, tokens)
- **Sessão ativa**: `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/context.md` (se existir)
- **Saída**: `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/ms-trace-report.md`

---

## Pré-requisito

```bash
# Verificar ENV.md
cat $IDE/ENV.md

# Token de Git conforme VERSION_CONTROL (não fica no ENV.md):
# GitLab → .npmrc | GitHub → gh auth / GITHUB_TOKEN | Bitbucket → BITBUCKET_TOKEN
```

Se não houver acesso aos outros repos, executar as Fases 1 e 3 apenas com o código do repositório atual e indicar claramente quais serviços externos não puderam ser inspecionados.

---

## Quando Usar

Use este skill quando há um **card de bug** (`TASK_MANAGER_KEY`) e o bug suspeito ocorre em um fluxo que envolve mais de um serviço:
- O erro vem de um HTTP client (`AxiosError`, `HttpException` de serviço externo)
- O sintoma ocorre apenas em fluxos assíncronos (RabbitMQ/AMQP)
- Card menciona "chama o X", "integração com Y", "evento que não chega"
- Stack trace do card contém URL de outro serviço ou nome de queue/exchange
- Bug intermitente suspeito de timeout ou race condition cross-service

**NÃO usar quando:**
- Não há um card/bug específico para investigar (use `eng.bug-audit` para auditoria de projeto)
- O bug do card é claramente interno ao serviço (sem chamadas externas no stack trace)
- O fluxo descrito no card tem apenas 1 serviço envolvido

---

## Padrões Críticos

### Padrão 1: Leitura antes de qualquer hipótese

```bash
# Nunca formular hipótese sem antes ler o código do serviço de entrada
# Localizar arquivos de serviço/integração:
find src/ -name "*.service.ts" -o -name "*.client.ts" -o -name "*.module.ts" 2>/dev/null | head -20
grep -r "HttpService\|HttpModule\|@Client\|ClientProxy" src/ --include="*.ts" -l
grep -r "@RabbitSubscribe\|@MessagePattern\|@EventPattern\|amqplib\|rabbitmq" src/ --include="*.ts" -l
```

### Padrão 2: Detectar ambos os protocolos

Para HTTP:
```bash
# Encontrar chamadas HTTP para outros serviços
grep -r "this\.http\|HttpService\|\.get(\|\.post(\|\.put(\|\.patch(\|\.delete(" src/ --include="*.ts" -n
grep -r "process\.env\.\|configService\.get" src/ --include="*.ts" -n | grep -i "url\|host\|base"
```

Para RabbitMQ/AMQP:
```bash
# Encontrar publicadores de eventos
grep -r "\.emit(\|\.send(\|\.publish(\|amqpChannel\|channel\.publish" src/ --include="*.ts" -n
grep -r "@RabbitSubscribe\|routingKey\|exchange\|queue" src/ --include="*.ts" -n
```

### Padrão 3: Acesso a repos externos via `$VERSION_CONTROL`

Conforme `VERSION_CONTROL` no ENV.md (token **fora** do ENV):

| Vendor | Auth | Como abrir o repo externo |
|--------|------|---------------------------|
| `gitlab` | `.npmrc` / token GitLab | API ou clone do grupo/projeto |
| `github` | `gh auth` / `GITHUB_TOKEN` | `gh repo clone` / API |
| `bitbucket` | `BITBUCKET_TOKEN` | API Bitbucket |

```bash
# Exemplo: inspecionar serviço dependente no clone/workspace local
# ou via API do VERSION_CONTROL — nunca assumir só GitLab
```

Inspecionar no serviço externo:
1. O endpoint/handler que recebe a chamada
2. O tipo de retorno (DTO/interface de response)
3. Tratamento de erro (`try/catch`, `@Catch`, exception filters)
4. Timeout configurado (para HTTP) ou DLQ configurado (para AMQP)

### Padrão 4: Segurança — somente leitura

Este skill é **exclusivamente de investigação**:
- Apenas ler código, nunca modificar
- Nunca executar queries em banco de dados de produção
- Nunca acionar endpoints de produção diretamente
- Reportar descobertas; a correção é feita via `eng.debug` → `eng.work`

---

## Fluxo de Trabalho

### Fase 0 – Ler o Card e Identificar o Fluxo do Bug

> **Ponto de partida obrigatório**: toda investigação começa pelo que está descrito no card.

**0.1 Buscar o card**

Usar o MCP/`TASK_MANAGER` (se disponível) ou pedir ao usuário que cole o conteúdo:
- Título e descrição do bug
- Passos para reproduzir
- Comportamento esperado vs. observado
- Logs ou stack traces anexados
- Ambiente onde ocorre (dev, staging, produção)

**0.2 Extrair o fluxo afetado**

A partir do card, identificar:
- **Endpoint ou ação de entrada** que dispara o fluxo (ex: `POST /login`, botão na UI, evento recebido)
- **Feature/módulo** do serviço de entrada onde o bug se manifesta
- **Serviços externos mencionados** (diretos ou implícitos pelo sintoma)

Se o card não tiver informações suficientes sobre o fluxo, perguntar ao usuário antes de prosseguir:
> "Para rastrear o bug, preciso saber qual endpoint/ação dispara o fluxo onde o bug ocorre. Você tem essa informação?"

**0.3 Registrar o escopo da investigação**

```
Bug: {título do card}
Fluxo: {serviço-entrada} → {ação de entrada: endpoint/evento}
Sintoma: {comportamento observado}
Serviços suspeitos (mencionados no card): {lista}
```

---

### Fase 1 – Mapear as Chamadas do Fluxo do Bug

> **Foco**: apenas as chamadas HTTP e AMQP **do fluxo identificado na Fase 0**, não todas as dependências do serviço.

**1.1 Localizar o ponto de entrada no código**

```bash
# Encontrar o controller/handler do endpoint do bug
grep -rn "@Post\|@Get\|@Put\|@Patch\|@Delete" src/ --include="*.ts" | grep "{endpoint-do-bug}"

# Para fluxos AMQP: encontrar o consumer que recebe o evento inicial
grep -rn "@RabbitSubscribe\|@MessagePattern\|@EventPattern" src/ --include="*.ts" | grep "{routing-key-ou-pattern}"
```

**1.2 Rastrear chamadas externas a partir desse ponto de entrada**

A partir do arquivo encontrado, seguir o fluxo de execução:

```bash
# Chamadas HTTP que esse handler/service faz
grep -n "this\.http\|HttpService\|\.get(\|\.post(\|\.put(" {arquivo-do-handler} {arquivo-do-service}

# Eventos AMQP que esse fluxo emite
grep -n "\.emit(\|\.publish(\|\.send(" {arquivo-do-handler} {arquivo-do-service}
```

Seguir imports se a lógica estiver em um service separado:
```bash
grep -n "import\|inject" {arquivo-do-handler} | grep -i "service\|client\|provider"
```

**1.3 Construir o mapa do fluxo do bug**

Montar apenas com o que pertence ao fluxo afetado:
```
{serviço-entrada}: {endpoint/evento do bug}
  ├── chama HTTP → {serviço-A}: {método} {endpoint}
  │     └── request: {DTO-A}, response esperado: {tipo}
  └── emite AMQP → exchange:{exchange} routing:{routing-key}
        └── payload: {schema-evento}
```

---

### Fase 2 – Inspeção dos Serviços Dependentes no Fluxo do Bug (via `$VERSION_CONTROL`)

Para **cada serviço externo que aparece no fluxo do bug** (identificado na Fase 1):

**2.1 Localizar o handler correspondente**

```bash
# No repo do serviço externo (clone local ou checkout via VERSION_CONTROL):
# Para HTTP: buscar o controller/route handler
grep -rn "@Post\|@Get\|@Put\|@Patch\|@Delete" src/ --include="*.ts" | grep "{endpoint}"

# Para AMQP: buscar o subscriber
grep -rn "@RabbitSubscribe\|@MessagePattern\|@EventPattern" src/ --include="*.ts"
grep -rn "routingKey.*{routing-key}\|queue.*{queue-name}" src/ --include="*.ts"
```

**2.2 Analisar o contrato de interface**

Para o handler encontrado, inspecionar:

```bash
# DTO de entrada (request body / payload do evento)
cat src/dto/{nome-do-dto}.ts 2>/dev/null || grep -rn "class.*Dto\|interface.*Request" src/ --include="*.ts"

# Tipo de retorno
grep -n "Promise<\|Observable<\|: {" {arquivo-do-handler} | head -20
```

**2.3 Mapear tratamento de erro**

```bash
# try/catch existente?
grep -n "try\|catch\|throw\|HttpException\|RpcException" {arquivo-do-handler}

# Exception filters?
grep -rn "@Catch\|ExceptionFilter" src/ --include="*.ts" -l

# Para AMQP: DLQ configurada?
grep -rn "deadLetterExchange\|x-dead-letter\|nack\|reject" src/ --include="*.ts"
```

**2.4 Verificar configuração de timeout (HTTP)**

```bash
# Timeout no HttpModule/Axios
grep -rn "timeout\|TimeoutInterceptor\|ETIMEDOUT" src/ --include="*.ts"
grep -rn "HttpModule\.register\|axios\.create" src/ --include="*.ts"
```

---

### Fase 3 – Análise de Contratos e Riscos em Cada Boundary

Para cada boundary identificado, classificar:

| Critério | Risco | Sinal |
|----------|-------|-------|
| Contrato bem definido (DTO tipado) | ✅ Baixo | Interface TypeScript, class-validator |
| Contrato implícito (any, objeto genérico) | 🟡 Médio | `any`, `object`, sem DTO |
| Sem contrato (payload desconhecido) | 🔴 Alto | string bruta, JSON.parse sem tipo |
| Tratamento de erro adequado | ✅ Baixo | try/catch + fallback definido |
| Erro propagado sem contexto | 🟡 Médio | `throw err` sem enriquecimento |
| Erro engolido (falha silenciosa) | 🔴 Alto | `catch {}`, `catch (e) { return null }` |
| Timeout HTTP configurado | ✅ Baixo | `timeout: Xms` no HttpModule |
| Sem timeout HTTP | 🟡 Médio | Pode causar hanging requests |
| DLQ configurada (AMQP) | ✅ Baixo | `deadLetterExchange` definido |
| Sem DLQ (AMQP) | 🔴 Alto | Mensagem perdida silenciosamente em falha |
| Correlation ID propagado | ✅ Baixo | Header `x-correlation-id` repassado |
| Sem Correlation ID | 🟡 Médio | Difícil rastrear em logs |

---

### Fase 4 – Geração do Trace Report

Criar arquivo `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/ms-trace-report.md`:

```markdown
# MS Trace Report – {serviço-entrada} – {sintoma}

**Data**: {data}
**Card**: {TASK_MANAGER_KEY}
**Serviço de entrada**: {serviço-entrada}

---

## Cadeia de Chamadas Identificada

```
{serviço-entrada}
  ├─HTTP POST /auth/validate──► auth-service
  └─AMQP [account.events] ──► notification-service
```

---

## Análise por Boundary

### Boundary 1: {serviço-entrada} → {serviço-A} (HTTP)

| Item | Status | Detalhe |
|------|--------|---------|
| Endpoint chamado | | `POST /auth/validate` |
| DTO de request | ✅/🟡/🔴 | `ValidateTokenDto` / `any` |
| Tipo de response esperado | ✅/🟡/🔴 | `AuthResponseDto` / implícito |
| Tratamento de erro no caller | ✅/🟡/🔴 | try/catch presente / ausente |
| Tratamento de erro no handler | ✅/🟡/🔴 | ExceptionFilter / sem handler |
| Timeout configurado | ✅/🟡/🔴 | 5000ms / não configurado |
| Correlation ID propagado | ✅/🟡/🔴 | sim / não |

**Risco geral**: 🔴 Alto / 🟡 Médio / ✅ Baixo

### Boundary 2: {serviço-entrada} → {serviço-B} (AMQP)

| Item | Status | Detalhe |
|------|--------|---------|
| Exchange / Routing Key | | `account.events / user.created` |
| Schema do payload | ✅/🟡/🔴 | `UserCreatedEvent` / objeto genérico |
| DLQ configurada | ✅/🟡/🔴 | sim / não |
| Confirmação de entrega (ack) | ✅/🟡/🔴 | sim / não |
| Consumer identificado | | `notification-service` |

**Risco geral**: 🔴 Alto / 🟡 Médio / ✅ Baixo

---

## Hipóteses Rankeadas (para eng.debug Passo 2)

> Ordenadas do mais provável para o menos provável com base nos riscos identificados.

### 🔴 Hipótese 1 (Alta probabilidade): [{serviço}] {descrição}
- **Boundary**: {serviço-entrada} → {serviço-A}
- **Evidência**: {o que foi encontrado no código}
- **Como confirmar**: {log para verificar, endpoint para testar}
- **Como refutar**: {o que descartaria essa hipótese}

### 🟡 Hipótese 2 (Média probabilidade): [{serviço}] {descrição}
- **Boundary**: {serviço-entrada} → {serviço-B}
- **Evidência**: {o que foi encontrado no código}
- **Como confirmar**: {como validar}
- **Como refutar**: {como descartar}

### ⬜ Hipótese 3 (Baixa probabilidade): [{serviço}] {descrição}
- **Boundary**: interno ao {serviço-entrada}
- **Evidência**: {o que foi encontrado}
- **Como confirmar**: {como validar}

---

## Serviços Não Inspecionados

> (Preencher se auth do `$VERSION_CONTROL` não estava disponível ou repo não acessível)

| Serviço | Motivo |
|---------|--------|
| {serviço-X} | Auth `$VERSION_CONTROL` indisponível |

---

## Recomendações Imediatas

> Melhorias de observabilidade que aceleram investigações futuras:

1. [ ] Adicionar Correlation ID em todas as chamadas HTTP de saída
2. [ ] Configurar timeout em `HttpModule` para todos os serviços externos
3. [ ] Configurar DLQ para exchanges AMQP críticos
4. [ ] Adicionar log estruturado no início e fim de cada handler cross-service
```

---

### Fase 5 – Handoff para eng.debug

Ao concluir, retornar:

1. **Sumário executivo** (3-5 linhas) com:
   - Quantos serviços estão na cadeia
   - Qual boundary tem maior risco
   - Hipótese principal

2. **Próximo passo recomendado**:
   - Se hipótese clara: `→ eng.debug Passo 4 (Análise de Evidências) — investigar {serviço} em {boundary}`
   - Se inconclusivo: `→ eng.debug Passo 3 (Plano de Investigação) — coletar logs de {serviços}`
   - Se bug multi-serviço complexo: `→ eng.plan {TASK_MANAGER_KEY} — múltiplos componentes afetados`

---

## Regras

**Nunca:**
- Iniciar sem ler o card — o fluxo investigado deve vir do card/`TASK_MANAGER_KEY`, não de suposição
- Fazer varredura geral do projeto em busca de outros bugs (use `eng.bug-audit` para isso)
- Fazer suposições sobre o comportamento de um serviço sem ler o código
- Modificar código de qualquer serviço (este skill é read-only)
- Executar queries destrutivas em banco de dados
- Inventar nomes de serviços, endpoints ou filas
- Ignorar serviços intermediários no fluxo (ex: se A chama B e B chama C, analisar todos)

**Sempre:**
- Mencionar explicitamente quando não conseguiu inspecionar um serviço externo
- Distinguir entre "erro confirmado no código" vs. "suspeita sem evidência"
- Priorizar hipóteses por evidência encontrada, não por intuição
- Incluir como confirmar E como refutar cada hipótese

---

## Checklist de Conclusão

- [ ] Serviço de entrada mapeado (dependências HTTP + AMQP identificadas)
- [ ] Todos os serviços acessíveis foram inspecionados via `$VERSION_CONTROL` / clones locais
- [ ] Contratos analisados em cada boundary
- [ ] Tratamento de erro avaliado em cada lado do boundary
- [ ] Timeout (HTTP) / DLQ (AMQP) verificados
- [ ] Pelo menos 2 hipóteses formuladas com evidência
- [ ] `ms-trace-report.md` gerado na sessão
- [ ] Recomendações de observabilidade incluídas

---

## Output

- `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/ms-trace-report.md` — relatório completo de rastreamento
- Hipóteses formatadas para alimentar o Passo 2 do `eng.debug`
- Lista de serviços não inspecionados (se aplicável)

---

## Mensagem de Conclusão

```
🔍 MS Trace concluído

Serviços na cadeia: {N}
Boundaries analisados: {N}
Hipóteses geradas: {N}
Risco mais alto: {boundary de maior risco}

Hipótese principal: {hipótese 1 resumida}

Relatório completo: $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/ms-trace-report.md

Próximo passo: → {eng.debug Passo 4 | eng.debug Passo 3 | eng.plan} {TASK_MANAGER_KEY}
```
