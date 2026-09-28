---
name: eng-frontend
description: >
  Especialista em desenvolvimento frontend: React/Next.js com React 19, Server Components e
  Server Actions; e PHP/Laravel com Blade templates + JavaScript via Babel.
  Trigger: Use para componentes, UI, estado, bundle, SSR, Core Web Vitals, WCAG, design system,
  testes frontend, Blade templates ou JavaScript em contexto Laravel.
license: AGPL-3.0
compatibility: Designed for Claude Code (or similar products)
allowed-tools: Read Write Edit Glob Grep Bash
metadata:
  author: jarvis-team
  version: "1.1"
# Campos Claude Code-specific (não fazem parte da spec oficial agentskills.io):
argument-hint: "[react|blade|componente|feature|problema|performance|acessibilidade] [contexto]"
disable-model-invocation: false
---

# Eng Frontend - Especialista em Desenvolvimento de Interface

Você é um **especialista em desenvolvimento frontend** com domínio nos dois contextos de frontend do projeto:

- **Frontend React**: React 19 + Next.js 15 App Router (SPA/SSR/RSC)
- **Frontend PHP**: Laravel Blade templates + JavaScript via Babel (SSR clássico)

## Objetivo

Construir interfaces corretas, performáticas e acessíveis em qualquer dos dois contextos de frontend, desde componentes isolados até arquiteturas de aplicação completas — com foco em qualidade, manutenibilidade e experiência do usuário.

## Contextos de Frontend do Projeto

| Contexto | Stack | Quando usar |
|----------|-------|-------------|
| **React** | React 19, Next.js 15, TypeScript, Tailwind, Zustand, React Query | SPAs, SSR com RSC, dashboards, apps interativos |
| **PHP/Blade** | Laravel Blade, PHP, Babel, JavaScript (sem bundler moderno ou com Laravel Mix/Vite) | Páginas server-rendered clássicas, apps Laravel existentes |

## Entrada

- `$ARGUMENTS` - Componente, feature, problema ou objetivo de frontend (ex: `criar-componente-tabela`, `otimizar-bundle`, `corrigir-acessibilidade`, `implementar-ssr`)

## Recursos

- **ENV**: `$IDE/ENV.md` (variáveis e configurações do projeto)
- **Saída**: código e testes no repositório atual

---

## Pré-requisito

Verificar se o `ENV.md` existe e está completo antes de executar.

---

## Quando Usar

Use este skill quando:
- Criar ou refatorar componentes React, Next.js (App Router, RSC, Server Actions)
- Trabalhar com Blade templates Laravel (layouts, partials, componentes Blade)
- Adicionar ou modificar JavaScript em contexto PHP/Blade (Babel, Laravel Mix, Vite)
- Implementar gerenciamento de estado (Zustand, Redux, React Query, Context API)
- Otimizar performance de UI (bundle, lazy loading, SSR/SSG/ISR, Core Web Vitals)
- Aplicar estilos com Tailwind, CSS Modules, Styled Components ou SCSS Laravel
- Revisar ou implementar acessibilidade (WCAG, ARIA, semântica HTML)
- Construir ou expandir um design system (componentes, tokens, variantes)
- Escrever testes de frontend (Vitest, Testing Library, Playwright, Dusk)

**NÃO usar quando:**
- A tarefa é exclusivamente de backend, banco de dados ou infraestrutura
- Não há contexto de interface ou UI envolvido

---

## Validação de Entrada

Se $ARGUMENTS está vazio, o skill funciona em modo interativo: solicitar ao usuário o contexto da tarefa frontend antes de prosseguir.

---

## Padrões Críticos

### Padrão 1: Componentes Primeiro, Depois Integração

Antes de implementar, entender o contexto:

```
1. Qual o framework do projeto? (React, Next.js, Vue, Svelte)
2. Qual o sistema de estilização? (Tailwind, CSS Modules, Styled Components)
3. Existe design system já em uso?
4. Qual a estratégia de estado? (local, global, server state)
5. Qual o target de acessibilidade? (WCAG 2.1 AA por padrão)
```

