# 12. Tratamento de Erros e Logging

**Nível:** IMPORTANTE  
**Independência:** ✅ Válido em qualquer linguagem

## Objetivo
Tratar falhas de forma previsível e registrar o suficiente para diagnosticar problemas sem expor dados sensíveis.

## Conhecimentos Principais

### Tratamento de erros
- Exceções versus códigos de erro
- Falhar rápido (fail fast) versus degradação graciosa
- Propagação de erros entre as camadas
- Try/catch/finally
- Erros personalizados com contexto

### Logging
- Níveis de log (DEBUG, INFO, WARN, ERROR e FATAL)
- Logging estruturado
- Agregação de logs (em conceito)
- Quando registrar e o que registrar, sem dados sensíveis
- Retenção de logs

### Monitoramento
- Alertas
- Métricas (latência, taxa de erro e vazão)
- Verificações de saúde
- Observabilidade: logs, métricas e traces
- Rastreamento entre serviços com identificador de correlação

## O que NÃO Inclui
- Ferramentas específicas de logging e monitoramento
- Configuração de uma biblioteca de logs

## Por quê é Universal
Estratégias de erro e de observabilidade são independentes de tecnologia.

## Referências
- IEEE SWEBOK - Software Engineering Body of Knowledge
- ACM Computing Curricula 2023
- Martin Fowler - Circuit Breaker e padrões de resiliência
