# Arquiteturas Comuns (DLX, retry, fanout, topic)

> Parte do skill `eng-backend-rabbitmq`. Leia este arquivo quando a tarefa pedir Dead Letter Exchange, retry com delay, fanout ou topic routing.

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
