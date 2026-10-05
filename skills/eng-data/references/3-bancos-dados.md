# 3. Bancos de Dados

**Nível:** FUNDAMENTAL · **Agnóstico de tecnologia:** ✅

**Objetivo:** Entender como sistemas de dados armazenam, consultam e garantem consistência.

**Conhecimentos:** modelo relacional e álgebra relacional; transações, ACID e níveis de isolamento; índices e estruturas de armazenamento (árvores, LSM); planos de consulta e otimização; replicação, particionamento e sharding; OLTP vs. OLAP; armazenamento em colunas; consistência, CAP e PACELC; bancos não relacionais e quando usá-los; backup, recuperação e migração.

**Princípios:**
- Consulta lenta é quase sempre problema de modelo, índice ou volume.
- Escolha o armazenamento pelo padrão de acesso, não por moda.
- Consistência é um espectro com custo.

**Fora do escopo:** dialetos SQL, parâmetros e recursos exclusivos de um produto.

**Pergunta-chave:** Por que esta consulta ficou lenta depois que a tabela cresceu?

**Referências:**
- Petrov, *Database Internals*
- Hellerstein et al., *Architecture of a Database System* (2007)
- Silberschatz et al., *Database System Concepts*
- Kleppmann, *Designing Data-Intensive Applications*

**Usam mais:** Database, Engineering, Platform, Architecture
