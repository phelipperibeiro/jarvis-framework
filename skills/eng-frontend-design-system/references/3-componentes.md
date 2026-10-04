# Criando um Componente e Acessibilidade

> Parte do skill `eng-frontend-design-system`. Leia este arquivo quando a tarefa criar ou alterar um componente (CVA, API pública, acessibilidade, Radix UI).

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
