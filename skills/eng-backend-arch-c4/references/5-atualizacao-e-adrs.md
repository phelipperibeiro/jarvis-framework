# Atualização de Diagramas e ADRs (C4)

> Parte do skill `eng-backend-arch-c4`. Leia este arquivo quando já existirem diagramas em `$ENG_DOCS/c4/` ou a mudança pedir ADR.

## Fluxo de Atualização

Quando já existem diagramas:

```bash
# Ver mudanças arquiteturais recentes
git log --oneline -20 -- "src/" "docker-compose*" "Dockerfile*"
git diff origin/main --name-only | grep -E "docker|config|src/(domain|infrastructure)"
```

| Mudança Detectada | Nível | Ação |
|-------------------|-------|------|
| Novo sistema externo | Context | Adicionar |
| Novo container/serviço | Container | Adicionar |
| Novo módulo/componente | Component | Atualizar |

## Integração com ADRs

| Situação | ADR | C4 |
|----------|-----|-----|
| Novo sistema externo | Sim | Atualizar Context |
| Novo banco de dados | Sim | Atualizar Container |
| Mudança de pattern | Sim | Atualizar Component |
