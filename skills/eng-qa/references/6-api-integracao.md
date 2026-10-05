# 6. Testes de API e Integração

**Nível:** FUNDAMENTAL · **Agnóstico de tecnologia:** ✅

**Objetivo:** Verificar o comportamento nas fronteiras entre componentes e serviços.

**Conhecimentos:** requisição e resposta: método, status, cabeçalhos, esquema; validação de payload e tipos; idempotência e repetição; autenticação e autorização; paginação, filtros e limites; erros e códigos de falha; testes negativos e de borda; integração entre módulos, serviços e bancos; virtualização de serviços e test doubles; fluxos assíncronos: eventos e filas; dados e ambientes de integração controlados; compatibilidade entre versões.

**Princípios:**
- Teste a interface pelo contrato, não pela implementação.
- Falhas de integração moram nas bordas: tempo, formato, ordem, duplicidade.
- Isole dependências externas instáveis.

**Fora do escopo:** coleções, sintaxe e recursos de clientes de API específicos.

**Pergunta-chave:** O que acontece quando o serviço vizinho responde devagar, errado ou em duplicidade?

**Referências:**
- Fielding, *Architectural Styles and the Design of Network-based Software Architectures* (2000)
- RFC 9110, *HTTP Semantics*
- Newman, *Building Microservices* (2ª ed.)
- Nygard, *Release It!*
- ISO/IEC/IEEE 29119-4

**Usam mais:** API, Integration, Test Engineering, Security, Automation
