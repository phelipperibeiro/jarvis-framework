# 9. Testes de Performance

**Nível:** IMPORTANTE · **Agnóstico de tecnologia:** ✅

**Objetivo:** Medir se o sistema atende metas de desempenho sob carga realista.

**Conhecimentos:** latência, vazão, utilização e saturação; percentis em vez de média; modelos de carga aberto e fechado; testes de carga, estresse, pico, resistência (soak), escalabilidade e capacidade; perfil de uso e dados representativos; metas (SLO) e critérios de aceitação; Lei de Little e teoria de filas; omissão coordenada na medição; identificação de gargalos e profiling; ambientes comparáveis à produção; execução na pipeline e análise de resultados.

**Princípios:**
- Meça percentis: a média esconde a cauda.
- Sem meta numérica não há teste de performance.
- Teste em ambiente diferente da produção prova pouco.

**Fora do escopo:** ferramentas de geração de carga e de monitoramento específicas.

**Pergunta-chave:** Com a carga dobrada, o que degrada primeiro: latência, erros ou capacidade?

**Referências:**
- Molyneaux, *The Art of Application Performance Testing* (2ª ed.)
- Jain, *The Art of Computer Systems Performance Analysis*
- Gregg, *Systems Performance* (2ª ed.)
- Little, *A Proof for the Queuing Formula L = λW* (1961)

**Usam mais:** Performance, Reliability, Quality Engineering, Mobile
