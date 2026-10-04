# Troubleshooting do RabbitMQ

> Parte do skill `eng-backend-rabbitmq`. Leia este arquivo quando houver fila acumulando, mensagens indo para dead letter, loop de consumer, erro 406 ou mensagens que não chegam.

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
