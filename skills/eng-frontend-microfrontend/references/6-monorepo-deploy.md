# Monorepo e Estratégia de Deploy

> Parte do skill `eng-frontend-microfrontend`. Leia este arquivo quando a tarefa envolver a estrutura do monorepo, o deploy independente ou o versionamento de remotes.

## Monorepo Frontend

### Estrutura recomendada

```
{repo}/
├── apps/
│   ├── shell/              ← host application
│   ├── {remote-a}/         ← micro frontend A
│   └── {remote-b}/         ← micro frontend B
├── packages/
│   ├── design-system/      ← componentes e tokens compartilhados
│   ├── mfe-contracts/      ← tipos TypeScript de contratos de interface
│   └── utils/              ← utilitários compartilhados
├── pnpm-workspace.yaml
└── turbo.json
```

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

---

## Estratégia de Deploy

### Deploy independente (objetivo central do micro frontend)

```
Cada remote tem seu próprio pipeline de CI/CD:
  push → build → test → deploy → atualizar URL no shell (via env var ou config service)

Shell NÃO precisa ser re-deployed quando um remote é atualizado.
```

### Variáveis de ambiente por remote

```bash
# .env.production do shell
VITE_REMOTE_URL_NOME_REMOTE=https://cdn.example.com/nome-remote/remoteEntry.js
VITE_REMOTE_URL_OUTRO_REMOTE=https://cdn.example.com/outro-remote/remoteEntry.js
```

### Versionamento de remotes

```
Sem breaking change na API exposta → patch ou minor → URL permanece a mesma
Breaking change na API exposta (props, eventos) → major → nova URL + migração no shell
```

---
