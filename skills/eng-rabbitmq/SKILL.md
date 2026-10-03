---
name: eng-rabbitmq
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

---

## Referência de Endpoints

| Operação | Método | Endpoint |
|----------|--------|----------|
| Status geral | GET | `/api/overview` |
| Listar filas | GET | `/api/queues` |
| Detalhes de fila | GET | `/api/queues/{vhost}/{name}` |
| Criar fila | PUT | `/api/queues/{vhost}/{name}` |
| Deletar fila | DELETE | `/api/queues/{vhost}/{name}` |
| Purgar fila | DELETE | `/api/queues/{vhost}/{name}/contents` |
| Consumir mensagens | POST | `/api/queues/{vhost}/{name}/get` |
| Listar exchanges | GET | `/api/exchanges/{vhost}` |
| Criar exchange | PUT | `/api/exchanges/{vhost}/{name}` |
| Deletar exchange | DELETE | `/api/exchanges/{vhost}/{name}` |
| Publicar mensagem | POST | `/api/exchanges/{vhost}/{name}/publish` |
| Listar bindings | GET | `/api/bindings/{vhost}` |
| Criar binding (fila) | POST | `/api/bindings/{vhost}/e/{exchange}/q/{queue}` |
| Deletar binding | DELETE | `/api/bindings/{vhost}/e/{exchange}/q/{queue}/{props}` |
| Listar connections | GET | `/api/connections` |
| Fechar connection | DELETE | `/api/connections/{name}` |
| Listar channels | GET | `/api/channels` |
| Listar vhosts | GET | `/api/vhosts` |

---

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

## Criar Código de Consumer/Producer

Quando o usuário pedir para criar código, gerar implementação completa e funcional. Verificar a linguagem/framework do projeto antes de escolher a biblioteca.

### Node.js com amqplib

```javascript
// consumer.js
const amqp = require('amqplib');

async function startConsumer() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await conn.createChannel();

  const queue = 'nome-da-fila';
  await channel.assertQueue(queue, { durable: true });
  channel.prefetch(1); // processa 1 mensagem por vez

  console.log(`Aguardando mensagens em ${queue}`);

  channel.consume(queue, async (msg) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString());
      console.log('Mensagem recebida:', payload);

      // processar aqui...

      channel.ack(msg); // confirmar processamento
    } catch (err) {
      console.error('Erro ao processar:', err);
      channel.nack(msg, false, false); // rejeitar sem requeue → vai para DLX
    }
  });
}

startConsumer().catch(console.error);
```

```javascript
// producer.js
const amqp = require('amqplib');

async function publish(exchange, routingKey, payload) {
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await conn.createChannel();

  channel.publish(
    exchange,
    routingKey,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true, contentType: 'application/json' }
  );

  await channel.close();
  await conn.close();
}
```

### Python com pika

```python
# consumer.py
import pika, json, os

def on_message(channel, method, properties, body):
    try:
        payload = json.loads(body)
        print(f"Mensagem recebida: {payload}")
        # processar aqui...
        channel.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as e:
        print(f"Erro: {e}")
        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

params = pika.URLParameters(os.environ['RABBITMQ_URL'])
conn = pika.BlockingConnection(params)
ch = conn.channel()
ch.basic_qos(prefetch_count=1)
ch.basic_consume('nome-da-fila', on_message)
ch.start_consuming()
```

> Sempre ler o projeto para detectar a linguagem e adaptar o código antes de gerar.

---

## Arquiteturas Comuns

### Dead Letter Exchange (DLX) — Fila com rejeição controlada

```
Fila principal → (nack/expired) → DLX Exchange → Fila de Dead Letters
```

```bash
# 1. Criar DLX exchange
curl -s -X PUT -u "$AUTH" -H "Content-Type: application/json" \
  -d '{"type":"direct","durable":true}' \
  "$MB_URL/exchanges/%2F/dlx.minha-fila"

# 2. Criar fila de dead letters
curl -s -X PUT -u "$AUTH" -H "Content-Type: application/json" \
  -d '{"durable":true}' \
  "$MB_URL/queues/%2F/minha-fila.dead"

# 3. Criar binding DLX → fila dead
curl -s -X POST -u "$AUTH" -H "Content-Type: application/json" \
  -d '{"routing_key":"minha-fila"}' \
  "$MB_URL/bindings/%2F/e/dlx.minha-fila/q/minha-fila.dead"

# 4. Criar fila principal apontando para DLX
curl -s -X PUT -u "$AUTH" -H "Content-Type: application/json" \
  -d '{
    "durable": true,
    "arguments": {
      "x-dead-letter-exchange": "dlx.minha-fila",
      "x-dead-letter-routing-key": "minha-fila",
      "x-message-ttl": 86400000
    }
  }' \
  "$MB_URL/queues/%2F/minha-fila"
```

### Retry com Delay (usando TTL + DLX como fila de espera)

```
Fila principal → (nack) → DLX Exchange → Fila retry (TTL 30s) → republica → Fila principal
```

