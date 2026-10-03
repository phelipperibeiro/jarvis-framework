# 5. Banco de Dados e Persistência

**Nível:** FUNDAMENTAL  
**Independência:** ✅ Os conceitos valem para bancos relacionais e não relacionais

## Objetivo
Modelar, consultar e evoluir dados com consistência e bom desempenho.

## Conhecimentos Principais

### Conceitos relacionais
- Modelo relacional: tabelas, colunas e linhas
- Chaves primárias e estrangeiras
- Índices
- Normalização (1FN, 2FN, 3FN) e desnormalização, e quando usar cada uma
- Junções (INNER, LEFT, RIGHT e FULL)

### ACID e transações
- **A**tomicidade: tudo ou nada
- **C**onsistência: o estado é sempre válido
- **I**solamento: transações não interferem entre si
- **D**urabilidade: o que foi confirmado persiste
- Níveis de isolamento (Read Uncommitted, Read Committed, Repeatable Read, Serializable)
- Condições de corrida e deadlocks em transações

### Consultas e desempenho
- Seleção, agregações e agrupamentos
- Subconsultas
- Planos de consulta (EXPLAIN)
- Tipos de índice (árvore B, hash) e quando criar índices

### Conceitos não relacionais (quando relevante)
- Armazenamento de documentos e de chave-valor
- Teorema CAP (consistência, disponibilidade e tolerância a partições)
- Consistência eventual
- Quando usar relacional ou não relacional

### Migrações e versionamento
- Migrações de esquema e de dados
- Compatibilidade retroativa

## O que NÃO Inclui
- Dialetos de SQL específicos
- Configuração e ajuste de um banco específico
- Recursos exclusivos de um produto de banco de dados

## Por quê é Universal
Os conceitos de dados e de transações valem para qualquer banco, relacional ou não.

## Referências
- IEEE SWEBOK - Software Engineering Body of Knowledge
- ACM Computing Curricula 2023
- Martin Fowler - NoSQL Distilled
