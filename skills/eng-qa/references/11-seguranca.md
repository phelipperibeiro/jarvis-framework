# 11. Testes de Segurança

**Nível:** IMPORTANTE · **Agnóstico de tecnologia:** ✅

**Objetivo:** Encontrar vulnerabilidades antes dos atacantes, de forma sistemática.

**Conhecimentos:** modelagem de ameaças; classes comuns: injeção, controle de acesso quebrado, autenticação falha, exposição de dados, configuração incorreta; testes de autenticação e autorização; validação de entrada e saída; análise estática, dinâmica e de dependências (conceitos); fuzzing; testes de intrusão e limites éticos; segredos e dados sensíveis em testes; verificação de requisitos de segurança; priorização e relato por risco; segurança em APIs e mobile.

**Princípios:**
- Pense como atacante, relate como engenheiro.
- Controle de acesso é onde mais se erra: teste com perfis distintos.
- Teste somente dentro do escopo autorizado.

**Fora do escopo:** scanners, listas de regras e exploits de produtos ou versões específicas.

**Pergunta-chave:** Um usuário comum consegue ver dados de outro mudando só um identificador?

**Referências:**
- OWASP, *Web Security Testing Guide*
- OWASP, *ASVS* e *Top 10*
- NIST SP 800-115, *Technical Guide to Information Security Testing and Assessment*
- Shostack, *Threat Modeling: Designing for Security*

**Usam mais:** Security, API, Test Engineering, Mobile
