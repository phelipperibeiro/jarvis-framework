# Código de Consumer/Producer

> Parte do skill `eng-backend-rabbitmq`. Leia este arquivo quando a tarefa pedir código de consumer ou producer (Node.js com amqplib ou Python com pika).

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