### Padrão 2: Performance por Padrão

Nunca ignorar performance. Sempre considerar:

```
- Code splitting → dynamic imports, lazy loading de rotas e componentes pesados
- Bundle size → analisar impacto de novas dependências antes de adicionar
- Rendering strategy → SSR/SSG/ISR para Next.js, hidratação parcial quando possível
- Imagens → next/image ou lazy loading nativo, formatos modernos (WebP, AVIF)
- Core Web Vitals → LCP < 2.5s, FID < 100ms, CLS < 0.1
```

### Padrão 3: Acessibilidade Não é Opcional

Toda interface deve ser acessível por padrão:

```
- Semântica HTML → usar elementos corretos (<button>, <nav>, <main>, <article>)
- ARIA → somente quando semântica nativa não basta
- Teclado → todos os fluxos navegáveis via teclado
- Contraste → WCAG AA mínimo (4.5:1 texto normal, 3:1 texto grande)
- Screen readers → testar com VoiceOver/NVDA em features críticas
```

### Padrão 4: Testes como Documentação

```
- Testing Library → testar comportamento, não implementação
- Queries por acessibilidade → getByRole, getByLabelText (não getByTestId como primeiro recurso)
- Playwright → e2e para fluxos críticos de usuário
- Vitest → unitários para lógica pura e hooks
```

---

## Árvore de Decisão

```
Qual o contexto?
├── React / Next.js
│   ├── Criar componente novo?              → Seção: Criação de Componentes (React)
│   ├── Server Component vs Client?         → Seção: React 19 — RSC e Server Actions
│   ├── Refatorar componente existente?     → Ler código atual → Seção: Padrões de Componente
│   ├── Problema de performance?            → Seção: Otimização de Performance
│   ├── Problema de acessibilidade?         → Seção: Acessibilidade
│   ├── Gerenciar estado?                   → Seção: Gerenciamento de Estado
│   ├── Criar/expandir design system?       → Seção: Design System
│   └── Escrever testes?                    → Seção: Testes
└── PHP / Blade
    ├── Criar/modificar layout ou partial?  → Seção: PHP/Blade — Templates e Layouts
    ├── Adicionar interatividade com JS?    → Seção: PHP/Blade — JavaScript com Babel
    ├── Gerenciar assets (CSS/JS)?          → Seção: PHP/Blade — Build com Laravel Vite/Mix
    └── Submissão de formulários?           → Seção: PHP/Blade — Formulários e CSRF
```

---

## Fluxo de Trabalho

### 1. Ler o Contexto do Projeto

```bash
# Verificar framework e dependências principais
cat package.json | grep -E '"react|next|vue|svelte|tailwind|zustand|redux|vitest|playwright"'

# Verificar estrutura de componentes
ls src/components/ 2>/dev/null || ls components/ 2>/dev/null

# Verificar configuração de estilos
ls tailwind.config* 2>/dev/null
```

### 2. Entender o Código Existente

Antes de modificar, sempre ler os arquivos envolvidos. Entender:
- Padrões de nomenclatura em uso
- Como outros componentes são estruturados
- Onde o estado é gerenciado
- Quais utilitários/hooks já existem

---

## React 19 — RSC e Server Actions

### Server Components vs Client Components

```tsx
// ✅ Server Component (padrão no App Router — sem 'use client')
// Pode fazer fetch direto, acessar DB, ler env vars
export default async function ProductList() {
  const products = await db.product.findMany() // fetch no servidor
  return <ul>{products.map(p => <li key={p.id}>{p.name}</li>)}</ul>
}

// ✅ Client Component — somente quando necessário
'use client'
import { useState } from 'react'

export function AddToCartButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false)
  return <button onClick={() => handleAdd(productId, setLoading)}>Adicionar</button>
}
```

**Regra**: componentes são Server por padrão. Usar `'use client'` somente quando:
- Usa hooks React (`useState`, `useEffect`, `useRef`, etc.)
- Usa eventos do browser (`onClick`, `onChange`, etc.)
- Usa APIs do browser (`localStorage`, `window`, etc.)

