# 15. Testes de Carga e Chaos Engineering

**Nível:** IMPORTANTE · **Agnóstico de tecnologia:** ✅

**Objetivo:** Descobrir o ponto de ruptura e o modo de falha antes que a produção descubra por você.

**Conhecimentos:** testes de carga, estresse, pico e resistência (soak); planejamento de capacidade e ponto de ruptura; cenários realistas (dados e padrão de tráfego parecidos com produção); chaos engineering — injeção deliberada de falha (latência, erro, instância, zona); blast radius e critério de abortar; validar auto-scaling e failover sob carga real; portões de performance no pipeline (bloquear deploy por regressão).

**Princípios:**
- Nunca gerar carga ou injetar falha em produção sem aprovação, blast radius definido e plano de rollback.
- Testar o que o usuário realmente faz, não um cenário sintético confortável.
- O objetivo é aprender o modo de falha, não só confirmar que "funciona sob carga".

**Fora do escopo:** sintaxe de uma ferramenta específica (ex: k6, Gatling, Chaos Mesh, Gremlin).

**Pergunta-chave:** Se isso falhar exatamente como você está prestes a testar, qual é o raio de impacto e quem precisa saber?

**Referências:**
- Basiri et al., *Chaos Engineering* (Netflix, O'Reilly)
- Beyer et al., *Site Reliability Engineering*, cap. sobre gestão de capacidade
- Rosenthal & Jones, *Chaos Engineering: System Resiliency in Practice*

**Usam mais:** SRE, DevOps, Platform Engineering, Infrastructure/Platform Architecture
