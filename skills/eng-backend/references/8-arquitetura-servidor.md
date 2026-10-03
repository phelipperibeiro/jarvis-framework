# 8. Arquitetura de Servidor

**Nível:** IMPORTANTE  
**Independência:** ✅ Válido em qualquer linguagem

## Objetivo
Estruturar o servidor para atender muitas requisições com escalabilidade e resiliência, sem depender de uma tecnologia específica.

## Conhecimentos Principais

### Padrões de servidor
- Modelo requisição-resposta
- Pipeline de tratamento de requisições
- Padrão middleware
- Pool de conexões e pool de threads

### Escalabilidade
- Escala vertical versus horizontal
- Balanceamento de carga (round robin, menos conexões e similares)
- Arquitetura sem estado (stateless) versus com estado
- Gerenciamento de sessão
- Camadas de cache

### Resiliência
- Timeouts
- Retentativas com backoff exponencial
- Circuit breaker
- Bulkhead
- Verificações de saúde (health checks)

### Sistemas distribuídos
- Teorema CAP
- Consistência eventual
- Algoritmos de consenso (em conceito)
- Transações distribuídas
- Idempotência em sistemas distribuídos

## O que NÃO Inclui
- Configuração específica de um servidor web ou proxy
- Infraestrutura de implantação (contêineres e orquestração)

## Por quê é Universal
Os padrões de arquitetura de servidor valem com qualquer tecnologia de implementação.

## Referências
- IEEE SWEBOK - Software Engineering Body of Knowledge
- ACM Computing Curricula 2023
- Martin Fowler - Patterns of Enterprise Application Architecture
- Designing Data-Intensive Applications (conceitos)
