# 15. Autenticação e Gestão de Credenciais

**Nível:** FUNDAMENTAL · **Agnóstico de tecnologia:** ✅

**Objetivo:** Autenticar automações com o menor privilégio e sem expor segredos.

**Conhecimentos:** contas de serviço vs. credenciais de pessoas; fluxos de autorização (credenciais de cliente, código com PKCE, tokens de atualização); chaves de API, certificados e mTLS; escopo mínimo e expiração; cofre de segredos e rotação; segredos fora de código, logs e capturas de tela; MFA em fluxos automatizados: mecanismos aprovados pelo provedor; renovação de token no meio da execução; identidade por robô para auditoria; revogação e resposta a vazamento; separação por ambiente.

**Princípios:**
- Nunca compartilhe credenciais de pessoas com automações.
- Vida curta, escopo estreito, rotação automática.
- Se o provedor exige MFA para a automação, peça um mecanismo oficial; não o contorne.

**Fora do escopo:** cofres, provedores de identidade e protocolos proprietários.

**Pergunta-chave:** Se o segredo desta automação vazasse hoje, o que seria alcançado e como você o revogaria?

**Referências:**
- RFC 6749 (OAuth 2.0), RFC 6750 e RFC 7636 (PKCE)
- NIST SP 800-63B (autenticação)
- NIST SP 800-57 (gestão de chaves)
- OWASP, *Secrets Management Cheat Sheet*

**Usam mais:** Automation Engineering, API Automation, RPA, Web Automation
