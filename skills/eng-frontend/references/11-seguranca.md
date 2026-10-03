# 11. Segurança do Lado do Cliente

**Nível:** FUNDAMENTAL  
**Independência:** ✅ Válido em qualquer framework

## Objetivo
Evitar as vulnerabilidades mais comuns do navegador e nunca confiar em validação feita só no cliente.

## Conhecimentos Principais

### XSS (Cross-Site Scripting)
- Armazenado, refletido e baseado em DOM
- Prevenção: escapar e codificar a saída, Content Security Policy
- Sanitização de HTML

### CSRF (Cross-Site Request Forgery)
- Como funciona
- Tokens CSRF
- Cookies com SameSite

### Segurança do armazenamento
- Não guardar segredos no armazenamento local
- Diferenças entre sessionStorage e localStorage
- Cookies com HttpOnly, Secure e SameSite

### CORS (Cross-Origin Resource Sharing)
- Política de mesma origem
- Cabeçalhos CORS
- Credenciais e CORS

### Segurança de dependências
- Verificar vulnerabilidades de pacotes
- Ataques à cadeia de suprimentos (em conceito)
- Usar apenas as dependências necessárias

### Comunicação com a API
- HTTPS sempre
- Validar os dados recebidos do servidor
- Nunca expor segredos no frontend
- CSP (Content Security Policy)

### Validação de entrada
- Validar no cliente melhora a experiência, mas não é segurança
- Sempre validar também no servidor
- Escapar a saída

## O que NÃO Inclui
- Vulnerabilidades específicas do backend
- Segurança de infraestrutura

## Por quê é Universal
As vulnerabilidades do navegador valem independentemente do framework usado.

## Referências
- OWASP Top 10
- W3C - World Wide Web Consortium
