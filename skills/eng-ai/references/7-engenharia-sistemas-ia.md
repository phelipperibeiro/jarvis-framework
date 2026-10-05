# 7. Engenharia de Sistemas de IA

**Nível:** FUNDAMENTAL · **Agnóstico de tecnologia:** ✅

**Objetivo:** Integrar modelos a sistemas confiáveis, observáveis e econômicos.

**Conhecimentos:** modelo como componente probabilístico; inferência em lote, online e em fluxo; latência, vazão e custo por requisição; caching, filas e processamento assíncrono; fallbacks, limites e degradação graciosa; humano no laço e revisão; versionamento de modelo, prompt e dados; observabilidade de qualidade e custo; testes de sistemas de ML; dívida técnica específica de ML.

**Princípios:**
- O modelo é a menor parte do sistema.
- Projete o caminho de falha antes do caminho feliz.
- Mudança de qualquer insumo (dado, prompt, modelo) é mudança de produto.

**Fora do escopo:** servidores de inferência e frameworks de implantação específicos.

**Pergunta-chave:** Se o modelo ficar indisponível ou responder mal, o que o usuário vê?

**Referências:**
- Sculley et al., *Hidden Technical Debt in Machine Learning Systems* (NIPS 2015)
- Breck et al., *The ML Test Score* (2017)
- Huyen, *Designing Machine Learning Systems*
- Zinkevich, *Rules of Machine Learning*

**Usam mais:** AI Eng, ML, Architecture, MLOps
