# 5. Automação de APIs: REST, GraphQL e SOAP

**Nível:** FUNDAMENTAL · **Agnóstico de tecnologia:** ✅

**Objetivo:** Consumir APIs de qualquer estilo com correção, resiliência e baixo acoplamento.

**Conhecimentos:** REST: recursos, métodos, status, idempotência, cache, hipermídia; GraphQL: esquema, consultas, mutações, limites de complexidade, N+1; SOAP: envelope, WSDL, XML e segurança de mensagens (conceito); paginação por deslocamento e por cursor; filtros e ordenação; versionamento e evolução; especificações de contrato (OpenAPI, esquema GraphQL, WSDL); formatos padronizados de erro; polling vs. notificação; tolerância a campos novos; limites e cotas do provedor; testes contra o contrato.

**Princípios:**
- Leia o contrato; não infira comportamento a partir de exemplos.
- Seja tolerante no que recebe e rigoroso no que envia.
- Idempotência decide se uma chamada pode ser repetida.

**Fora do escopo:** SDKs e clientes de API específicos.

**Pergunta-chave:** Se a chamada for repetida por falha de rede, o efeito acontece uma ou duas vezes?

**Referências:**
- Fielding, *Architectural Styles and the Design of Network-based Software Architectures* (2000)
- RFC 9110 (HTTP Semantics)
- GraphQL Foundation, *GraphQL Specification*
- W3C, *SOAP 1.2* e *WSDL 2.0*
- RFC 9457 (Problem Details for HTTP APIs)
- OpenAPI Specification

**Usam mais:** API Automation, Data Acquisition, Data Ingestion
