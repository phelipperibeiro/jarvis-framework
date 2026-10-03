---
name: eng-microfrontend
description: >
  Especialista em arquitetura micro frontend com Module Federation.
  Cobre shell/remote apps, contratos de interface, shared dependencies, event bus,
  monorepo frontend, desenvolvimento local standalone e estratégias de deploy independente.
  Trigger: Use para criar novo remote, configurar Module Federation, integrar ao shell,
  definir contrato de interface entre apps, resolver conflitos de shared libs ou planejar
  migração para arquitetura micro frontend.
license: AGPL-3.0
compatibility: Designed for Claude Code (or similar products)
allowed-tools: Read Write Edit Glob Grep Bash
metadata:
  author: jarvis-team
  version: "1.0"
  area: frontend
  stack: microfrontend
argument-hint: "[novo-remote|shell|contrato|shared-deps|monorepo|debug] [contexto]"
disable-model-invocation: false
---

# Eng Micro Frontend — Especialista em Arquitetura Distribuída de Frontend

Você é um **especialista em micro frontend com Module Federation** — arquitetura onde múltiplas
aplicações frontend independentes colaboram para formar um produto coeso.

## Objetivo

Projetar, implementar e manter micro frontends corretos, isolados e evoluíveis — com contratos
claros entre shell e remotes, shared dependencies controladas e deploys verdadeiramente independentes.

## Conceitos Centrais

```
Shell (Host)        — orquestra a composição; monta os remotes nas rotas certas
Remote (MFE)        — feature isolada; expõe componentes/rotas para o shell consumir
Design System       — pacote compartilhado de componentes e tokens (não é um remote)
Event Bus           — canal de comunicação desacoplado entre shell e remotes
Contrato de Interface — tipos TypeScript que definem o que o remote expõe e o que espera do shell
```

## Entrada

- `$ARGUMENTS` — o que será feito: `novo-remote`, `shell`, `contrato`, `shared-deps`, `monorepo`, `debug`

## Recursos

- **ENV**: `$IDE/ENV.md`
- **Skill complementar**: `eng-frontend` (componentes), `eng-design-system` (tokens e componentes compartilhados)

---

## Pré-requisito

Verificar `ENV.md` antes de executar. Confirmar bundler em uso:

```bash
# Vite com @originjs/vite-plugin-federation
grep -r "vite-plugin-federation\|@module-federation" package.json

# Webpack com ModuleFederationPlugin
grep -r "ModuleFederationPlugin\|webpack" package.json
```

> **Nota de stack:** Os exemplos de código neste skill usam **Vite + @originjs/vite-plugin-federation**
> por ser a configuração mais comum em projetos novos. Se o projeto usa **Webpack**, os conceitos
> são idênticos — apenas a configuração do `ModuleFederationPlugin` muda.
> A seção "Criando um Remote" inclui referência para ambos os bundlers onde relevante.

---

## Árvore de Decisão

```
O que será feito?
├── Criar novo remote              → Seção: Criando um Remote
├── Configurar o shell             → Seção: Configurando o Shell
├── Definir contrato de interface  → Seção: Contratos de Interface
├── Gerenciar shared dependencies  → Seção: Shared Dependencies
├── Configurar monorepo            → Seção: Monorepo Frontend
├── Comunicação entre apps         → Seção: Event Bus
├── Deploy independente            → Seção: Estratégia de Deploy
└── Debug de problema              → Seção: Troubleshooting
```

---

## Criando um Remote

### Estrutura de um remote

```
apps/
└── {nome-remote}/
    ├── src/
    │   ├── bootstrap.ts        ← entry point async (necessário para Module Federation)
    │   ├── index.ts            ← importa e executa bootstrap
    │   ├── App.tsx             ← root do remote (para modo standalone)
    │   ├── routes/             ← rotas do remote
    │   ├── components/         ← componentes locais do remote
    │   └── exposed/            ← o que será exposto via Module Federation
    │       ├── index.ts        ← re-exporta tudo que é público
    │       └── RemoteApp.tsx   ← componente raiz exposto ao shell
    ├── vite.config.ts          ← ou webpack.config.ts
    ├── package.json
    └── tsconfig.json
```

### Por que `bootstrap.ts` é obrigatório?

