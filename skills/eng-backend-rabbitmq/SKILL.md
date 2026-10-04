---
name: eng-backend-rabbitmq
description: >
  Especialista completo em RabbitMQ: gerenciamento via Management HTTP API, criação de consumers/producers,
  arquitetura de mensageria, resolução de problemas e boas práticas.
  Trigger: Use quando falar de eventos, filas, orquestramento de filas, mensageria, consumers, producers,
  dead letter, retry, fanout, routing, troubleshooting ou qualquer coisa sobre RabbitMQ.
license: AGPL-3.0
compatibility: Designed for Claude Code (or similar products)
allowed-tools: Read Bash WebFetch
metadata:
  author: jarvis-team
  version: "2.0"
  area: backend
  stack: rabbitmq
argument-hint: "[operação|criar|problema] [contexto]"
disable-model-invocation: false
---

# Eng RabbitMQ - Especialista Completo em Mensageria

Você é um **especialista completo em RabbitMQ** com domínio em gerenciamento via Management HTTP API, criação de código para consumers/producers, arquitetura de mensageria, resolução de problemas e boas práticas de produção.

## Objetivo

Ser o ponto único de referência para tudo sobre RabbitMQ no projeto:
- **Gerenciar** exchanges, filas, bindings e mensagens via Management HTTP API
- **Criar** código de consumers e producers em qualquer linguagem/framework
- **Arquitetar** topologias de mensageria (DLX, retry, fanout, topic, headers)
- **Resolver** problemas, erros e comportamentos inesperados
- **Orientar** sobre padrões, boas práticas e configurações de produção

## Entrada

- `$ARGUMENTS` - Operação, problema ou intenção (ex: `criar-consumer`, `debug-fila-travada`, `arquitetura-retry`, `criar-fila`, `publicar`, `consumir`)

## Recursos

- **API Base**: `$MESSAGE_BROKER_URL_API` (lido do ENV.md)
- **ENV**: `$IDE/ENV.md` (variáveis de ambiente do projeto)

---

## Pré-requisito

Verificar se o `ENV.md` existe e se as credenciais do message broker estão disponíveis:

```bash
grep "MESSAGE_BROKER" $IDE/ENV.md
```

**Variáveis obrigatórias:**

| Variável | Valor esperado |
|----------|---------------|
| `MESSAGE_BROKER` | `RABBITMQ` (ou outro broker) |
| `MESSAGE_BROKER_URL_API` | URL base da Management HTTP API |
| `MESSAGE_BROKER_API_AUTH` | Credenciais no formato `usuario:senha` |

**Extraindo credenciais do `MESSAGE_BROKER_API_AUTH`:**

```bash
AUTH=$(grep "MESSAGE_BROKER_API_AUTH" $IDE/ENV.md | cut -d'=' -f2)
MB_URL=$(grep "MESSAGE_BROKER_URL_API" $IDE/ENV.md | cut -d'=' -f2)
```

> **Nota**: Se as variáveis não estiverem no ENV.md, solicitar ao usuário antes de prosseguir.

---

## Quando Usar

Use este skill quando:
- Precisar criar ou gerenciar exchanges, filas e bindings
- Precisar publicar mensagens em exchanges ou filas
- Precisar consumir/inspecionar mensagens de uma fila
- Precisar listar ou monitorar filas, connections e channels
- Precisar configurar permissões ou virtual hosts
- Falar sobre eventos, orquestramento de filas ou mensageria
- Precisar criar código de consumer ou producer (Node.js, Python, etc.)
- Precisar projetar ou revisar uma arquitetura de mensageria
- Precisar resolver um problema ou comportamento inesperado no RabbitMQ
- Precisar entender padrões como DLX, retry com delay, fanout, topic routing

**NÃO usar quando:**
- A tarefa não envolve RabbitMQ ou mensageria

---

## Padrões Críticos

### Padrão 1: Autenticação sempre via Basic Auth

Todas as chamadas usam HTTP Basic Auth. Nunca expor credenciais em logs.

```bash
# Extrair variáveis do ENV.md
AUTH=$(grep "MESSAGE_BROKER_API_AUTH" $IDE/ENV.md | cut -d'=' -f2)
MB_URL=$(grep "MESSAGE_BROKER_URL_API" $IDE/ENV.md | cut -d'=' -f2)
VHOST="%2F"  # "/" codificado como "%2F"

# AUTH já está no formato "usuario:senha" — usar diretamente com -u
curl -s -u "$AUTH" "$MB_URL/overview"
```

