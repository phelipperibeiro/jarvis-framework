# Storybook

> Parte do skill `eng-frontend-design-system`. Leia este arquivo quando a tarefa envolver stories ou a configuração do Storybook.

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
