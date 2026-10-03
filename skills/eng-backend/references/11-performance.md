# 11. Performance e Otimização

**Nível:** IMPORTANTE  
**Independência:** ✅ Válido em qualquer linguagem

## Objetivo
Encontrar gargalos com medição e otimizar onde importa, sem sacrificar a clareza.

## Conhecimentos Principais

### Identificar gargalos
- Profiling de CPU, memória e E/S
- Benchmarking
- Testes de carga
- Latência versus vazão (throughput)
- Lei de Amdahl

### Otimizações comuns
- Caching em memória e distribuído
- Otimização de consultas ao banco
- Pool de conexões
- Processamento em lote
- Carregamento sob demanda (lazy loading)
- Paginação

### Caching
- Cache em memória
- Caches distribuídos
- Estratégias de invalidação
- Coerência de cache
- TTL e expiração

### Escalabilidade
- Escala horizontal versus vertical
- Sharding de banco de dados
- Réplicas de leitura
- Processamento assíncrono

## O que NÃO Inclui
- Otimizações específicas de uma linguagem
- Ajuste fino de um servidor ou produto específico

## Por quê é Universal
Os princípios de desempenho (medir primeiro, otimizar o gargalo) valem em qualquer linguagem.

## Referências
- IEEE SWEBOK - Software Engineering Body of Knowledge
- ACM Computing Curricula 2023
- Donald Knuth - otimização prematura