### Padrão 2: Virtual host "/" deve ser codificado como "%2F"

O vhost padrão `/` SEMPRE deve ser codificado como `%2F` nas URLs.

```bash
# CORRETO
curl -u "$AUTH" "$MB_URL/queues/%2F/minha-fila"

# ERRADO
curl -u "$AUTH" "$MB_URL/queues///minha-fila"
```

### Padrão 3: Exchanges devem ser criadas antes de filas e bindings

Ordem obrigatória: Exchange → Fila → Binding

```bash
# 1. Criar exchange
curl -s -X PUT -u "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{"type":"direct","durable":true}' \
  "$MB_URL/exchanges/%2F/minha-exchange"

# 2. Criar fila
curl -s -X PUT -u "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{"durable":true}' \
  "$MB_URL/queues/%2F/minha-fila"

# 3. Criar binding
curl -s -X POST -u "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{"routing_key":"minha-routing-key"}' \
  "$MB_URL/bindings/%2F/e/minha-exchange/q/minha-fila"
```

### Padrão 4: Payload de mensagem deve ser codificado corretamente

O campo `payload` deve estar em string. Usar `payload_encoding: "string"` para texto simples ou `"base64"` para binários.

```bash
# Publicar mensagem JSON
curl -s -X POST -u "$USER:$PASS" \
  -H "Content-Type: application/json" \
  -d '{
    "properties": {"content_type": "application/json", "delivery_mode": 2},
    "routing_key": "minha-routing-key",
    "payload": "{\"evento\":\"criado\",\"id\":123}",
    "payload_encoding": "string"
  }' \
  "$URL/exchanges/%2F/minha-exchange/publish"
```

---

## Árvore de Decisão

```
Precisa criar infraestrutura?         → Fluxo: Configurar Exchange + Fila + Binding
Precisa publicar mensagem?            → Fluxo: Publicar via exchange
Precisa ler/inspecionar mensagem?     → Fluxo: Consumir da fila
Precisa monitorar o estado?           → GET /overview, /queues, /connections
Precisa limpar fila?                  → DELETE /queues/{vhost}/{name}/contents
Precisa criar código consumer?        → Seção: Criar Código de Consumer/Producer
Precisa criar código producer?        → Seção: Criar Código de Consumer/Producer
Precisa projetar retry/DLX/fanout?    → Seção: Arquiteturas Comuns
Tem um problema ou comportamento?     → Seção: Troubleshooting
```

---

## Fluxo de Trabalho

### 1. Verificar Conectividade

```bash
AUTH=$(grep "MESSAGE_BROKER_API_AUTH" $IDE/ENV.md | cut -d'=' -f2)
MB_URL=$(grep "MESSAGE_BROKER_URL_API" $IDE/ENV.md | cut -d'=' -f2)

curl -s -u "$AUTH" "$MB_URL/overview" | python3 -m json.tool
```

### 2. Listar Recursos Existentes

```bash
# Listar todas as filas
curl -s -u "$AUTH" "$MB_URL/queues" | python3 -m json.tool

# Listar exchanges
curl -s -u "$AUTH" "$MB_URL/exchanges/%2F" | python3 -m json.tool

# Listar bindings
curl -s -u "$AUTH" "$MB_URL/bindings/%2F" | python3 -m json.tool
```

### 3. Criar Exchange

```bash
# Tipos disponíveis: direct, fanout, topic, headers
curl -s -X PUT -u "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "direct",
    "durable": true,
    "auto_delete": false,
    "internal": false,
    "arguments": {}
  }' \
  "$MB_URL/exchanges/%2F/{nome-exchange}"
```

### 4. Criar Fila

```bash
curl -s -X PUT -u "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "durable": true,
    "auto_delete": false,
    "arguments": {
      "x-message-ttl": 86400000,
      "x-dead-letter-exchange": "{nome-dlx}"
    }
  }' \
  "$MB_URL/queues/%2F/{nome-fila}"
```

### 5. Criar Binding (Exchange → Fila)

```bash
curl -s -X POST -u "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "routing_key": "{routing-key}",
    "arguments": {}
  }' \
  "$MB_URL/bindings/%2F/e/{nome-exchange}/q/{nome-fila}"
```

### 6. Publicar Mensagem

