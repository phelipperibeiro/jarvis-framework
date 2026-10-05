# 10. Ingestão de Dados

**Nível:** FUNDAMENTAL · **Agnóstico de tecnologia:** ✅

**Objetivo:** Trazer dados ao destino com a latência, a garantia e o custo adequados ao uso.

**Conhecimentos:** lote, quase tempo real, fluxo contínuo e baseado em eventos; latência vs. vazão vs. custo; carga completa vs. incremental; marcas d'água e captura de mudanças (CDC); semântica de entrega: no máximo uma, ao menos uma, efeito exatamente uma vez; idempotência e deduplicação; ordem, janelas e dados tardios; contrapressão e buffers; filas, logs e reprocessamento; evolução de esquema; falhas parciais e filas de mensagens mortas; reconciliação com a fonte.

**Princípios:**
- Escolha a latência que o negócio precisa, não a menor possível.
- Projete para reprocessar.
- 'Exatamente uma vez' é efeito de idempotência, não mágica.

**Fora do escopo:** motores de processamento e brokers específicos.

**Pergunta-chave:** Se a ingestão falhar às 3h e reiniciar às 5h, o destino fica correto, incompleto ou duplicado?

**Referências:**
- Akidau et al., *The Dataflow Model* (VLDB, 2015)
- Akidau, Chernyak & Lax, *Streaming Systems*
- Kleppmann, *Designing Data-Intensive Applications*
- Kreps, *The Log: What every software engineer should know about real-time data's unifying abstraction* (2013)
- Reis & Housley, *Fundamentals of Data Engineering*

**Usam mais:** Data Ingestion, Data Acquisition, Automation Engineering
