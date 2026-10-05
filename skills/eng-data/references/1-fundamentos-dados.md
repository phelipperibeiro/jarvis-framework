# 1. Fundamentos de Dados

**Nível:** FUNDAMENTAL · **Agnóstico de tecnologia:** ✅

**Objetivo:** Compreender o que é dado, como se representa e como muda ao longo do tempo.

**Conhecimentos:** dados estruturados, semiestruturados e não estruturados; dado, informação e conhecimento; granularidade (o que representa uma linha?); chaves e identidade de entidades; tempo: evento vs. processamento, fusos, mudança ao longo do tempo; formatos e codificação (texto vs. binário, orientado a linha vs. coluna); cardinalidade e valores ausentes; metadados; ciclo de vida: criação, uso, retenção, descarte.

**Princípios:**
- Defina a granularidade antes de qualquer agregação.
- Todo dado tem um tempo; ignorá-lo gera resultados enganosos.
- Valor nulo tem significado; trate-o de forma explícita.

**Fora do escopo:** sintaxe de linguagens de consulta e recursos de produtos específicos.

**Pergunta-chave:** O que exatamente representa uma linha desta tabela e em que momento ela foi verdadeira?

**Referências:**
- Kleppmann, *Designing Data-Intensive Applications*
- DAMA International, *DAMA-DMBOK2*
- Wickham, *Tidy Data* (J. Statistical Software, 2014)
- Reis & Housley, *Fundamentals of Data Engineering*

**Usam mais:** todas as funções de dados