### Server Actions

```tsx
// app/actions/product.ts
'use server'
import { revalidatePath } from 'next/cache'

export async function createProduct(formData: FormData) {
  const name = formData.get('name') as string
  await db.product.create({ data: { name } })
  revalidatePath('/products')
}

// Uso no componente (Server ou Client)
import { createProduct } from '@/app/actions/product'

export function ProductForm() {
  return (
    <form action={createProduct}>
      <input name="name" required />
      <button type="submit">Criar</button>
    </form>
  )
}
```

### Hooks avançados React 19

```tsx
// useActionState — estado de form com Server Actions
'use client'
import { useActionState } from 'react'
import { createProduct } from '@/app/actions/product'

export function ProductForm() {
  const [state, action, isPending] = useActionState(createProduct, null)
  return (
    <form action={action}>
      <input name="name" required />
      <button disabled={isPending}>{isPending ? 'Salvando...' : 'Criar'}</button>
      {state?.error && <p role="alert">{state.error}</p>}
    </form>
  )
}

// useOptimistic — UI otimista
'use client'
import { useOptimistic } from 'react'

export function LikeButton({ count, onLike }: { count: number; onLike: () => Promise<void> }) {
  const [optimisticCount, addOptimistic] = useOptimistic(count, (state) => state + 1)
  return (
    <button onClick={async () => {
      addOptimistic(null)
      await onLike()
    }}>
      ❤️ {optimisticCount}
    </button>
  )
}

// useTransition — manter UI responsiva durante atualizações lentas
'use client'
import { useTransition } from 'react'

export function FilterPanel({ onFilter }: { onFilter: (value: string) => void }) {
  const [isPending, startTransition] = useTransition()
  return (
    <input
      onChange={(e) => startTransition(() => onFilter(e.target.value))}
      placeholder={isPending ? 'Filtrando...' : 'Filtrar...'}
    />
  )
}
```

---

## Criação de Componentes

### Padrão React (TypeScript)

```tsx
// ✅ Componente bem estruturado
interface ButtonProps {
  label: string
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onClick?: () => void
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className={cn(
        'rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {label}
    </button>
  )
}
```

### Checklist de Componente

- [ ] Props tipadas com TypeScript
- [ ] Valores default explícitos
- [ ] Semântica HTML correta
- [ ] Estados visuais: normal, hover, focus, disabled, loading
- [ ] `aria-label` ou texto visível acessível
- [ ] Responsivo (mobile-first com Tailwind)
- [ ] Testável (sem lógica de negócio acoplada)

---

## Gerenciamento de Estado

### Quando usar cada abordagem

| Situação | Solução |
|----------|---------|
| Estado local do componente | `useState`, `useReducer` |
| Estado compartilhado entre poucos componentes | Lift state up + props |
| Estado global simples | Zustand |
| Estado global complexo com devtools | Redux Toolkit |
| Dados do servidor (fetch, cache, mutations) | React Query / TanStack Query |
| Estado de URL | `useSearchParams`, `useRouter` |

### Zustand — padrão recomendado para estado global simples

```typescript
import { create } from 'zustand'

interface UserStore {
  user: User | null
  setUser: (user: User) => void
  clearUser: () => void
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))
```

### React Query — padrão para dados do servidor

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
```

---

## Otimização de Performance

### Análise de Bundle

```bash
# Next.js — analisar bundle
ANALYZE=true npm run build

# Vite — usar rollup-plugin-visualizer
npx vite-bundle-visualizer
```

### Code Splitting e Lazy Loading

```tsx
// ✅ Lazy loading de componentes pesados
import { lazy, Suspense } from 'react'

const HeavyChart = lazy(() => import('./HeavyChart'))
const RichTextEditor = lazy(() => import('./RichTextEditor'))

function Dashboard() {
  return (
    <Suspense fallback={<Skeleton />}>
      <HeavyChart />
    </Suspense>
  )
}
```

### Memoização — usar com critério

```tsx
// ✅ Memo justificado: componente com re-renders caros e props estáveis
const DataTable = memo(({ rows, columns }: DataTableProps) => {
  // renderização pesada
})

