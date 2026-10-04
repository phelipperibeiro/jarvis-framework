# Shared Dependencies

> Parte do skill `eng-frontend-microfrontend`. Leia este arquivo quando a tarefa envolver dependências compartilhadas ou conflito de versão.

## Shared Dependencies

### Regras críticas

```
singleton: true   → apenas uma instância em toda a aplicação (obrigatório para React, React DOM)
eager: false      → NÃO usar eager para shared libs (causa bootstrap error)
requiredVersion   → sempre declarar para evitar conflitos silenciosos
```

### Checklist de shared deps

```typescript
shared: {
  // Core React — sempre singleton
  'react': { singleton: true, requiredVersion: '^18.0.0' },
  'react-dom': { singleton: true, requiredVersion: '^18.0.0' },

  // Router — singleton para evitar múltiplos contextos de roteamento
  'react-router-dom': { singleton: true, requiredVersion: '^6.0.0' },

  // Design system — singleton obrigatório (CSS e contexto de tema)
  '@{org}/design-system': { singleton: true },

  // Estado global — singleton se compartilhado entre remotes
  'zustand': { singleton: true },

  // NÃO compartilhar: libs utilitárias pequenas (date-fns, lodash)
  // → melhor cada remote ter sua versão para evitar lock de versão
}
```

### Conflito de versão (diagnóstico)

```bash
# Ver qual versão de react cada remote está carregando
# No DevTools → Network → filtrar por "remoteEntry.js"
# Abrir arquivo e buscar por "shared"

# Via CLI — verificar versões no monorepo
pnpm list react --recursive
```

---
