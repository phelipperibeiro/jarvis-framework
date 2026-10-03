# 7. Concorrência e Assincronismo

**Nível:** IMPORTANTE  
**Independência:** ✅ Válido em qualquer linguagem

## Objetivo
Lidar com várias tarefas ao mesmo tempo sem corromper estado nem travar o sistema.

## Conhecimentos Principais

### Conceitos fundamentais
- Concorrência versus paralelismo
- Threads versus processos
- Troca de contexto
- Segurança entre threads (thread safety)
- Estado mutável compartilhado como a principal fonte de problemas

### Problemas de concorrência
- Condições de corrida e data races
- Deadlocks e livelocks
- Starvation
- Problemas de visibilidade de memória

### Soluções
- Mutexes e locks
- Semáforos
- Operações atômicas
- Imutabilidade
- Troca de mensagens
- Modelo de atores (em conceito)

### Assincronismo
- Callbacks
- Promessas e futuros
- Async/await como padrão, não como sintaxe
- Programação reativa (em conceito)
- E/S não bloqueante

## O que NÃO Inclui
- Sintaxe de concorrência de uma linguagem específica
- Bibliotecas de threads específicas

## Por quê é Universal
Concorrência é um desafio de qualquer backend, e os problemas e soluções são os mesmos em todas as linguagens.

## Referências
- IEEE SWEBOK - Software Engineering Body of Knowledge
- ACM Computing Curricula 2023
- Literatura clássica sobre concorrência (conceitos aplicáveis a qualquer linguagem)
