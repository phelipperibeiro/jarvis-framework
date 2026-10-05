# 5. Pipelines e Integração de Dados

**Nível:** FUNDAMENTAL · **Agnóstico de tecnologia:** ✅

**Objetivo:** Mover e transformar dados de forma confiável, repetível e observável.

**Conhecimentos:** ETL vs. ELT; batch vs. streaming; captura de mudanças (CDC); idempotência e reprocessamento; carga incremental e backfill; orquestração e dependências; semântica de entrega (pelo menos uma vez, exatamente uma vez); janelas, atraso e dados tardios; tratamento de falhas e dead-letter; testes de transformação.

**Princípios:**
- Todo pipeline deve poder rodar duas vezes sem efeito colateral.
- Projete para dado tardio e para reprocessar o passado.
- Falha silenciosa é pior que falha ruidosa.

**Fora do escopo:** operadores, conectores e sintaxe de uma ferramenta de orquestração ou processamento.

**Pergunta-chave:** O que acontece com o resultado se o job do dia rodar duas vezes ou falhar pela metade?

**Referências:**
- Reis & Housley, *Fundamentals of Data Engineering*
- Akidau et al., *The Dataflow Model* (VLDB 2015)
- Akidau, Chernyak & Lax, *Streaming Systems*
- Kleppmann, *Designing Data-Intensive Applications*

**Usam mais:** Engineering, Platform, DataOps, Quality
