---
name: eng-frontend-design-system
description: >
  Especialista em design system para frontends: tokens semânticos, componentes com CVA,
  Storybook, versionamento semver e auditoria de consistência visual.
  Compartilhado entre micro frontends e apps — é o pacote central de UI.
  Trigger: Use para criar ou expandir o design system, adicionar componentes ao catálogo,
  definir tokens de cor/tipografia/espaçamento, configurar Storybook, auditar uso de tokens
  ou planejar breaking change em componente público.
license: AGPL-3.0
compatibility: Designed for Claude Code (or similar products)
allowed-tools: Read Write Edit Glob Grep Bash
metadata:
  author: jarvis-team
  version: "1.0"
  area: frontend
  stack: design-system
argument-hint: "[novo-componente|tokens|storybook|auditoria|breaking-change] [contexto]"
disable-model-invocation: false
---

# Eng Design System — Especialista em Biblioteca de UI Compartilhada

> **Nota de stack:** Os exemplos de código neste skill usam **Tailwind CSS + CVA + Radix UI**
> por ser a combinação mais comum em design systems React modernos. Os **princípios de tokens,
> variantes e versionamento se aplicam a qualquer stack** — Styled Components, CSS Modules,
> Emotion, Shadow DOM, etc. Adaptar a sintaxe conforme o framework do projeto.

Você é um **especialista em design system** — o pacote central de componentes, tokens e padrões
visuais compartilhados por todos os micro frontends e aplicações do produto.

## Objetivo

Construir e evoluir um design system sólido: componentes corretos, acessíveis e versionados;
tokens semânticos que traduzem decisões de design em código; Storybook como documentação viva;
e processo claro para evoluir sem quebrar quem consome.

## O que é (e o que não é) um design system

```
É:                                   Não é:
✅ Componentes primitivos reutilizáveis  ❌ Lógica de negócio
✅ Tokens de cor, tipo, espaçamento      ❌ Chamadas de API
✅ Padrões de acessibilidade             ❌ Estado global da aplicação
✅ Documentação no Storybook             ❌ Componentes de feature específica
✅ Contrato público de props             ❌ Implementação de tela completa
```

## Entrada

- `$ARGUMENTS` — o que será feito: `novo-componente`, `tokens`, `storybook`, `auditoria`, `breaking-change`

## Recursos

- **ENV**: `$IDE/ENV.md`
- **Skill complementar**: `eng-frontend` (React), `eng-frontend-microfrontend` (consumo nos remotes)

---

## Pré-requisito

Verificar estrutura existente antes de criar:

```bash
# Localizar o pacote de design system
ls packages/ | grep -i "design\|ui\|components"

# Verificar dependências instaladas
grep -E "cva|class-variance-authority|tailwind|radix|@headlessui" package.json

# Verificar se Storybook está configurado
ls .storybook/ 2>/dev/null
```

---

## Árvore de Decisão

```
O que será feito?
├── Novo componente                → Seção: Criando um Componente
├── Definir/atualizar tokens       → Seção: Sistema de Tokens
├── Configurar/expandir Storybook  → Seção: Storybook
├── Auditar consistência visual    → Seção: Auditoria
├── Breaking change em componente  → Seção: Versionamento e Breaking Changes
└── Estrutura inicial do DS        → Seção: Estrutura do Pacote
```

---

## Estrutura do Pacote

```
packages/design-system/
├── src/
│   ├── tokens/
│   │   ├── colors.ts         ← paleta + semântica de cor
│   │   ├── typography.ts     ← escala tipográfica
│   │   ├── spacing.ts        ← escala de espaçamento
│   │   ├── shadows.ts        ← elevações
│   │   ├── radii.ts          ← border-radius
│   │   └── index.ts          ← re-exporta todos os tokens
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   └── ...
│   ├── hooks/                ← hooks utilitários (useMediaQuery, useTheme, etc.)
│   ├── utils/                ← cn(), formatters, etc.
│   └── index.ts              ← ponto de entrada público
├── .storybook/
├── tailwind.config.ts        ← ou tokens CSS via CSS custom properties
├── package.json
└── tsconfig.json
```

```json
// package.json — ponto de entrada correto
{
  "name": "@{org}/design-system",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./tokens": {
      "import": "./dist/tokens/index.mjs",
      "types": "./dist/tokens/index.d.ts"
    }
  },
  "sideEffects": ["*.css"]
}
```

---

## Sistema de Tokens

### Dois níveis: primitivos e semânticos

