# Sistema de Tokens

> Parte do skill `eng-frontend-design-system`. Leia este arquivo quando a tarefa envolver tokens (primitivos, semânticos, Tailwind).

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
