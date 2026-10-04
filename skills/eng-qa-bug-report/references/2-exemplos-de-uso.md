# Exemplos de Uso

> Parte do skill `eng-qa-bug-report`. Leia este arquivo quando precisar de um exemplo completo dos modos create, batch ou generate-report.

## Exemplos de Uso

### Exemplo 1: Criar card único (BUG-ALTO — todos os campos P1 obrigatórios)

```bash
/eng-qa-bug-report create \
  --title="[auth] Token expirado retorna 500 ao invés de 401" \
  --category="BUG-ALTO" \
  --severity="P1" \
  --environment="prod" \
  --location="src/auth/token-validator.ts:67" \
  --description="Quando o token JWT expira durante uma requisição autenticada, o serviço retorna HTTP 500 ao invés de 401. Ocorre de forma recorrente em produção para todos os usuários com sessão ativa há mais de 24h." \
  --behavior-actual="POST /auth/validate retorna 500 Internal Server Error quando token está expirado" \
  --behavior-expected="POST /auth/validate retorna 401 Unauthorized com body {error: 'token_expired'}" \
  --reproduction="Pré-condição: usuário com token expirado (criado há >24h). Passos: 1. Fazer qualquer requisição autenticada. 2. Observar resposta. Resultado atual: HTTP 500." \
  --impact="Todos os usuários com sessão ativa há mais de 24h — estimativa de 30% da base ativa. App client não consegue tratar 500 como sessão expirada, causando loop de erro sem logout automático." \
  --entry-endpoint="POST /auth/validate" \
  --affected-services="account,auth" \
  --correlation-id="req-a1b2c3d4" \
  --frequency="recorrente" \
  --linked-to="PROJ-999" \
  --suggestion="Adicionar catch específico para TokenExpiredError antes do handler genérico de erros"
```

### Exemplo 2: Criar cards em batch

```bash
/eng-qa-bug-report batch \
  --from-audit="./sessions/bug-audit-20260208/bug-audit-report.md" \
  --priority-filter="P0,P1"
```

### Exemplo 3: Gerar relatório

```bash
/eng-qa-bug-report generate-report \
  --bugs="./sessions/bugs-found.json" \
  --output="./sessions/consolidated-bug-report.md" \
  --format="markdown"
```

---
