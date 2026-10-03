---
name: eng.frontend-component
description: >
  Workflow para criar ou refatorar um componente frontend com qualidade:
  análise de contexto, decisão design system vs local, implementação com
  acessibilidade e testes.
  Aplica-se a componentes React em micro frontends e no design system.
author: jarvis-team
version: "1.0"

---

# Workflow: Criar ou Refatorar Componente Frontend

## Contexto

Use este workflow para garantir que todo componente frontend seja criado com
qualidade, acessibilidade, testes e no lugar correto (design system vs remote).

**Skill de referência**: `eng-frontend`, `eng-frontend-design-system`

---

## Fase 1 — Análise

### 1.1 Entender o requisito

Antes de qualquer código, responder:

```
1. O componente será reutilizado em mais de um remote/app?
   → Sim → pertence ao design system (packages/design-system/)
   → Não → pertence ao remote (apps/{remote}/src/components/)

2. Existe componente similar já criado?
   → Verificar: ls packages/design-system/src/components/
   → Verificar: ls apps/{remote}/src/components/

3. Existe primitivo Radix UI para este componente?
   → Modal, Select, Dropdown, Tooltip, Checkbox → usar Radix como base

4. Quais variantes são necessárias?
   → Levantar com design antes de implementar

5. Qual o contexto React?
   → Server Component (Next.js App Router) ou Client Component?
   → Se usa hooks/eventos → Client Component ('use client')
```

### 1.2 Ler o código ao redor

```bash
# Verificar padrões em uso no projeto
ls packages/design-system/src/components/ 2>/dev/null || ls src/components/

# Ver como um componente similar está implementado
cat packages/design-system/src/components/{componente-similar}/

# Verificar configuração de tokens
cat packages/design-system/tailwind.config.ts 2>/dev/null
```

---

## Fase 2 — Implementação

### 2.1 Criar arquivos

Para componente no **design system**:
```
packages/design-system/src/components/{Nome}/
├── {Nome}.tsx
├── {Nome}.test.tsx
├── {Nome}.stories.tsx
└── index.ts
```

Para componente em **remote**:
```
apps/{remote}/src/components/{Nome}/
├── {Nome}.tsx
├── {Nome}.test.tsx
└── index.ts
```

### 2.2 Checklist de implementação

#### TypeScript
- [ ] Props tipadas — sem `any`
- [ ] Valores default explícitos para props opcionais
- [ ] `forwardRef` se o componente tem elemento DOM
- [ ] Exportar o tipo de props para uso externo

#### Tokens (design system)
- [ ] Cores via tokens semânticos — sem hardcode de hex/rgb
- [ ] Espaçamentos via escala do design system
- [ ] Variantes com `cva` se o componente tem múltiplos estados visuais

#### Acessibilidade
- [ ] Semântica HTML correta
- [ ] `aria-label` ou texto visível em elementos interativos sem texto
- [ ] Estados de focus visíveis (não remover outline)
- [ ] Navegação por teclado testada manualmente

#### Estados visuais
- [ ] Normal
- [ ] Hover
- [ ] Focus
- [ ] Disabled (se aplicável)
- [ ] Loading (se aplicável)
- [ ] Erro (se aplicável)
- [ ] Vazio (se aplicável, para listas/tabelas)

---

## Fase 3 — Testes

### 3.1 Testes com Testing Library

Focar em comportamento, não implementação:

```typescript
// ✅ Testar o que o usuário vê e faz
expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled()

// ❌ Não testar detalhes de implementação
expect(component.state.isLoading).toBe(true)
```

### Cobertura mínima obrigatória
- [ ] Renderização padrão (smoke test)
- [ ] Cada variante principal
- [ ] Estado de loading (se existir)
- [ ] Estado de erro (se existir)
- [ ] Interação principal (`click`, `change`, `submit`)
- [ ] Acessibilidade via `axe` (se addon configurado)

---

## Fase 4 — Story (apenas para design system)

### 4.1 Checklist de story

- [ ] `tags: ['autodocs']`
- [ ] `argTypes` com controles para cada prop variável
- [ ] Story para cada variante
- [ ] Story para estados especiais (loading, disabled, erro)
- [ ] Story `AllVariants` para overview visual
- [ ] Sem violations na aba `Accessibility` do Storybook

---

## Fase 5 — Integração

### 5.1 Exportar do ponto de entrada correto

**Design system:**
```typescript
// packages/design-system/src/index.ts
export { {Nome}, type {Nome}Props } from './components/{Nome}'
```

**Remote:**
```typescript
// apps/{remote}/src/components/index.ts (se existir barrel)
export { {Nome} } from './{Nome}'
```

### 5.2 Verificar responsividade

```bash
# Testar nos breakpoints do projeto
# mobile: 375px
# tablet: 768px
# desktop: 1280px
```

---

## Checklist Final

- [ ] Componente no lugar correto (design system vs remote)
- [ ] Props tipadas sem `any`
- [ ] Tokens do design system usados (sem hardcode)
- [ ] Estados visuais completos
- [ ] Acessibilidade: semântica + teclado + ARIA quando necessário
- [ ] Testes cobrindo comportamentos críticos
- [ ] Story criada (se design system)
- [ ] Exportado do index correto
- [ ] Responsivo nos breakpoints do projeto
