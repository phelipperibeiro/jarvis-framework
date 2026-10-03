# 6. API e Comunicação entre Sistemas

**Nível:** FUNDAMENTAL  
**Independência:** ✅ Válido em qualquer linguagem

## Objetivo
Projetar APIs claras, seguras e evolutivas para que sistemas se comuniquem de forma confiável.

## Conhecimentos Principais

### REST e HTTP
- Princípios REST (Representational State Transfer)
- Métodos HTTP: GET, POST, PUT, PATCH, DELETE, HEAD e OPTIONS
- Códigos de status (1xx a 5xx)
- Cabeçalhos HTTP importantes
- Ausência de estado (statelessness)
- Design orientado a recursos
- HATEOAS e hipermídia

### Conceitos de API
- Versionamento de API e versionamento semântico
- Autenticação (OAuth, JWT, Basic) e autorização (RBAC e ABAC)
- Limitação de taxa (rate limiting e throttling)
- Paginação, filtros e parâmetros de consulta
- Idempotência: repetir a chamada não repete o efeito
- Documentação de API por uma especificação padronizada

### Protocolo HTTP/HTTPS
- HTTPS e TLS
- Diferenças entre HTTP/1.1, HTTP/2 e HTTP/3
- Keep-alive e compressão

## O que NÃO Inclui
- Implementação em um framework web específico
- Protocolos alternativos muito especializados

## Por quê é Universal
APIs são a forma padrão de os sistemas conversarem, e os princípios independem de quem as implementa.

## Referências
- Roy Fielding - Architectural Styles and the Design of Network-based Software Architectures (REST)
- Especificações do protocolo HTTP (RFCs)