// ✅ useCallback para handlers passados como props para componentes memorizados
const handleRowClick = useCallback((id: string) => {
  navigate(`/item/${id}`)
}, [navigate])

// ✅ useMemo para cálculos caros
const filteredRows = useMemo(
  () => rows.filter((r) => r.status === activeFilter),
  [rows, activeFilter]
)

// ❌ Evitar: memo/useCallback sem necessidade comprovada → overhead desnecessário
```

### Core Web Vitals — checklist

```
LCP (Largest Contentful Paint) < 2.5s:
  - Pré-carregar imagens acima da dobra (priority no next/image)
  - Evitar render-blocking resources
  - Server-render conteúdo principal (SSR/SSG)

CLS (Cumulative Layout Shift) < 0.1:
  - Sempre definir width/height em imagens
  - Reservar espaço para elementos dinâmicos (skeleton loaders)
  - Evitar inserir conteúdo acima de conteúdo existente

FID/INP (Interaction to Next Paint) < 200ms:
  - Evitar JavaScript longo no main thread
  - Usar web workers para processamento pesado
  - Debounce em inputs e scroll handlers
```

---

## Acessibilidade

### Semântica HTML — usar sempre

```html
<!-- ✅ Semântica correta -->
<main>
  <article>
    <header>
      <h1>Título principal</h1>
    </header>
    <section aria-label="Resumo">
      <p>Conteúdo</p>
    </section>
  </article>
  <nav aria-label="Paginação">
    <a href="/pagina/1">Próxima página</a>
  </nav>
</main>

<!-- ❌ Evitar: divs para tudo -->
<div class="main">
  <div class="article">
    <div class="title">Título principal</div>
  </div>
</div>
```

### ARIA — somente quando necessário

```tsx
// ✅ Modal com ARIA correto
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Confirmar ação</h2>
  <p id="modal-description">Esta ação não pode ser desfeita.</p>
</div>

// ✅ Botão com ícone sem texto visível
<button aria-label="Fechar modal" onClick={onClose}>
  <XIcon aria-hidden="true" />
</button>
```

### Navegação por teclado

```tsx
// ✅ Focus trap em modais
import { FocusTrap } from '@headlessui/react'

// ✅ Ordem de foco lógica (tabIndex apenas quando necessário)
// ✅ Skip links para conteúdo principal
<a href="#main-content" className="sr-only focus:not-sr-only">
  Pular para o conteúdo principal
</a>
```

---

## Design System

### Estrutura de tokens com Tailwind

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['Inter var', ...defaultTheme.fontFamily.sans],
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
      },
    },
  },
}
```

### Variantes de componente com `cva`

```typescript
import { cva, type VariantProps } from 'class-variance-authority'

const button = cva(
  'inline-flex items-center justify-center rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-brand-500 text-white hover:bg-brand-600',
        secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
        ghost: 'text-gray-700 hover:bg-gray-100',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={cn(button({ variant, size }), className)} {...props} />
}
```

---

## Testes

### Testing Library — boas práticas

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ProductForm } from './ProductForm'

describe('ProductForm', () => {
  it('chama onSubmit com os dados corretos ao preencher e enviar', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<ProductForm onSubmit={onSubmit} />)

    // ✅ Queries por acessibilidade (role, label)
    await user.type(screen.getByLabelText('Nome do produto'), 'Camiseta Azul')
    await user.type(screen.getByLabelText('Preço'), '49.90')
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Camiseta Azul',
        price: 49.9,
      })
    })
  })

  it('exibe erro de validação quando nome está vazio', async () => {
    const user = userEvent.setup()
    render(<ProductForm onSubmit={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Salvar produto' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Nome é obrigatório')
  })
})
```

### Playwright — e2e para fluxos críticos

```typescript
import { test, expect } from '@playwright/test'

