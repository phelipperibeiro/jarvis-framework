# 10. Testes de Confiabilidade e Resiliência

**Nível:** IMPORTANTE · **Agnóstico de tecnologia:** ✅

**Objetivo:** Verificar que o sistema se comporta bem sob falha, degradação e recuperação.

**Conhecimentos:** disponibilidade, tolerância a falhas e recuperabilidade; injeção de falhas e engenharia do caos; failover e recuperação de desastres (RTO/RPO); timeouts, retries e circuit breakers; resiliência a falhas de dependências; degradação graciosa; estabilidade sob uso prolongado (vazamentos); testes de backup e restauração; game days; hipótese de estado estável; testes em produção com salvaguardas; SLO e orçamento de erro.

**Princípios:**
- Formule a hipótese de estado estável antes de injetar falha.
- Comece pequeno, com raio de impacto limitado.
- Recuperação não testada é suposição.

**Fora do escopo:** plataformas e ferramentas de injeção de falhas específicas.

**Pergunta-chave:** Qual a falha mais provável da sua dependência crítica e o que o usuário vê quando ela ocorre?

**Referências:**
- Basiri et al., *Chaos Engineering* (IEEE Software, 2016)
- Rosenthal & Jones, *Chaos Engineering*
- Nygard, *Release It!*
- Beyer et al., *Site Reliability Engineering*
- ISO/IEC 25010 (confiabilidade)

**Usam mais:** Reliability, Performance, Quality Engineering, QA Architecture
