# 6. Webhooks e Integração entre Sistemas

**Nível:** IMPORTANTE · **Agnóstico de tecnologia:** ✅

**Objetivo:** Integrar sistemas por eventos e notificações de forma segura e tolerante a falhas.

**Conhecimentos:** push (webhook) vs. polling; receptor: resposta rápida e processamento assíncrono; autenticidade: assinatura (HMAC), timestamp, proteção contra replay; entrega ao menos uma vez, duplicidade e idempotência; ordem não garantida; reentrega e filas de mensagens mortas; padrões de integração: mensagens, canais, roteadores, tradutores; contrato e esquema do evento; transformação e mapeamento entre sistemas; ponto a ponto vs. barramento ou orquestração; simulação de eventos em testes; reconciliação periódica contra perdas.

**Princípios:**
- Responda rápido, processe depois.
- Webhook é um aviso de que algo mudou; reconcilie consultando a fonte.
- Todo receptor deve ser idempotente.

**Fora do escopo:** plataformas de integração e barramentos específicos.

**Pergunta-chave:** O mesmo evento chega duas vezes e fora de ordem: seu receptor produz o estado correto?

**Referências:**
- Hohpe & Woolf, *Enterprise Integration Patterns*
- Kleppmann, *Designing Data-Intensive Applications*
- CNCF, *CloudEvents Specification*
- RFC 2104 (HMAC)
- Newman, *Building Microservices* (2ª ed.)

**Usam mais:** API Automation, Data Ingestion, Automation Engineering
