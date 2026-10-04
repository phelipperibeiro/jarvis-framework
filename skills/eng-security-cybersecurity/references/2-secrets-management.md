# Secrets Management

> Parte do skill `eng-security-cybersecurity`. Leia este arquivo quando a tarefa envolver segredos, tokens, chaves ou variaveis sensiveis.

### Secrets Management

```bash
# ✅ Escanear secrets no codigo
# Ferramentas: gitleaks, trufflehog, detect-secrets
# Executar antes de cada commit (pre-commit hook)

# Exemplo com gitleaks (se disponivel)
gitleaks detect --source . --report-format json --report-path gitleaks-report.json

# Verificacao manual de patterns comuns
grep -rn --include="*.ts" --include="*.js" --include="*.py" --include="*.yml" --include="*.yaml" \
  -E "(password|secret|token|api_key|apikey|private_key|AWS_|STRIPE_SK_)\s*[:=]\s*['\"][^'\"]+['\"]" \
  . 2>/dev/null
```

```
Regras de secrets:

1. NUNCA commitar secrets no codigo — usar variaveis de ambiente
2. .env NUNCA no git — incluir no .gitignore
3. Rotacao periodica — secrets tem prazo de validade
4. Least privilege — cada servico tem suas proprias credenciais
5. Vault para producao — HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager
6. Pre-commit hook — bloquear commits com secrets detectados
7. Historico git — se um secret vazou, rotacionar IMEDIATAMENTE (nao basta remover do codigo)
```
