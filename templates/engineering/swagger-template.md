---
name: "API {Nome do Serviço}"
version: "1.0.0"
status: "draft"
jira: ""
owner: ""
reviewers: []
created_at: "YYYY-MM-DD"
updated_at: "YYYY-MM-DD"
spec_format: "openapi-3.0"
spec_file: "api-{service}.yaml"
---

# API {Nome do Serviço}

## Metadados

- **Versão da API**: 1.0.0
- **Formato da Spec**: OpenAPI 3.0.3
- **Arquivo da Spec**: `api-{service}.yaml` (ou `.json`)
- **Base URL (Produção)**: `https://api.exemplo.com/v1`
- **Base URL (Staging)**: `https://api-staging.exemplo.com/v1`
- **Autenticação**: JWT Bearer Token

## Visão Geral

Breve descrição do propósito da API e principais funcionalidades.

## Endpoints Principais

### Autenticação
- `POST /auth/login` - Autenticar usuário
- `POST /auth/refresh` - Renovar token
- `POST /auth/logout` - Encerrar sessão

### Recursos
- `GET /resources` - Listar recursos
- `POST /resources` - Criar recurso
- `GET /resources/{id}` - Obter recurso específico
- `PUT /resources/{id}` - Atualizar recurso
- `DELETE /resources/{id}` - Remover recurso

## Autenticação

```http
Authorization: Bearer {jwt_token}
```

Obter token via `POST /auth/login` com credenciais válidas.

## Formato de Resposta

### Sucesso (2xx)

```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2026-03-11T15:30:00Z",
    "version": "1.0.0"
  }
}
```

### Erro (4xx, 5xx)

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Recurso não encontrado",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-03-11T15:30:00Z",
    "request_id": "abc-123"
  }
}
```

## Rate Limiting

- **Limite**: 1000 requisições por hora por IP
- **Headers**:
  - `X-RateLimit-Limit`: Limite total
  - `X-RateLimit-Remaining`: Requisições restantes
  - `X-RateLimit-Reset`: Timestamp do reset

## Versionamento

- Versionamento via URL: `/v1/`, `/v2/`
- Versões antigas mantidas por 6 meses após deprecação
- Deprecação anunciada via header `Deprecation: true`

## Documentação Interativa

- **Swagger UI**: `https://api.exemplo.com/docs`
- **ReDoc**: `https://api.exemplo.com/redoc`
- **Spec JSON**: `https://api.exemplo.com/openapi.json`
- **Spec YAML**: `https://api.exemplo.com/openapi.yaml`

## Ambientes

| Ambiente | Base URL | Propósito |
|----------|----------|-----------|
| Desenvolvimento | `http://localhost:3000` | Desenvolvimento local |
| Staging | `https://api-staging.exemplo.com` | Testes e homologação |
| Produção | `https://api.exemplo.com` | Ambiente de produção |

## Contato

- **Squad**: {squad}
- **Tech Lead**: {nome}
- **Slack**: #{canal-slack}
- **Repositório**: {url-repo}

## Changelog da API

### v1.0.0 (YYYY-MM-DD)
- Versão inicial
- Endpoints de autenticação
- CRUD de recursos

## Referências

- [OpenAPI Specification 3.0](https://spec.openapis.org/oas/v3.0.3)
- [Swagger Editor](https://editor.swagger.io/)
- ARD relacionado: `ard-{service}.md`
- RFC relacionado: `rfc-{service}.md`

---

## Arquivo da Spec

O arquivo completo da especificação OpenAPI está em:
- **YAML**: `engineering/swagger/api-{service}.yaml`
- **JSON**: `engineering/swagger/api-{service}.json`

Para visualizar interativamente, use:
```bash
# Swagger UI local
npx swagger-ui-watcher api-{service}.yaml

# Ou abra em https://editor.swagger.io/
```
