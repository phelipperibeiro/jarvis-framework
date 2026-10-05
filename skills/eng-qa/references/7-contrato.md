# 7. Testes de Contrato

**Nível:** IMPORTANTE · **Agnóstico de tecnologia:** ✅

**Objetivo:** Garantir compatibilidade entre produtores e consumidores sem depender de testes ponta a ponta frágeis.

**Conhecimentos:** contratos dirigidos pelo consumidor; verificação pelo provedor; esquemas e especificações de interface; compatibilidade retroativa e progressiva; versionamento e evolução; mudanças que quebram; contratos para eventos e mensagens; governança de contratos entre times; relação com testes de integração e E2E; publicação e verificação na pipeline; princípio da robustez (Postel).

**Princípios:**
- O contrato é o que o consumidor realmente usa, não tudo que o provedor expõe.
- Quebra de contrato deve falhar antes do deploy.
- Contrato reduz E2E caro; não substitui a conversa entre times.

**Fora do escopo:** ferramentas e formatos de arquivos de contrato específicos.

**Pergunta-chave:** Se o provedor remover um campo hoje, como ele descobre quem quebra?

**Referências:**
- Robinson, *Consumer-Driven Contracts: A Service Evolution Pattern* (2006)
- Newman, *Building Microservices*
- Fowler, *Integration Contract Test* (2011)
- Especificações OpenAPI e AsyncAPI

**Usam mais:** Contract, API, Integration, QA Architecture