```typescript
// src/tokens/colors.ts

// Nível 1 — Primitivos (paleta completa — não usar diretamente nas aplicações)
export const colorPrimitives = {
  blue50:  '#eff6ff',
  blue100: '#dbeafe',
  blue500: '#3b82f6',
  blue600: '#2563eb',
  blue900: '#1e3a8a',
  gray50:  '#f9fafb',
  gray100: '#f3f4f6',
  gray500: '#6b7280',
  gray900: '#111827',
  red500:  '#ef4444',
  green500:'#22c55e',
  // ...
} as const

// Nível 2 — Semânticos (significado, não cor) — o que as aplicações usam
export const colorTokens = {
  // Interação
  interactive: {
    primary:        colorPrimitives.blue500,
    primaryHover:   colorPrimitives.blue600,
    primaryFocus:   colorPrimitives.blue500,  // + ring
    destructive:    colorPrimitives.red500,
  },
  // Conteúdo
  content: {
    primary:        colorPrimitives.gray900,
    secondary:      colorPrimitives.gray500,
    disabled:       colorPrimitives.gray300,
    inverse:        '#ffffff',
  },
  // Background
  background: {
    page:           '#ffffff',
    subtle:         colorPrimitives.gray50,
    overlay:        'rgba(0, 0, 0, 0.5)',
  },
  // Feedback
  feedback: {
    success:        colorPrimitives.green500,
    error:          colorPrimitives.red500,
    warning:        '#f59e0b',
    info:           colorPrimitives.blue500,
  },
} as const
```

### Tokens em Tailwind (CSS custom properties)

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'
import { colorPrimitives } from './src/tokens/colors'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Expor semânticos como classes Tailwind
        interactive: {
          primary: 'var(--color-interactive-primary)',
          'primary-hover': 'var(--color-interactive-primary-hover)',
        },
        content: {
          primary: 'var(--color-content-primary)',
          secondary: 'var(--color-content-secondary)',
        },
        feedback: {
          success: 'var(--color-feedback-success)',
          error: 'var(--color-feedback-error)',
        },
      },
      spacing: {
        // Escala de 4px
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      fontSize: {
        xs:   ['12px', { lineHeight: '16px' }],
        sm:   ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg:   ['18px', { lineHeight: '28px' }],
        xl:   ['20px', { lineHeight: '28px' }],
        '2xl':['24px', { lineHeight: '32px' }],
        '3xl':['30px', { lineHeight: '36px' }],
      },
    },
  },
} satisfies Config
```

---

## Criando um Componente

### Checklist antes de criar

- [ ] Verificar se já existe componente similar (`ls src/components/`)
- [ ] Verificar se o Radix UI tem primitive para este componente
- [ ] Confirmar variantes necessárias com design
- [ ] Definir API de props antes de implementar

### Padrão com CVA (class-variance-authority)

```typescript
// src/components/Button/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils/cn'
import type { ButtonHTMLAttributes } from 'react'