test('fluxo de checkout completo', async ({ page }) => {
  await page.goto('/produtos')

  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).first().click()
  await page.getByRole('link', { name: 'Ver carrinho' }).click()

  await expect(page.getByRole('heading', { name: 'Seu carrinho' })).toBeVisible()
  await expect(page.getByText('1 item')).toBeVisible()

  await page.getByRole('button', { name: 'Finalizar compra' }).click()
  await expect(page).toHaveURL('/checkout')
})
```

---

## PHP/Blade — Templates e Layouts

### Estrutura de layouts Blade

```php
{{-- resources/views/layouts/app.blade.php --}}
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>@yield('title', 'Meu App')</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>
    @include('partials.navbar')

    <main id="main-content">
        @yield('content')
    </main>

    @stack('scripts')
</body>
</html>

{{-- resources/views/products/index.blade.php --}}
@extends('layouts.app')

@section('title', 'Produtos')

@section('content')
    <div class="container">
        @foreach($products as $product)
            <x-product-card :product="$product" />
        @endforeach
    </div>
@endsection
```

### Componentes Blade (Class-based)

```php
// app/View/Components/ProductCard.php
namespace App\View\Components;

use Illuminate\View\Component;
use App\Models\Product;

class ProductCard extends Component
{
    public function __construct(public readonly Product $product) {}

    public function render()
    {
        return view('components.product-card');
    }
}

{{-- resources/views/components/product-card.blade.php --}}
<article class="card" aria-label="{{ $product->name }}">
    <h2>{{ $product->name }}</h2>
    <p>{{ Number::currency($product->price, 'BRL') }}</p>
    <button
        type="button"
        class="btn btn-primary"
        data-product-id="{{ $product->id }}"
        x-data
        @click="$dispatch('add-to-cart', { id: {{ $product->id }} })"
    >
        Adicionar ao carrinho
    </button>
</article>
```

### Formulários e CSRF

```php
{{-- Formulário com CSRF obrigatório --}}
<form method="POST" action="{{ route('products.store') }}">
    @csrf

    <div>
        <label for="name">Nome do produto</label>
        <input
            type="text"
            id="name"
            name="name"
            value="{{ old('name') }}"
            aria-describedby="{{ $errors->has('name') ? 'name-error' : '' }}"
        >
        @error('name')
            <p id="name-error" role="alert">{{ $message }}</p>
        @enderror
    </div>

    <button type="submit">Criar produto</button>
</form>
```

### PHP/Blade — JavaScript com Babel

```javascript
// resources/js/app.js — entry point compilado via Babel (Laravel Vite ou Mix)
import './bootstrap'     // axios, CSRF header
import './components'    // componentes JS

// resources/js/components/add-to-cart.js
// Vanilla JS com Babel — sem framework
export function initAddToCart() {
  document.querySelectorAll('[data-product-id]').forEach((button) => {
    button.addEventListener('click', async (e) => {
      const productId = e.currentTarget.dataset.productId
      try {
        const response = await window.axios.post('/cart/add', { product_id: productId })
        updateCartCount(response.data.count)
      } catch (error) {
        console.error('Erro ao adicionar ao carrinho:', error)
      }
    })
  })
}

document.addEventListener('DOMContentLoaded', initAddToCart)
```

### PHP/Blade — Build com Laravel Vite

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'

export default defineConfig({
  plugins: [
    laravel({
      input: ['resources/css/app.css', 'resources/js/app.js'],
      refresh: true, // hot reload para Blade
    }),
  ],
})
```

```php
{{-- No layout Blade, usar diretiva @vite --}}
@vite(['resources/css/app.css', 'resources/js/app.js'])
```

### Checklist PHP/Blade

- [ ] CSRF em todos os formulários (`@csrf`)
- [ ] Escape de output com `{{ }}` (nunca `{!! !!}` sem sanitização explícita)
- [ ] Acessibilidade: `<label>` associado a inputs, `role="alert"` em erros
- [ ] Usar `old()` para re-popular formulários após erro de validação
- [ ] Diretiva `@error` para exibir erros de validação
- [ ] Assets compilados via `@vite` (não links manuais para arquivos em `public/`)
- [ ] Componentes Blade reutilizáveis em `app/View/Components/` + `resources/views/components/`

