# Criando um Remote

> Parte do skill `eng-frontend-microfrontend`. Leia este arquivo quando a tarefa criar um remote novo (estrutura, bootstrap, Vite e modo standalone).

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
