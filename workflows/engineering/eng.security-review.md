---
description: Workflow de Engenharia para Review de Seguranca em PRs/MRs (gate pre-merge)
globs:
  alwaysApply: false
recommended_model: claude-sonnet-4-6-20250514
model_tier: high
model_justification: Security review de PRs requer analise focada de mudancas especificas — nao exige raciocinio tao profundo quanto audit completo, mas precisa de precisao
---

# Workflow de Engenharia – Security Review (Gate Pre-Merge)

## Objetivo

Guiar o SENTINEL (ENG) na revisao de seguranca de PRs/MRs que tocam areas sensiveis do codigo — autenticacao, autorizacao, inputs, APIs, configs e permissoes. Funciona como gate de seguranca complementar ao code review normal.

---

## Quando Usar Este Workflow

- PR modifica fluxos de autenticacao ou autorizacao
- PR adiciona ou modifica endpoints publicos
- PR toca em processamento de inputs (forms, uploads, parsing)
- PR modifica configs de seguranca (CORS, CSP, headers)
- PR adiciona dependencias novas
- PR toca em dados sensiveis (PII, financeiro)
- PR modifica permissoes ou roles (RBAC, guards)
- Tech Lead solicita security review explicito

---

## Pre-requisitos

### Entrada

```
/eng.security-review [referencia-do-pr]

Onde [referencia-do-pr] pode ser:
- Numero do PR/MR: #123
- URL: https://gitlab.com/org/repo/-/merge_requests/123
- Branch: feature/nova-auth
```

---

## Fase 1 – Scope

### 1.1 Identificar arquivos alterados

```bash
# Listar arquivos alterados no PR/branch
git diff --name-only main...HEAD 2>/dev/null || git diff --name-only origin/main...HEAD

# Filtrar arquivos sensiveis
git diff --name-only main...HEAD | grep -E "(auth|guard|middleware|session|login|permission|role|token|secret|password|cors|csp|helmet|security|\.env)" 2>/dev/null
```

### 1.2 Classificar risco do PR

| Indicador | Risco | Motivo |
|-----------|-------|--------|
| Toca em auth/guard/session | **ALTO** | Bypass pode dar acesso total |
| Adiciona endpoint publico | **ALTO** | Nova superficie de ataque |
| Modifica CORS/CSP/headers | **ALTO** | Misconfiguration afeta toda app |
| Processa input do usuario | **MEDIO** | Injection, XSS |
| Adiciona dependencia nova | **MEDIO** | Supply chain |
| Modifica roles/permissoes | **ALTO** | Escalacao de privilegio |
| Toca em dados sensiveis | **ALTO** | Data exposure |
| Refactoring sem mudanca de API | **BAIXO** | Risco minimo |

---

## Fase 2 – Analysis

### 2.1 Checklist de seguranca por area

#### Auth e Sessions
- [ ] Tokens JWT: expiracao curta para access, refresh com rotacao
- [ ] Sessions: `httpOnly`, `secure`, `sameSite: strict`
- [ ] Password hashing: bcrypt/argon2 (nunca MD5/SHA1)
- [ ] Rate limiting em login/registro
- [ ] Logout invalida session/token no backend

#### Inputs e Validation
- [ ] Todos os inputs validados com schema (Zod, Joi, class-validator)
- [ ] Queries parametrizadas (nunca concatenacao SQL)
- [ ] Uploads: validar tipo, tamanho, nome de arquivo
- [ ] Rich text: sanitizado com allowlist (DOMPurify)
- [ ] URLs dinamicas: validadas contra allowlist (prevenir SSRF)

#### APIs e Endpoints
- [ ] Endpoints protegidos com auth guard (exceto os intencionalmente publicos)
- [ ] Autorizacao verificada (RBAC/permissions, nao apenas autenticacao)
- [ ] IDOR prevenido (usuario so acessa seus dados ou tem permissao)
- [ ] Rate limiting em endpoints sensiveis
- [ ] Erros nao vazam detalhes internos (stack traces, queries)

#### Configs e Headers
- [ ] CORS: origins especificas (nunca `*` em producao)
- [ ] CSP: configurado e restritivo
- [ ] HSTS: habilitado com `includeSubDomains`
- [ ] X-Frame-Options: `DENY` ou `SAMEORIGIN`
- [ ] Sem debug mode em producao