```bash
# Fila de retry com TTL de 30 segundos e DLX apontando de volta para a fila principal
curl -s -X PUT -u "$AUTH" -H "Content-Type: application/json" \
  -d '{
    "durable": true,
    "arguments": {
      "x-message-ttl": 30000,
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": "minha-fila"
    }
  }' \
  "$MB_URL/queues/%2F/minha-fila.retry"
```

### Fanout — Broadcast para múltiplas filas

```
Exchange fanout → Fila A
               → Fila B
               → Fila C
```

```bash
# Exchange fanout (routing_key é ignorada)
curl -s -X PUT -u "$AUTH" -H "Content-Type: application/json" \
  -d '{"type":"fanout","durable":true}' \
  "$MB_URL/exchanges/%2F/events.broadcast"

# Cada fila se liga sem routing_key
curl -s -X POST -u "$AUTH" -H "Content-Type: application/json" \
  -d '{"routing_key":""}' \
  "$MB_URL/bindings/%2F/e/events.broadcast/q/servico-a"
```

### Topic Routing — Roteamento por padrão

```
Exchange topic → "pedido.criado"    → fila pedidos
              → "pedido.*"         → fila auditoria
              → "*.erro"           → fila alertas
```

```bash
curl -s -X PUT -u "$AUTH" -H "Content-Type: application/json" \
  -d '{"type":"topic","durable":true}' \
  "$MB_URL/exchanges/%2F/events.topic"

# Binding com wildcard
curl -s -X POST -u "$AUTH" -H "Content-Type: application/json" \
  -d '{"routing_key":"pedido.*"}' \
  "$MB_URL/bindings/%2F/e/events.topic/q/fila-auditoria"
```

---

## Troubleshooting

### Diagnóstico inicial — sempre começar aqui

```bash
AUTH=$(grep "MESSAGE_BROKER_API_AUTH" $IDE/ENV.md | cut -d'=' -f2)
MB_URL=$(grep "MESSAGE_BROKER_URL_API" $IDE/ENV.md | cut -d'=' -f2)

# Visão geral do cluster
curl -s -u "$AUTH" "$MB_URL/overview" | python3 -m json.tool

# Filas com problemas (messages_ready > 0 e consumers = 0)
curl -s -u "$AUTH" "$MB_URL/queues" | python3 -c "
import json,sys
qs = json.load(sys.stdin)
for q in qs:
    ready = q.get('messages_ready', 0)
    consumers = q.get('consumers', 0)
    if ready > 0 and consumers == 0:
        print(f\"ALERTA: {q['name']} | mensagens={ready} | consumers=0\")
"
```

### Problema: Fila acumulando mensagens (consumer parado)

1. Verificar se há consumers ativos na fila:
```bash
curl -s -u "$AUTH" "$MB_URL/queues/%2F/nome-da-fila" | python3 -m json.tool | grep -E "consumers|messages"
```
2. Verificar connections abertas:
```bash
curl -s -u "$AUTH" "$MB_URL/connections" | python3 -m json.tool
```
3. Checar se o consumer está com unacked alto (travado no processamento):
```bash
curl -s -u "$AUTH" "$MB_URL/queues/%2F/nome-da-fila" | python3 -c "
import json,sys; q=json.load(sys.stdin)
print('messages_ready:', q.get('messages_ready'))
print('messages_unacknowledged:', q.get('messages_unacknowledged'))
print('consumers:', q.get('consumers'))
"
```

### Problema: Mensagens indo para Dead Letter inesperadamente

Causas comuns:
- `x-message-ttl` expirando antes do consumer processar → aumentar TTL ou aumentar prefetch
- Consumer fazendo `nack` com `requeue=false` por erro no código → checar logs do consumer
- Fila com `x-max-length` atingido → verificar se fila está lotada

```bash
# Ver argumentos da fila (TTL, DLX, max-length)
curl -s -u "$AUTH" "$MB_URL/queues/%2F/nome-da-fila" | python3 -c "
import json,sys; q=json.load(sys.stdin)
print(json.dumps(q.get('arguments', {}), indent=2))
"
```

### Problema: Consumer recebe mensagem mas não processa (loop infinito)

Sintoma: `messages_unacknowledged` cresce, `messages_ready` não zera.

Solução: Verificar prefetch — consumer pode estar segurando todas as mensagens:
```bash
# Ver detalhes dos channels (prefetch_count)
curl -s -u "$AUTH" "$MB_URL/channels" | python3 -m json.tool
```

### Problema: 406 PRECONDITION_FAILED ao criar fila/exchange

A fila/exchange já existe com parâmetros diferentes. Verificar parâmetros atuais:
```bash
curl -s -u "$AUTH" "$MB_URL/queues/%2F/nome-da-fila" | python3 -m json.tool
```
Se precisar mudar: deletar e recriar (confirmar com o usuário antes).

### Problema: Mensagens publicadas mas não chegam na fila

Verificar se o binding existe com a routing_key correta:
```bash
curl -s -u "$AUTH" "$MB_URL/bindings/%2F" | python3 -c "
import json,sys
for b in json.load(sys.stdin):
    if b.get('source') == 'nome-exchange':
        print(b)
"
```

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
