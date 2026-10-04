# Configurando o Shell

> Parte do skill `eng-frontend-microfrontend`. Leia este arquivo quando a tarefa configurar o shell ou o lazy loading de remotes.

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
