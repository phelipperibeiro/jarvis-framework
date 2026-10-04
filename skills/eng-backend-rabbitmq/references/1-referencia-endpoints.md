# Referência de Endpoints

> Parte do skill `eng-backend-rabbitmq`. Leia este arquivo quando precisar do endpoint exato, método ou payload da Management API.

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