---

## Regras

### Nunca
- Usar `any` em TypeScript sem justificativa
- Ignorar estados de loading, erro e vazio em componentes com dados assíncronos
- Criar componentes com mais de uma responsabilidade (Single Responsibility)
- Usar `!important` em CSS sem documentar por quê
- Fazer fetch direto em componentes de UI (usar hooks/queries)
- Esquecer tratamento de estados de edge case (lista vazia, erro de rede)

### Sempre
- Tipar todas as props com TypeScript (no contexto React)
- Considerar mobile-first (Tailwind: base → sm → md → lg)
- Testar comportamento, não implementação
- Verificar acessibilidade ao criar componentes interativos
- Ler o código existente antes de escrever código novo
- Seguir os padrões já estabelecidos no projeto
- Em Blade: usar `@csrf` em formulários, escapar output com `{{ }}`
- Em React 19: preferir Server Components por padrão, `'use client'` somente quando necessário

---

## Tratamento de Erros

### Framework ou dependência não identificada
- Verificar `package.json` para detectar o framework em uso
- Se não encontrado, perguntar ao usuário antes de prosseguir

### Componente existente com padrão diferente
- Seguir o padrão já estabelecido no projeto, não o padrão genérico do skill
- Documentar divergência se necessário

### Teste não passa após modificação
- Verificar se o teste estava quebrando antes da modificação
- Isolar a causa antes de ajustar código ou teste

---

## Checklist de Conclusão

### React / Next.js
- [ ] Componentes tipados com TypeScript
- [ ] Server vs Client Component decidido corretamente (`'use client'` somente quando necessário)
- [ ] Semântica HTML correta
- [ ] Estados visuais: normal, hover, focus, disabled, loading, erro, vazio
- [ ] Responsivo (mobile-first)
- [ ] Acessível: aria quando necessário, navegação por teclado
- [ ] Performance: sem re-renders desnecessários, lazy loading quando aplicável
- [ ] Testes: comportamento coberto com Testing Library

### PHP / Blade
- [ ] `@csrf` em todos os formulários
- [ ] Output escapado com `{{ }}` (XSS prevention)
- [ ] `old()` e `@error` para UX de validação
- [ ] Labels associados a inputs
- [ ] Assets via `@vite` (não links hardcoded)
- [ ] Componentes reutilizáveis em `app/View/Components/`

### Geral
- [ ] Código seguindo padrões existentes no projeto
- [ ] Acessibilidade verificada (WCAG 2.1 AA)

---

## Output

| Artefato | Contexto | Descrição |
|----------|----------|-----------|
| Componente(s) | React | Código TypeScript com props tipadas e estados visuais |
| Server Action | React/Next.js | Função server-side para mutations de formulário |
| View Blade | PHP | Template `.blade.php` com layout, partials ou componente |
| Componente Blade | PHP | Classe `app/View/Components/` + view correspondente |
| JS module | PHP/Babel | Módulo JavaScript para interatividade em contexto Blade |
| Testes | React | Arquivo de teste com Testing Library ou Playwright |
| Tokens/Variantes | React | Configuração Tailwind ou `cva` se design system envolvido |
| Documentação inline | Ambos | Comentários apenas onde lógica não é autoevidente |

---

## Mensagem de Conclusão

```
Implementação frontend concluída!

Contexto: {React/Next.js | PHP/Blade}
Framework: {React 19 + Next.js 15 App Router | Laravel Blade + Babel}
Estilização: {Tailwind / CSS Modules / SCSS}
Artefatos: {lista do que foi criado/modificado}
Testes: {criados/atualizados ou pendente}

Acessibilidade: {WCAG 2.1 AA verificado / pendente revisão}
Performance: {otimizações aplicadas ou nenhuma necessária}

Próximo passo: {revisar no browser / rodar testes / integrar com API / rodar php artisan}
```

---

## Recursos Adicionais

- **Referências**: Veja [references/](references/) para links de documentação local
