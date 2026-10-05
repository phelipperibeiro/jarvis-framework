# 2. Modelagem de Dados

**Nível:** FUNDAMENTAL · **Agnóstico de tecnologia:** ✅

**Objetivo:** Representar o negócio em estruturas de dados que respondam às perguntas certas.

**Conhecimentos:** níveis conceitual, lógico e físico; entidades, relacionamentos e restrições; normalização (1FN–3FN) e desnormalização consciente; modelagem dimensional (fatos, dimensões, granularidade); dimensões que mudam lentamente; Data Vault (hubs, links, satélites); modelos orientados a documento, grafo e chave-valor; contratos de esquema e evolução; dicionário e glossário de negócio.

**Princípios:**
- Modele a partir do processo de negócio, não da tabela de origem.
- Normalize para escrever, dimensionalize para analisar.
- Esquema é contrato; mudanças precisam de compatibilidade.

**Fora do escopo:** DDL e recursos físicos de um produto de banco específico.

**Pergunta-chave:** Como histórico e correções de um cadastro devem aparecer no modelo analítico?

**Referências:**
- Kimball & Ross, *The Data Warehouse Toolkit* (3ª ed.)
- Inmon, *Building the Data Warehouse*
- Linstedt & Olschimke, *Building a Scalable Data Warehouse with Data Vault 2.0*
- Codd, *A Relational Model of Data for Large Shared Data Banks* (1970)

**Usam mais:** Modeling, Engineering, Architecture, BI
