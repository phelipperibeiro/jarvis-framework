# Troubleshooting de Micro Frontend

> Parte do skill `eng-frontend-microfrontend`. Leia este arquivo quando houver erro de módulo compartilhado, remote indisponível ou componente que não re-renderiza.

## Troubleshooting

### Erro: "Shared module is not available for eager consumption"

```typescript
// ❌ Causa: eager: true em shared lib com React
shared: { react: { singleton: true, eager: true } }  // NÃO FAZER

// ✅ Solução: usar bootstrap.ts com import() dinâmico
// src/index.ts
import('./bootstrap')  // async bootstrap resolve o problema
```

### Erro: "Remote container is not available"

```bash
# 1. Verificar se o remote está rodando
curl http://localhost:3001/assets/remoteEntry.js

# 2. Verificar CORS no servidor do remote
# O remoteEntry.js precisa ser acessível pelo shell

# 3. Verificar se a URL no shell está correta
grep -r "remoteEntry" vite.config.ts
```

### Componente do remote não re-renderiza após update de state do shell

```typescript
// Causa provável: contexto do shell não está sendo re-injetado no remote
// Solução: passar o contexto via props no ponto de montagem, não via módulo compartilhado

// ❌ Problemático
import { useShellStore } from 'shell/store'  // import direto entre remote e shell

// ✅ Correto
// Shell passa estado via props ao montar o remote
<RemoteApp user={currentUser} onNavigate={navigate} />
```

---
