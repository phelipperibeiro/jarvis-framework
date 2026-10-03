# 10. Segurança de Aplicações

**Nível:** FUNDAMENTAL  
**Independência:** ✅ Válido em qualquer linguagem

## Objetivo
Construir aplicações que resistam às vulnerabilidades mais comuns e protejam os dados, com segurança por padrão.

## Conhecimentos Principais

### OWASP Top 10 (2025)
- 1. Quebra de controle de acesso (Broken Access Control)
- 2. Configuração incorreta de segurança (Security Misconfiguration)
- 3. Falhas na cadeia de suprimentos de software (Software Supply Chain Failures)
- 4. Falhas criptográficas (Cryptographic Failures)
- 5. Design inseguro (Insecure Design)
- 6. Componentes vulneráveis e desatualizados
- 7. Falhas de identificação e autenticação
- 8. Falhas de integridade de software e de dados
- 9. Falhas de registro e monitoramento de segurança
- 10. Server-Side Request Forgery (SSRF)

### Autenticação e autorização
- Autenticação básica versus avançada
- OAuth 2.0 (em conceito) e JWT
- Autenticação multifator (MFA)
- Gerenciamento seguro de sessão
- Autorização (RBAC e ABAC) e prevenção de acesso indevido a recursos de outras pessoas

### Criptografia
- Hash com sal e algoritmos modernos (bcrypt, scrypt, argon2); nunca senha em texto plano
- Criptografia simétrica versus assimétrica
- Assinaturas digitais
- Certificados e PKI (em conceito)
- HTTPS e TLS

### Práticas seguras
- Validação e sanitização de toda entrada externa
- Proteção contra CSRF e configuração segura de CORS
- Prevenção de injeção de SQL e de XSS
- Padrões seguros por padrão (secure defaults)
- Princípio do menor privilégio

### Dados sensíveis
- Dados pessoais (PII)
- LGPD, GDPR e CCPA (em conceito)
- Criptografia em repouso e em trânsito
- Exclusão segura
- Gerenciamento de segredos: nunca no código nem no repositório

## O que NÃO Inclui
- Ferramentas específicas de segurança
- Configuração de firewall de aplicação web

## Por quê é Universal
As vulnerabilidades e as defesas valem independentemente da linguagem ou do framework.

## Referências
- OWASP Top 10
- IEEE SWEBOK
- ACM Computing Curricula 2023
