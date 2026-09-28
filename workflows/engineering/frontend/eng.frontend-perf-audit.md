---
name: eng.frontend-perf-audit
description: >
  Workflow de auditoria de performance frontend: Core Web Vitals, análise de bundle,
  rendering desnecessário e oportunidades de otimização em React e micro frontends.
author: jarvis-team
version: "1.0"

---

# Workflow: Auditoria de Performance Frontend

## Contexto

Use este workflow para investigar problemas de performance, auditar uma feature antes
do deploy ou planejar otimizações em uma aplicação React / micro frontend.

**Skill de referência**: `eng-frontend`

---

## Fase 1 — Coleta de Dados (antes de otimizar)

> Nunca otimizar sem medir primeiro. "Premature optimization is the root of all evil."

### 1.1 Medir Core Web Vitals em produção

```bash
# Lighthouse CLI — auditar URL de produção ou staging
npx lighthouse {URL} --output=json --output-path=./lighthouse-report.json --chrome-flags="--headless"

# Ver resumo rápido
npx lighthouse {URL} --output=text --only-categories=performance
```

**Targets:**

| Métrica | Meta | Aceitável | Problema |
|---------|------|-----------|---------|
| LCP | < 2.5s | 2.5s–4s | > 4s |
| CLS | < 0.1 | 0.1–0.25 | > 0.25 |
| INP | < 200ms | 200ms–500ms | > 500ms |
| FCP | < 1.8s | 1.8s–3s | > 3s |
| TTFB | < 800ms | 800ms–1.8s | > 1.8s |

### 1.2 Analisar bundle

```bash
# Next.js — bundle analyzer
ANALYZE=true npm run build
# Gera relatório visual em .next/analyze/

# Vite — rollup visualizer
npx vite-bundle-visualizer
# Ou instalar: npm i -D rollup-plugin-visualizer

# Verificar tamanho das chunks geradas
ls -lh dist/assets/*.js | sort -k5 -rh | head -20
```

### 1.3 Identificar re-renders desnecessários (React DevTools)

```
React DevTools → Profiler → Gravar → Executar ação → Analisar flame graph

Perguntas:
- Quais componentes renderizaram mais vezes?
- Qual o motivo do re-render (props, state, context)?
- Há componentes sem mudança visível re-renderizando em cascata?
```

---

## Fase 2 — Diagnóstico por Área

### 2.1 LCP alto (página carrega devagar)

**Causas comuns:**

```
1. Imagem principal sem priority/preload
2. Conteúdo principal renderizado no cliente (CSR puro) — usar SSR/SSG
3. Web font blocking render (font-display: swap ausente)
4. Server response lento (TTFB alto)
5. Render-blocking CSS/JS
```

**Ações de diagnóstico:**

```bash
# Verificar se imagem do LCP tem preload
grep -r "priority\|fetchpriority\|preload" src/ | grep -i "img\|image\|hero"

# Verificar se o conteúdo principal é SSR ou CSR
grep -r "'use client'" src/app/ | head -20
# Componentes 'use client' no app router não fazem SSR
```

### 2.2 CLS alto (layout shift)

**Causas comuns:**

```
1. Imagens sem width/height definidos
2. Fontes causando FOUT (Flash of Unstyled Text)
3. Conteúdo dinâmico inserido sem espaço reservado
4. Ads ou embeds sem dimensões fixas
5. Animações que afetam layout (margin, padding, top, left)
```

**Ações de diagnóstico:**

```bash
# Verificar imagens sem dimensões
grep -rn "<img\|<Image" src/ | grep -v "width\|height" | grep -v "fill"

# Verificar uso de layout shifts em CSS
grep -rn "position: absolute\|transform:" src/ | grep -v ".stories."
```

### 2.3 INP alto (interface travando)

**Causas comuns:**

```
1. Event handlers executando trabalho pesado no main thread
2. Sem debounce em inputs de busca/filtro
3. Listas longas sem virtualização
4. useEffect disparando trabalho pesado após interação
5. Third-party scripts bloqueando o main thread
```

**Ações:**

```bash
# Verificar inputs sem debounce
grep -n "onChange" src/ -r | grep -v "debounce\|useTransition\|startTransition"

# Verificar listas longas sem virtualização
grep -rn "\.map(" src/components/ | grep -i "list\|table\|grid" | head -20
```

### 2.4 Bundle grande

**Ações de diagnóstico:**

```bash
# Verificar dependências pesadas
cat package.json | grep -E "moment|lodash|date-fns|antd|material-ui|@mui"

# Verificar imports de bibliotecas completas (deve ser tree-shakeable)
grep -rn "import \* as\|import {.*} from 'lodash'" src/

# Verificar chunks geradas
# Chunk > 500KB merece investigação
# Chunk > 1MB é problema
```

---

## Fase 3 — Otimizações por Categoria

### 3.1 Imagens

```tsx
// ✅ Next.js — sempre usar next/image
import Image from 'next/image'

<Image
  src="/hero.webp"
  alt="Descrição da imagem"
  width={1200}
  height={600}
  priority          // obrigatório para imagem LCP (above the fold)
  sizes="(max-width: 768px) 100vw, 1200px"
/>

// ✅ Fill mode para imagens em containers flexíveis
<div className="relative h-64 w-full">
  <Image src="..." alt="..." fill className="object-cover" />
</div>
```