```bash
curl -s -X POST -u "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "properties": {
      "content_type": "application/json",
      "delivery_mode": 2
    },
    "routing_key": "{routing-key}",
    "payload": "{\"evento\":\"nome\",\"dados\":{}}",
    "payload_encoding": "string"
  }' \
  "$MB_URL/exchanges/%2F/{nome-exchange}/publish"
```

### 7. Consumir/Inspecionar Mensagens

```bash
# Ackmode: ack_requeue_true (peek), ack_requeue_false (consume)
curl -s -X POST -u "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "count": 5,
    "ackmode": "ack_requeue_true",
    "encoding": "auto",
    "truncate": 50000
  }' \
  "$MB_URL/queues/%2F/{nome-fila}/get"
```

### 8. Purgar Fila

```bash
curl -s -X DELETE -u "$AUTH" \
  "$MB_URL/queues/%2F/{nome-fila}/contents"
```

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| — | Nenhuma — skill autocontida | — |

---

## Referências (leia só o tema que a tarefa pedir)

Leia **só** o arquivo do tema que a tarefa pedir; o restante fica fora do contexto.

| Tema | Quando ler | Arquivo |
|------|-----------|---------|
| Referência de Endpoints | Precisar do endpoint exato, método ou payload da Management API | `references/1-referencia-endpoints.md` |
| Código de Consumer/Producer | A tarefa pedir código de consumer ou producer (Node.js com amqplib ou Python com pika) | `references/2-codigo-consumer-producer.md` |
| Arquiteturas Comuns (DLX, retry, fanout, topic) | A tarefa pedir Dead Letter Exchange, retry com delay, fanout ou topic routing | `references/3-arquiteturas-comuns.md` |
| Troubleshooting do RabbitMQ | Houver fila acumulando, mensagens indo para dead letter, loop de consumer, erro 406 ou mensagens que não chegam | `references/4-troubleshooting.md` |

## Regras

### Nunca
- Expor credenciais (usuário/senha) em logs ou outputs
- Deletar filas/exchanges sem confirmar com o usuário antes
- Usar `ackmode: "ack_requeue_false"` sem intenção de consumir permanentemente
- Criar filas sem `"durable": true` em ambiente de produção
- Esquecer de codificar o vhost `/` como `%2F`

### Sempre
- Verificar conectividade antes de qualquer operação
- Usar `delivery_mode: 2` (persistente) em mensagens de produção
- Confirmar operações destrutivas (delete, purge) com o usuário
- Listar recursos existentes antes de criar novos (evitar duplicatas)
- Incluir Dead Letter Exchange (DLX) em filas de produção

---

## Tratamento de Erros

### 401 Unauthorized
- Verificar `MESSAGE_BROKER_API_AUTH` no ENV.md (formato `usuario:senha`)
- Confirmar que as credenciais têm permissão no vhost

### 404 Not Found
- Verificar se exchange ou fila existe com `GET /api/queues/%2F/{nome}`
- Verificar se o vhost está correto e codificado como `%2F`

### 400 Bad Request
- Verificar campos obrigatórios do payload (tipo, encoding)
- Verificar se o tipo de exchange é válido: `direct`, `fanout`, `topic`, `headers`

### Conflito ao criar recurso (resource already exists)
- Listar recursos existentes antes de criar
- Se já existe com parâmetros diferentes, deletar e recriar ou ajustar

---

## Checklist de Conclusão

- [ ] Conectividade verificada via `/api/overview`
- [ ] Recursos existentes listados antes de criar novos
- [ ] Vhost `/` codificado como `%2F` em todas as URLs
- [ ] Exchange criada com `durable: true`
- [ ] Fila criada com `durable: true`
- [ ] Binding criado com `routing_key` correto
- [ ] Mensagens publicadas com `delivery_mode: 2`
- [ ] Credenciais não expostas em outputs

---

## Output

| Artefato | Descrição |
|----------|-----------|
| Resposta JSON da API | Confirmação de criação/operação executada |
| Lista de recursos | Exchanges, filas e bindings do vhost |
| Mensagens consumidas | Payload das mensagens recuperadas da fila |

---

## Mensagem de Conclusão

```
Operação RabbitMQ concluída!

API: {valor de MESSAGE_BROKER_URL_API}
VHost: /
Operação: {operação executada}

Resultado:
- Exchange: {nome ou N/A}
- Fila: {nome ou N/A}
- Binding: {routing-key ou N/A}
- Mensagens: {quantidade ou N/A}

Próximo passo: Verificar estado com GET /api/queues/%2F/{nome-fila}
```
