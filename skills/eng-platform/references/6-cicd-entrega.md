# 6. CI/CD e Entrega de Software

**Nível:** FUNDAMENTAL · **Agnóstico de tecnologia:** ✅

**Objetivo:** Entregar mudanças pequenas, frequentes e seguras até a produção.

**Conhecimentos:** integração contínua e trunk-based development; pipeline como código; build reprodutível e artefatos versionados; rolling, blue/green, canary; feature flags: deploy ≠ release; rollback vs. roll-forward; testes na pipeline; promoção entre ambientes; migrações de banco compatíveis; métricas DORA (lead time, frequência, falha de mudança, tempo de restauração).

**Princípios:**
- Lotes pequenos reduzem risco e facilitam diagnóstico.
- O mesmo artefato percorre todos os ambientes.
- Pipeline lenta ou instável é incidente de produtividade.

**Fora do escopo:** sintaxe de um orquestrador de pipelines ou de uma plataforma de CI.

**Pergunta-chave:** Como reverter uma mudança que já migrou o esquema do banco?

**Referências:**
- Humble & Farley, *Continuous Delivery*
- Forsgren, Humble & Kim, *Accelerate*
- Kim et al., *The DevOps Handbook* (2ª ed.)
- DORA, *State of DevOps Report*

**Usam mais:** DevOps, DevSecOps, Platform, DevEx
