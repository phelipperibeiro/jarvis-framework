# Contratos de Interface

> Parte do skill `eng-frontend-microfrontend`. Leia este arquivo quando a tarefa definir ou alterar contratos entre shell e remotes.

## Contratos de Interface

O contrato é o **acordo formal** entre shell e remote — define o que o remote expõe e o que espera receber.

### Estrutura do pacote de contratos

```
packages/
└── mfe-contracts/
    ├── src/
    │   ├── remotes/
    │   │   ├── {nome-remote}.contract.ts    ← contrato do remote
    │   │   └── index.ts
    │   ├── shell/
    │   │   └── shell.context.ts             ← o que o shell injeta nos remotes
    │   └── index.ts
    ├── package.json
    └── tsconfig.json
```

### Definindo um contrato

```typescript
// packages/mfe-contracts/src/remotes/{nome-remote}.contract.ts

// O que o remote expõe ao shell
export interface {NomeRemote}Exports {
  default: React.ComponentType<{NomeRemote}Props>
}

// Props que o shell passa ao montar o remote
export interface {NomeRemote}Props {
  basePath: string
  onNavigate?: (path: string) => void
}

// Eventos que o remote emite no event bus
export interface {NomeRemote}Events {
  '{nome-remote}:action-completed': { id: string; result: unknown }
  '{nome-remote}:error': { code: string; message: string }
}
```

### Contexto do shell (injetado em todos os remotes)

```typescript
// packages/mfe-contracts/src/shell/shell.context.ts
export interface ShellContext {
  user: {
    id: string
    name: string
    permissions: string[]
  }
  theme: 'light' | 'dark'
  locale: string
  onNavigate: (path: string) => void
}

// Hook disponível em todos os remotes
export const ShellContextReact = React.createContext<ShellContext | null>(null)

export function useShellContext(): ShellContext {
  const ctx = React.useContext(ShellContextReact)
  if (!ctx) throw new Error('useShellContext deve ser usado dentro do ShellProvider')
  return ctx
}
```

---