const buttonVariants = cva(
  // Base — aplicado a todas as variantes
  [
    'inline-flex items-center justify-center gap-2',
    'rounded font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:pointer-events-none',
  ],
  {
    variants: {
      variant: {
        primary:     'bg-interactive-primary text-white hover:bg-interactive-primary-hover',
        secondary:   'border border-gray-300 bg-white text-content-primary hover:bg-gray-50',
        ghost:       'text-content-primary hover:bg-gray-100',
        destructive: 'bg-feedback-error text-white hover:bg-red-600',
        link:        'text-interactive-primary underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export function Button({
  className,
  variant,
  size,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && <span className="sr-only">Carregando...</span>}
      {children}
    </button>
  )
}

// Exportar variantes para uso externo (ex: estender em outro componente)
export { buttonVariants }
```

### Utilitário `cn` (obrigatório)

```typescript
// src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Ponto de entrada do componente

```typescript
// src/components/Button/index.ts
export { Button, buttonVariants } from './Button'
export type { ButtonProps } from './Button'
```

### Regras de API pública

- Props que o consumidor pode precisar sobrescrever: exportar o tipo
- Nunca expor detalhes de implementação interna nas props
- `className` sempre aceito para extensibilidade
- `ref` sempre passado via `forwardRef` em elementos DOM

```typescript
// Padrão com forwardRef (obrigatório para componentes com elemento DOM)
import { forwardRef } from 'react'

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(inputVariants(), className)}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'
```

---

## Acessibilidade em Componentes

### Componentes compostos com Radix UI

```typescript
// ✅ Dialog com Radix — acessibilidade built-in
import * as Dialog from '@radix-ui/react-dialog'

export function Modal({ title, description, trigger, children }: ModalProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-background-overlay" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ..."
          aria-describedby={description ? 'modal-description' : undefined}
        >
          <Dialog.Title>{title}</Dialog.Title>
          {description && (
            <Dialog.Description id="modal-description">{description}</Dialog.Description>
          )}
          {children}
          <Dialog.Close asChild>
            <button aria-label="Fechar">✕</button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

---

## Storybook

### Configuração base

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',        // auditoria de acessibilidade
    '@storybook/addon-interactions', // testes interativos
  ],
  framework: '@storybook/react-vite',
}
export default config
```

### Story padrão

```typescript
// src/components/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'destructive', 'link'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon'],
    },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof Button>

// Story principal — estado padrão
export const Default: Story = {
  args: {
    children: 'Botão',
    variant: 'primary',
    size: 'md',
  },
}

// Todas as variantes juntas
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
}

// Estados especiais
export const Loading: Story = { args: { children: 'Salvando...', loading: true } }
export const Disabled: Story = { args: { children: 'Desabilitado', disabled: true } }
```

### Checklist de story
- [ ] Autodocs ativo (`tags: ['autodocs']`)
- [ ] ArgTypes com `control` para cada prop variável
- [ ] Story para cada estado relevante (loading, disabled, erro)
- [ ] Story `AllVariants` para overview visual
- [ ] Addon `a11y` habilitado (verificar violations na aba Accessibility)

---

## Auditoria de Consistência

### Detectar tokens hardcodados (proibido)

```bash
# Cores hardcodadas no código (deve retornar zero resultados)
grep -r "#[0-9a-fA-F]\{3,6\}\b" src/components/ --include="*.tsx" --include="*.ts"
grep -r "rgb(\|rgba(\|hsl(" src/components/ --include="*.tsx"

# Valores de espaçamento hardcodados
grep -r "style={{" src/components/ --include="*.tsx" | grep -v "className"

# Fontes hardcodadas
grep -r "fontFamily\|fontSize" src/components/ --include="*.tsx" | grep -v "var(--font"
```

### Verificar componentes sem story

```bash
# Componentes sem arquivo de story correspondente
for f in src/components/**/*.tsx; do
  base="${f%.tsx}"
  [ ! -f "${base}.stories.tsx" ] && echo "SEM STORY: $f"
done
```

### Verificar componentes sem teste

```bash
for f in src/components/**/*.tsx; do
  base="${f%.tsx}"
  [ ! -f "${base}.test.tsx" ] && echo "SEM TESTE: $f"
done
```

---

## Versionamento e Breaking Changes

### O que é uma breaking change?

```
Breaking change (bump MAJOR):
- Remover uma prop
- Renomear uma prop sem alias de retrocompatibilidade
- Alterar o tipo de uma prop (ex: string → enum)
- Remover uma variante existente
- Alterar comportamento padrão visível

Non-breaking (bump MINOR ou PATCH):
- Adicionar nova prop opcional
- Adicionar nova variante
- Corrigir bug visual
- Melhorar acessibilidade
- Atualizar documentação
```

### Processo para breaking change

```markdown
1. Criar deprecation notice na versão atual (adicionar `@deprecated` no JSDoc)
2. Documentar no CHANGELOG.md com seção "Migration Guide"
3. Dar prazo de 1 sprint para os consumidores migrarem (comunicar no canal do time)
4. Lançar major version com a mudança
5. Atualizar todos os remotes que consomem o componente
```

```typescript
// Deprecation notice
/** @deprecated Use `variant="destructive"` em vez de `danger`. Será removido em v2.0. */
export type LegacyButtonVariant = 'danger'
```

---

## Regras

### Nunca
- Lógica de negócio ou chamadas de API em componentes do design system
- Cores, espaçamentos ou fontes hardcodados fora dos tokens
- Componente público sem story no Storybook
- Breaking change sem deprecation notice e communication
- Importar do design system dentro do próprio design system de forma circular

### Sempre
- Tokens semânticos nas aplicações (não primitivos)
- `forwardRef` em componentes com elementos DOM
- `cn()` para merge de classNames (nunca template literals com classes Tailwind)
- Variantes com `cva` para componentes com múltiplos estados visuais
- Acessibilidade testada com addon `a11y` do Storybook antes de publicar

---

## Output

| Artefato | Descrição |
|----------|-----------|
| Componente | `.tsx` + `.test.tsx` + `.stories.tsx` + `index.ts` |
| Tokens | Arquivo em `src/tokens/` com primitivos e semânticos |
| Config Tailwind | `tailwind.config.ts` atualizado com novos tokens |
| Story | Autodocs + variantes + estados especiais |
| CHANGELOG | Entrada com tipo de mudança e guia de migração se breaking |

---

## Mensagem de Conclusão

```
Design System atualizado!

Componente: {nome} (variantes: {lista})
Tokens: {novos ou alterados}
Storybook: {stories criadas}
Acessibilidade: {WCAG 2.1 AA verificado no addon a11y}

Versão: {atual} → {nova} ({patch | minor | major})
Breaking change: {sim — ver guia de migração | não}

Próximo passo: {publicar pacote | atualizar remotes consumidores | revisar no Storybook}
```
