---
description: Workflow de Engenharia para Auditoria de Seguranca (OWASP, secrets, supply chain)
globs:
  alwaysApply: false
recommended_model: claude-opus-4-6-20250529
model_tier: very_high
model_justification: Auditoria de seguranca requer analise profunda de codigo, identificacao de padroes de vulnerabilidade, classificacao CVSS e geracao de relatorios estruturados
---

# Workflow de Engenharia – Security Audit

## Objetivo

Guiar o SENTINEL (ENG) na auditoria proativa de seguranca de projetos — analisando codigo, configs, dependencias e arquitetura contra OWASP Top 10, supply chain e boas praticas de seguranca. Gera relatorio com severidade CVSS e cards no `$TASK_MANAGER`.

---

## Quando Usar Este Workflow

- Auditoria periodica de seguranca (por sprint ou release)
- Onboarding em projeto sem historico de seguranca
- Pre-lancamento de feature com superficie de ataque significativa
- Pos-incidente para verificar outros vetores
- Avaliacao de compliance (LGPD, GDPR, PCI-DSS)

---

## Pre-requisitos

### Validar ENV.md

```bash
if [ ! -f "$IDE/ENV.md" ]; then
  echo "ENV.md nao encontrado. Execute /init-jarvis primeiro."
  exit 1
fi

required_vars=("WORKSPACE" "IDE" "SQUAD" "HUB" "AREA" "POSITION")
for var in "${required_vars[@]}"; do
  if ! grep -q "^$var=.\+" "$IDE/ENV.md"; then
    echo "Variavel $var nao definida no ENV.md"
  fi
done
```

### Definir Escopo (Argumento)

```
/eng.security-audit [escopo]

Onde [escopo] pode ser:
- Caminho de pasta/arquivo: ./src/auth/
- Modulo especifico: payment-service
- Projeto completo: --all
- Foco especifico: --focus=owasp|secrets|supply-chain|headers|compliance
```

---

## Fase 0 – Analise de Contexto (CDD)

> Skill: Use `/context-detect` se existir uma sessao ativa
> Configuravel: Controlada pela variavel `ENABLE_CDD` no ENV.md

```bash
grep "^ENABLE_CDD=" $IDE/ENV.md
```

- Se `ENABLE_CDD=false` ou nao definida: pular esta fase
- Se `ENABLE_CDD=true`: herdar contexto

---

## Fase 0.5 — Threat Model Scoping

Se `THREAT_MODEL.md` existe no projeto (gerado por `/eng-threat-model`):

1. Ler secao 3 "Entry points & trust boundaries" → usar como lista base de focus areas para fan-out
2. Ler secao 4 "Threats" → filtrar por `status != mitigated` → priorizar areas com ameacas `almost_certain` ou `likely`
3. Registrar `threat_model_ref` para incluir no `security-findings.json` de output

Se nao existe: prosseguir para Fase 1 (recon manual de areas).

> Threat model transforma o scan de "busca geral" em "busca guiada" — reduz ruido e aumenta recall nas areas criticas.

---

## Fase 1 – Scoping

### 1.1 Mapear superficie de ataque

```bash
# Endpoints publicos (controllers, rotas)
grep -rn --include="*.ts" --include="*.js" --include="*.py" \
  -E "@(Get|Post|Put|Patch|Delete|Controller|app\.(get|post|put|delete)|router\.(get|post))" \
  src/ 2>/dev/null | head -50

# Arquivos de auth
grep -rl --include="*.ts" --include="*.js" \
  -E "(auth|guard|middleware|session|jwt|passport|oauth)" \
  src/ 2>/dev/null

# Configs de seguranca existentes
find . -maxdepth 3 \( -name "helmet*" -o -name "cors*" -o -name "csp*" -o -name "*.security.*" \) 2>/dev/null
```

### 1.2 Priorizar areas

| Prioridade | Area | Motivo |
|------------|------|--------|
| P0 | Auth, sessions, tokens | Bypass = acesso total |
| P1 | Inputs (forms, APIs, uploads) | Injection, XSS |
| P2 | Dados sensiveis (PII, financeiro) | Exposicao, compliance |
| P3 | Dependencias e configs | Supply chain, misconfiguration |
| P4 | Logs e monitoramento | Deteccao de ataques |

---

## Fase 2 – Reconnaissance

### 2.1 Mapear tecnologias e frameworks

```bash
# Stack detection
cat package.json 2>/dev/null | grep -E '"(nest|express|fastify|next|react|vue|prisma|typeorm|mongoose)"'
cat requirements.txt 2>/dev/null | head -20
cat go.mod 2>/dev/null | head -20

# Verificar se ha ferramentas de seguranca ja instaladas
cat package.json 2>/dev/null | grep -E '"(helmet|cors|csurf|express-rate-limit|bcrypt|argon2|zod|joi)"'
```

### 2.2 Mapear dados sensiveis

```bash
# Modelos com campos sensiveis
grep -rn --include="*.ts" --include="*.js" --include="*.py" \
  -E "(password|cpf|cnpj|credit_card|card_number|ssn|phone|birth_date|salary)" \
  src/ 2>/dev/null | head -30

# Verificar .gitignore para .env
grep -E "\.env" .gitignore 2>/dev/null
```

---

## Fase 3 – Analysis (OWASP Top 10)

### Fan-out por focus-area

Quando o projeto tem >15 arquivos de codigo-fonte, spawnar **1 subagente Task por focus-area** (max 10 concorrentes).
Em projetos pequenos (<15 arquivos): analise sequencial sem fan-out.

