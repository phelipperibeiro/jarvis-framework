# 14. Profiling e Diagnóstico de Performance

**Nível:** IMPORTANTE · **Agnóstico de tecnologia:** ✅

**Objetivo:** Encontrar onde o tempo e o recurso realmente vão, em vez de supor.

**Conhecimentos:** profiling de CPU (amostragem vs. instrumentação, flame graphs, hotspots); profiling de memória (heap, alocação, vazamento, tuning de garbage collection); profiling de I/O (disco, rede, latência de query); profiling por ambiente (processo local, container, função serverless); correlação entre profile e trace distribuído; medir antes de otimizar; performance budget e detecção de regressão.

**Princípios:**
- Não otimiza o que não mediu; não promete o que não validou contra baseline.
- O maior gargalo primeiro: otimização sem priorização por impacto é desperdício.
- Profile em condição parecida com produção — ambiente sintético mente.

**Fora do escopo:** sintaxe de um profiler específico (ex: pprof, async-profiler, clinic.js).

**Pergunta-chave:** Qual é o maior gargalo agora, e quanto essa otimização vale antes de implementá-la?

**Referências:**
- Gregg, *Systems Performance* (2ª ed.)
- Gregg, método USE
- Beyer et al., *Site Reliability Engineering*, cap. 6

**Usam mais:** SRE, DevOps, Platform Engineering, Systems Engineering