#### Dependencias
- [ ] `npm audit` sem vulnerabilidades HIGH/CRITICAL
- [ ] Lockfile atualizado e commitado
- [ ] Dependencia nova: verificar manutencao, downloads, issues

#### Dados Sensiveis
- [ ] PII criptografada em repouso
- [ ] Logs nao contem dados sensiveis (senhas, tokens, PII)
- [ ] Dados sensiveis nao expostos em respostas de API desnecessariamente

---

## Fase 2.5 — Verificacao Multi-Voto

Para cada achado identificado no checklist (Fase 2), spawnar **3 subagentes de voto** independentes.

> Subagentes de voto rodam **sem MCP** — apenas o texto do achado como contexto. Menos tool = veredicto mais deterministico e barato.

**Brief por subagente de voto:**

```
Voce e um revisor de seguranca independente. Avaliar este achado:

ACHADO: {titulo} em {arquivo}:{linha}
EVIDENCIA: {codigo ou config vulneravel}
CONTEXTO: PR #{referencia}, area {categoria}

Este e um achado real e exploravel no contexto deste PR?

Responda exatamente:
verdict: confirmed | rejected | inconclusive
reasoning: <uma linha explicando o veredicto>
confidence: <0.0-1.0>
```

**Consolidacao dos votos:**

| Resultado | Criterio | Acao |
|---|---|---|
| Confirmado | >= 2/3 votos `confirmed` | Incluir no report com severidade original |
| Falso positivo | >= 2/3 votos `rejected` | Descartar — nao incluir |
| Inconcluso | Divergencia | Incluir com flag `[REVISAR]` para humano |

---

## Fase 3 – Verdict

### 3.1 Classificar resultado

| Verdict | Criterio | Acao |
|---------|----------|------|
| **APPROVED** | Nenhum achado HIGH/CRITICAL | Aprovar merge |
| **CHANGES REQUESTED** | Achados MEDIUM ou HIGH corrigiveis | Solicitar correcoes com evidencia |
| **BLOCKED** | Achado CRITICAL ou HIGH nao corrigivel trivialmente | Bloquear merge, escalar para TL |

### 3.2 Feedback estruturado

Para cada achado, comentar no PR com:

```markdown
**[SECURITY - {SEVERIDADE}]** {titulo}

**Arquivo**: `path/to/file.ts:line`
**Vetor**: {tipo de vulnerabilidade}
**Evidencia**:
\`\`\`typescript
// codigo vulneravel
\`\`\`

**Correcao sugerida**:
\`\`\`typescript
// codigo seguro
\`\`\`
```

---

## Fase 4 – Documentation

### 4.1 Registrar decisao

```markdown
## Security Review Summary

**PR/MR**: {referencia}
**Reviewer**: SENTINEL (AI-assisted)
**Data**: {ISO-8601}
**Verdict**: APPROVED | CHANGES REQUESTED | BLOCKED

### Areas revisadas
- [ ] Auth e Sessions
- [ ] Inputs e Validation
- [ ] APIs e Endpoints
- [ ] Configs e Headers
- [ ] Dependencias
- [ ] Dados Sensiveis

### Achados
| # | Severidade | Descricao | Status |
|---|-----------|-----------|--------|
| 1 | {sev} | {descricao} | {aberto|corrigido} |

### Notas
{observacoes adicionais relevantes}
```

---

## Fase 4.2 — Output JSON (security-findings.json)

Alem do summary markdown (Fase 4.1), escrever `security-findings.json` conforme `docs/SECURITY-ARTIFACTS-SCHEMA.md` secao 2.

Incluir apenas achados com `vote_result.verdict != rejected` (confirmed + inconclusive).
Este arquivo pode ser consumido por `eng-security-triage` para dedup e re-rank caso o PR faca parte de um audit maior.

---

## Regras

### Nunca
- Aprovar um PR com achado CRITICAL sem correcao
- Bloquear um PR sem evidencia tecnica (nao bloquear por "sensacao")
- Fazer review de seguranca superficial (checklist mecanico sem analise)
- Ignorar dependencias novas adicionadas ao projeto

### Sempre
- Analisar o diff completo, nao apenas os arquivos marcados como "sensiveis"
- Fornecer correcao sugerida para cada achado (nao apenas apontar o problema)
- Considerar o contexto: um endpoint interno tem risco diferente de um publico
- Comunicar achados CRITICAL ao TL imediatamente (nao esperar o review terminar)
- Verificar se testes de seguranca foram adicionados para mudancas em auth
