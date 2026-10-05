# 5. LLMs, Chatbots, Agentes e RAG

**Nível:** IMPORTANTE · **Agnóstico de tecnologia:** ✅

**Objetivo:** Construir aplicações confiáveis sobre modelos de linguagem, sem depender de um modelo específico.

**Conhecimentos:** LLMs: instruções, exemplos, contexto e janela de contexto; saída estruturada; chatbots: design conversacional, turnos, memória de conversa, escalonamento para humano, avaliação de diálogo; agentes: laços de decisão, uso de ferramentas, memória e planejamento; fluxos fixos vs. agentes autônomos; RAG: preparação e divisão de documentos (chunking), embeddings, busca vetorial e híbrida, reordenação, ancoragem em fontes; avaliação separada de recuperação e de geração; alucinação e verificação; custo e latência por token.

**Princípios:**
- Comece pelo fluxo mais simples que resolve o problema.
- Autonomia só onde o erro é barato ou há verificação.
- Em RAG, resposta ruim costuma ser recuperação ruim: avalie as duas etapas.

**Fora do escopo:** SDKs, nomes de modelos, bancos vetoriais e frameworks de orquestração.

**Pergunta-chave:** Esta tarefa pede um agente, um chatbot com memória ou um fluxo fixo com uma chamada?

**Referências:**
- Anthropic, *Building effective agents* (2024)
- Lewis et al., *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks* (2020)
- Yao et al., *ReAct* (2022)
- Jurafsky & Martin, *Speech and Language Processing* (cap. sobre diálogo)
- Huyen, *AI Engineering* (2025)

**Usam mais:** AI Eng, Architecture, Product, Platform