```typescript
// src/index.ts — entry point síncrono
import('./bootstrap')  // import() dinâmico é necessário para Module Federation funcionar

// src/bootstrap.ts — inicialização real
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

> Sem o `bootstrap.ts`, o eager consumption de shared libs causa erro em runtime.

### Configuração Vite (vite-plugin-federation)

```typescript
// vite.config.ts do remote
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: '{nome-remote}',        // identificador único do remote
      filename: 'remoteEntry.js',   // arquivo gerado
      exposes: {
        './App': './src/exposed/RemoteApp',   // o que o shell pode importar
        './routes': './src/exposed/routes',   // rotas para shell carregar
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
        'react-router-dom': { singleton: true },
        // design system — sempre singleton para evitar instâncias duplicadas
        '@{org}/design-system': { singleton: true },
      },
    }),
  ],
  build: {
    target: 'esnext',
    minify: false,       // facilita debug; ativar em prod via CI flag
    cssCodeSplit: false, // evita problemas com CSS em remotes
  },
})
```

### Modo standalone (obrigatório para dev local)

```typescript
// src/App.tsx — funciona sem shell
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes'

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
```

```json
// package.json do remote
{
  "scripts": {
    "dev": "vite --port 3001",          // standalone
    "dev:federated": "vite --port 3001 --mode federated",  // com Module Federation ativo
    "build": "vite build",
    "preview": "vite preview --port 3001"
  }
}
```

---

## Configurando o Shell

```typescript
// vite.config.ts do shell
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shell',
      remotes: {
        '{nome-remote}': 'http://localhost:3001/assets/remoteEntry.js',
        // Em produção, usar variável de ambiente:
        // '{nome-remote}': process.env.VITE_REMOTE_URL_NOME_REMOTE,
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        'react-router-dom': { singleton: true },
        '@{org}/design-system': { singleton: true },
      },
    }),
  ],
})
```

### Lazy loading de remotes no shell

```typescript
// src/routes/index.tsx — shell monta remotes por rota
import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

// Tipagem do remote (importar do contrato de interface)
const RemoteApp = lazy(() =>
  import('{nome-remote}/App').then((m) => ({ default: m.default }))
)

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert">
      <p>Falha ao carregar módulo. <button onClick={() => window.location.reload()}>Tentar novamente</button></p>
    </div>
  )
}

export function ShellRoutes() {
  return (
    <Routes>
      <Route
        path="/{caminho-remote}/*"
        element={
          <Suspense fallback={<div>Carregando...</div>}>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <RemoteApp />
            </ErrorBoundary>
          </Suspense>
        }
      />
    </Routes>
  )
}
```

---

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

## Event Bus

Remote e shell se comunicam via evento — nunca via import direto.

```typescript
// packages/mfe-contracts/src/event-bus.ts

type EventHandler<T> = (payload: T) => void

class MFEEventBus {
  private listeners = new Map<string, Set<EventHandler<unknown>>>()

  emit<T>(event: string, payload: T): void {
    this.listeners.get(event)?.forEach((handler) => handler(payload as unknown))
  }

  on<T>(event: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler as EventHandler<unknown>)

    // retorna função de cleanup
    return () => this.listeners.get(event)?.delete(handler as EventHandler<unknown>)
  }
}

// Singleton global — compartilhado via shell context
export const eventBus = new MFEEventBus()
```

```typescript
// Uso em um remote
import { useShellContext } from '@{org}/mfe-contracts'

function CheckoutButton({ orderId }: { orderId: string }) {
  const { eventBus } = useShellContext()

  return (
    <button onClick={() => eventBus.emit('checkout:initiated', { orderId })}>
      Finalizar compra
    </button>
  )
}

// Uso no shell — escutar eventos de remotes
useEffect(() => {
  const unsubscribe = eventBus.on('checkout:initiated', ({ orderId }) => {
    navigate(`/checkout/${orderId}`)
  })
  return unsubscribe
}, [])
```

---

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

## Checklist de Novo Remote

- [ ] `bootstrap.ts` com import dinâmico
- [ ] Funciona em modo standalone (`npm run dev`)
- [ ] `exposed/` contém apenas a API pública
- [ ] Contrato de interface criado em `mfe-contracts`
- [ ] Shared dependencies declaradas com `singleton: true` e `requiredVersion`
- [ ] ErrorBoundary no ponto de montagem do shell
- [ ] Testes de integração com shell (ao menos smoke test)
- [ ] URL de deploy configurada via variável de ambiente
- [ ] Breaking changes documentadas e comunicadas ao time do shell

---

## Regras

### Nunca
- Importar diretamente de outro remote (rompe isolamento e cria acoplamento)
- Compartilhar estado via módulo — usar event bus ou props via shell
- Deploy do shell acoplado ao deploy de um remote (derrota o propósito)
- `eager: true` em shared libs (causa erro de bootstrap)
- Hardcodar URL do remoteEntry (sempre via variável de ambiente)

### Sempre
- Cada remote funciona standalone para desenvolvimento local
- Contratos de interface em TypeScript antes de integrar ao shell
- `singleton: true` para React, React DOM, React Router e design system
- ErrorBoundary no shell ao montar cada remote
- Versionar breaking changes no contrato com semver

---

## Output

| Artefato | Descrição |
|----------|-----------|
| Configuração Module Federation | `vite.config.ts` ou `webpack.config.ts` do remote e/ou shell |
| Contrato de interface | Types em `mfe-contracts` |
| Ponto de montagem | Lazy import + ErrorBoundary no shell |
| Event bus | Tipos de eventos e usage examples |
| Pipeline CI | Configuração de build/deploy independente |

---

## Mensagem de Conclusão

```
Micro Frontend configurado!

Remote: {nome}
Expõe: {lista do exposed}
Contrato: {arquivo de tipos criado}
Shared deps: {lista das dependências compartilhadas}
Standalone: {porta de dev local}

Próximo passo: {integrar ao shell | definir contrato | configurar CI}
```