Cada subagente recebe:
- Focus area derivada da Fase 0.5 (threat model) ou Fase 1 (recon manual)
- Trust boundary do `THREAT_MODEL.md` secao 3, ou `"untrusted input → processo"` como fallback
- O brief OWASP abaixo como instrucao de analise

**Subagentes rodam sem MCP** — apenas Read/Grep para o codigo-alvo. Veredicto mais deterministico e barato.

Para cada vetor, verificar no codigo e classificar achados:

### A01 - Broken Access Control
```bash
# Endpoints sem guard/middleware de auth
grep -rn --include="*.ts" "@(Get|Post|Put|Delete)" src/ | grep -v -E "(Guard|Auth|Roles|Public)" | head -20

# IDOR patterns
grep -rn --include="*.ts" "req.params\.\(id\|userId\|orderId\)" src/ | head -20
```

### A03 - Injection
```bash
# SQL injection patterns
grep -rn --include="*.ts" --include="*.js" -E "(\$queryRaw[^U]|query\(.*\+|query\(.*\$\{|exec\(.*\+)" src/ 2>/dev/null

# Command injection
grep -rn --include="*.ts" --include="*.js" -E "(exec\(|execSync\(|spawn\()" src/ 2>/dev/null | head -20
```

### A05 - Security Misconfiguration
```bash
# CORS config
grep -rn --include="*.ts" --include="*.js" -E "(enableCors|cors\()" src/ 2>/dev/null

# Debug/dev configs em producao
grep -rn --include="*.ts" --include="*.js" -E "(debug:\s*true|DEBUG=true|stack.*trace)" src/ 2>/dev/null
```

### A06 - Vulnerable Components
```bash
# Verificar vulnerabilidades
npm audit --audit-level=moderate 2>/dev/null || echo "npm audit nao disponivel"
```

> Repetir para cada vetor relevante usando o skill `eng-cybersecurity` como referencia.

---

## Fase 4 – Supply Chain

```bash
# Verificar lockfile commitado
git ls-files | grep -E "(package-lock|yarn.lock|pnpm-lock)" | head -5

# Verificar se .npmrc esta seguro (sem tokens hardcoded)
cat .npmrc 2>/dev/null | grep -v "^#" | grep -i "token\|auth" | head -5

# Licencas problematicas
npx license-checker --summary 2>/dev/null | head -20
```

---

## Fase 5 – Classification

Classificar cada achado no formato:

```markdown
### [SEV] Titulo da vulnerabilidade

- **Severidade**: CRITICAL | HIGH | MEDIUM | LOW | INFO
- **CVSS estimado**: X.X
- **Vetor OWASP**: A01-A10
- **Arquivo(s)**: `path/to/file.ts:line`
- **Evidencia**: {codigo ou config vulneravel}
- **Vetor de ataque**: {como um atacante exploraria}
- **Impacto**: {o que acontece se explorado}
- **Correcao**: {codigo ou config corrigido}
- **Status**: aberto | corrigido | mitigado
```

---

## Fase 6 – Reporting

### 6.1 Gerar relatorio

Criar arquivo `security-audit-report.md` na sessao:

```markdown
# Security Audit Report

**Workspace**: $WORKSPACE
**Squad**: $SQUAD
**Data**: {data ISO-8601}
**Auditor**: SENTINEL (AI-assisted)
**Escopo**: {escopo auditado}

## Resumo Executivo

| Severidade | Quantidade |
|------------|-----------|
| CRITICAL | {n} |
| HIGH | {n} |
| MEDIUM | {n} |
| LOW | {n} |
| INFO | {n} |

## Achados

{lista de achados classificados, do mais critico ao menos}

## Recomendacoes Prioritarias

1. {correcao mais urgente}
2. {segunda mais urgente}
...

## Proximos Passos

- [ ] Corrigir achados CRITICAL/HIGH
- [ ] Agendar correcao de MEDIUM para proxima sprint
- [ ] Documentar LOW/INFO como debt de seguranca
```

### 6.2 Criar cards no $TASK_MANAGER

Para achados CRITICAL e HIGH, criar cards com:
- Titulo: `[SECURITY] {titulo da vulnerabilidade}`
- Label: `security`, `{severidade}`
- Descricao: evidencia + correcao sugerida
- Prioridade: maxima para CRITICAL, alta para HIGH

---

## Fase 6.3 — Output JSON (security-findings.json)

Alem do relatorio markdown, escrever `.security/outputs/security-findings.json` conforme `docs/SECURITY-ARTIFACTS-SCHEMA.md` secao 2. Criar `.security/outputs/` se nao existir.

Um arquivo por focus-area durante o fan-out (prefixar IDs: `AUTH-F001`, `DEPS-F002`).
Consolidar em arquivo unico ao final em `.security/outputs/security-findings.json`, reordenando por (impact, likelihood) decrescente.

Este arquivo e o input direto do skill `eng-security-triage`.

---

## Regras

### Nunca
- Ignorar um achado porque "provavelmente nao sera explorado"
- Executar exploits reais contra o sistema em producao
- Expor secrets encontrados no relatorio (mascarar com `***`)
- Minimizar severidade sem justificativa tecnica
- Pular a classificacao CVSS

### Sempre
- Usar o skill `eng-cybersecurity` como referencia de padroes
- Classificar TODOS os achados por severidade
- Incluir evidencia (codigo) e correcao para cada achado
- Mascarar secrets encontrados antes de reportar
- Comunicar achados CRITICAL imediatamente ao usuario (nao esperar o relatorio final)