### 3.2 Code Splitting

```tsx
// ✅ Lazy loading para componentes pesados ou raramente usados
import { lazy, Suspense } from 'react'

const HeavyChart = lazy(() => import('./HeavyChart'))
const RichEditor = lazy(() => import('./RichEditor'))
const AdminPanel = lazy(() => import('./AdminPanel'))

// ✅ Suspense com fallback adequado (evita CLS)
<Suspense fallback={<Skeleton className="h-64 w-full" />}>
  <HeavyChart data={data} />
</Suspense>
```

### 3.3 Renderização (Server vs Client)

```tsx
// ✅ Dado estático/semi-estático → Server Component
// Sem 'use client' → renderiza no servidor
export default async function ProductList() {
  const products = await getProducts()  // fetch no servidor
  return <ul>{products.map(p => <ProductCard key={p.id} product={p} />)}</ul>
}

// ✅ Interatividade mínima → isolar o Client Component
'use client'
export function AddToCartButton({ productId }: { productId: string }) {
  const [added, setAdded] = useState(false)
  // apenas este componente é Client — o resto da página é Server
}
```

### 3.4 Memoização (quando justificada)

```tsx
// ✅ memo: componente re-renderizando sem mudança nas props
// → confirmar no Profiler que o re-render é desnecessário ANTES de adicionar memo
const DataTable = memo(function DataTable({ rows }: { rows: Row[] }) {
  // renderização custosa
})

// ✅ useMemo: cálculo pesado que não precisa ser repetido
const filteredData = useMemo(
  () => data.filter(complexFilter).sort(complexSort),
  [data, complexFilter]  // recalcula só quando data ou filtro mudam
)

// ✅ useCallback: handler passado para componente memorizado
const handleSelect = useCallback((id: string) => {
  setSelected(id)
}, [])  // sem dependências que mudam a cada render

// ❌ Evitar memo/useMemo/useCallback sem necessidade comprovada
// → overhead de comparação pode ser maior que o re-render
```

### 3.5 Listas longas (virtualização)

```tsx
// ✅ Para listas > 100 itens — usar TanStack Virtual
import { useVirtualizer } from '@tanstack/react-virtual'

function LongList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,  // altura estimada de cada item
  })

  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }} className="relative">
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              transform: `translateY(${virtualItem.start}px)`,
              width: '100%',
            }}
          >
            <ItemRow item={items[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 3.6 Debounce em inputs

```tsx
// ✅ Busca com debounce — não dispara a cada keystroke
import { useDeferredValue, useTransition } from 'react'

// Opção 1: useDeferredValue (React 18+) — mantém UI responsiva
function SearchResults({ query }: { query: string }) {
  const deferredQuery = useDeferredValue(query)
  const results = useFilteredResults(deferredQuery)  // usa o valor atrasado
  return <ResultList items={results} />
}

// Opção 2: useTransition para marcar update como não urgente
'use client'
function SearchInput() {
  const [query, setQuery] = useState('')
  const [isPending, startTransition] = useTransition()

  return (
    <input
      onChange={(e) => {
        startTransition(() => setQuery(e.target.value))
      }}
      placeholder={isPending ? 'Buscando...' : 'Buscar...'}
    />
  )
}
```

---

## Fase 4 — Micro Frontend: Performance Específica

### 4.1 Shared dependencies duplicadas

```bash
# Verificar se React está sendo carregado mais de uma vez
# No Network DevTools: múltiplos react.js ou react-dom.js = problema

# Verificar configuração de singleton
grep -rn "singleton" apps/*/vite.config.ts apps/shell/vite.config.ts
# Todas as shared deps críticas devem ter singleton: true
```

### 4.2 Carregamento de remotes

```tsx
// ✅ Remotes carregados com lazy loading e Suspense
// → apenas o shell + remotes da rota atual carregam

// ✅ Prefetch de remotes prováveis (hover na nav)
const prefetchRemote = () => import('{remote}/App')

<nav>
  <Link
    to="/modulo"
    onMouseEnter={prefetchRemote}  // prefetch ao hover
  >
    Módulo
  </Link>
</nav>
```

---

## Fase 5 — Relatório de Auditoria

```markdown
## Auditoria de Performance Frontend — {app/feature}
**Data:** {data}
**URL auditada:** {URL}

### Core Web Vitals (antes)
| Métrica | Valor | Status |
|---------|-------|--------|
| LCP     | {x}s  | {ok/atenção/problema} |
| CLS     | {x}   | {ok/atenção/problema} |
| INP     | {x}ms | {ok/atenção/problema} |

### Problemas identificados
| # | Problema | Impacto | Esforço | Prioridade |
|---|----------|---------|---------|------------|
| 1 | {desc}   | {alto/médio/baixo} | {horas} | {P1/P2/P3} |

### Ações recomendadas (ordenadas por impacto/esforço)
1. {ação concreta — arquivo específico — ganho esperado}
2. ...

### Core Web Vitals (esperado após otimizações)
| Métrica | Antes | Esperado |
|---------|-------|---------|
| LCP     | {x}s  | {y}s    |

### Próximos passos
- [ ] {ação 1} — responsável: {quem}
- [ ] {ação 2}
```
