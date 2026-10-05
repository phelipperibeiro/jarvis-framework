# 16. Cache Multi-Camada

**Nível:** IMPORTANTE · **Agnóstico de tecnologia:** ✅

**Objetivo:** Decidir onde, o quê e por quanto tempo cachear — e como invalidar sem servir dado velho como se fosse novo.

**Conhecimentos:** camadas de cache (aplicação/in-memory, distribuído, banco de dados, CDN/edge, browser/cliente); trade-off de consistência vs. latência; estratégias de invalidação (TTL, write-through, write-behind, invalidação por evento); cache stampede e thundering herd; chave de cache e cardinalidade; cache de resultado de query vs. cache de objeto computado; medir hit rate antes de adicionar mais uma camada.

**Princípios:**
- Cache sem estratégia de invalidação é bug de dado velho esperando para acontecer.
- Cada camada adicionada é mais um lugar onde o dado pode discordar da fonte — adicione só com ganho medido.
- Dado sensível em cache segue a mesma política de acesso e expiração do dado original.

**Fora do escopo:** sintaxe ou configuração de um produto específico (ex: Redis, Memcached, CloudFront).

**Pergunta-chave:** Se este dado em cache estiver errado por 5 minutos, alguém percebe — e o que isso custa?

**Referências:**
- Kleppmann, *Designing Data-Intensive Applications*, cap. sobre caching e consistência
- Documentação de padrões de cache da AWS/Cloudflare (cache-aside, write-through, write-behind)

**Usam mais:** Platform Engineering, DevOps, Cloud Engineering, Infrastructure/Platform Architecture
