---
name: eng.frontend-rules
description: >
  Padrões obrigatórios para devs com HUB: FRONTEND — componentes, TypeScript,
  acessibilidade, performance, micro frontend e design system.
author: jarvis-team
version: "1.0"
---

> **Applies to:** HUB: FRONTEND | POSITION: all | AREA: ENGINEERING | SQUAD: all

# Regras de Engenharia Frontend

---

## 1. Componentes

### Estrutura obrigatória
- Todo componente deve ter props tipadas com TypeScript — `any` é proibido sem justificativa documentada
- Props obrigatórias devem ser declaradas sem `?`; opcionais com `?` e valor default explícito
- Componentes com mais de uma responsabilidade devem ser divididos (Single Responsibility)
- Lógica de negócio não pertence ao componente de UI — usar hooks ou camada de serviço

### Nomenclatura
- Componentes: `PascalCase` (`UserCard`, `ProductTable`)
- Hooks: `use` + `PascalCase` (`useUserData`, `useProductFilters`)
- Arquivos de componente: `PascalCase.tsx` (`UserCard.tsx`)
- Arquivos de hook: `camelCase.ts` (`useUserData.ts`)

### Checklist mínimo por componente
- [ ] Props tipadas (TypeScript)
- [ ] Estados visuais: normal, hover, focus, disabled, loading, erro, vazio
- [ ] Semântica HTML correta (não usar `<div>` para botões, links ou listas)
- [ ] Responsivo (mobile-first com breakpoints do design system)
- [ ] Testável sem DOM real (lógica isolada em hooks)

---

## 2. TypeScript

- `strict: true` obrigatório em `tsconfig.json`
- Proibido: `as any`, `@ts-ignore` sem comentário explicativo, `!` (non-null assertion) sem verificação prévia
- Types vs Interfaces: usar `interface` para objetos de domínio, `type` para uniões e utilitários
- Exportar tipos públicos de componentes (`export type { ButtonProps }`)

---

## 3. Acessibilidade (WCAG 2.1 AA — obrigatório)

- Semântica HTML nativa antes de ARIA (`<button>`, `<nav>`, `<main>`, `<article>`)
- Todos os elementos interativos são navegáveis por teclado
- Contraste mínimo: 4.5:1 para texto normal, 3:1 para texto grande e elementos UI
- Imagens informativas têm `alt` descritivo; decorativas têm `alt=""`
- Modais usam `role="dialog"`, `aria-modal="true"`, `aria-labelledby` e focus trap
- Formulários: todo `<input>` tem `<label>` associado via `htmlFor` ou `aria-label`
- Erros de formulário: exibidos com `role="alert"` ou `aria-live="polite"`
- Screen reader: testar com VoiceOver (Mac) ou NVDA (Windows) em features críticas

---

## 4. Performance

### Core Web Vitals — targets obrigatórios
- LCP (Largest Contentful Paint): < 2.5s
- CLS (Cumulative Layout Shift): < 0.1
- INP (Interaction to Next Paint): < 200ms

### Práticas obrigatórias
- Imagens sempre com `width` e `height` definidos para evitar CLS
- Componentes pesados com `lazy()` + `<Suspense fallback>`
- Dependências novas: avaliar impacto no bundle antes de instalar (`bundlephobia.com`)
- Sem `useEffect` para buscar dados — usar React Query / TanStack Query ou Server Components
- Memoização apenas quando necessário e comprovado com profiler (não premature optimization)

---

## 5. Testes

- **Testing Library**: queries por acessibilidade primeiro (`getByRole`, `getByLabelText`)
- **Proibido**: `getByTestId` como primeira opção (usar só quando sem alternativa acessível)
- **Cobertura mínima**: fluxos críticos de usuário (happy path + estado de erro)
- **Vitest**: unitários para lógica pura, hooks e utilitários
- **Playwright / Cypress**: E2E para fluxos de usuário completos (login, checkout, etc.)
- Mocks de módulos externos devem estar em `__mocks__/` ou `*.mock.ts`

### Ferramentas disponíveis no framework

- **TestSprite** (`/eng-qa-testsprite`): se o TestSprite estiver instalado no projeto, usá-lo para geração
  e execução de testes de componente e E2E — ele gera planos de teste e código automaticamente.
  Verificar: `ls node_modules/@testsprite 2>/dev/null || cat package.json | grep testsprite`

- **Stagehand** (`/eng-scraper-robot-builder`, `/eng-qa-e2e`): para testes E2E em linguagem natural
  ou automação de fluxos de usuário complexos, o Stagehand permite descrever o fluxo em português
  e gera os steps Playwright automaticamente.
  Verificar: `cat package.json | grep stagehand`

> Quando qualquer dessas ferramentas estiver disponível no projeto, **preferir sobre a implementação
> manual** — reduz custo de manutenção e aumenta cobertura mais rapidamente.

---

## 6. Micro Frontend

- Todo remote deve ser versionado e publicado com URL de fallback definida
- Contratos de interface entre shell e remotes são declarados em tipos TypeScript compartilhados
- Nenhum remote depende diretamente de outro remote — comunicação via shell ou event bus
- Shared dependencies declaradas explicitamente no `ModuleFederationPlugin` com `singleton: true`
- Cada remote deve funcionar em modo standalone (sem shell) para desenvolvimento local
- Testes de integração entre shell e remote são obrigatórios para cada ponto de montagem
- Versionamento: breaking changes no contrato de um remote exigem bump de versão major

---

## 7. Design System

- Cores, tipografia, espaçamentos e breakpoints vêm **exclusivamente** dos tokens do design system
- Proibido hardcodar valores de cor, fonte ou espaçamento fora dos tokens
- Novos componentes de UI são criados no design system antes de serem usados nos remotes
- Variantes de componente usam `cva` (class-variance-authority) como padrão
- Componentes públicos do design system têm story no Storybook antes de serem liberados
- Alterações na API pública de um componente (props) seguem semver

---

## 8. Code Review (Checklist do Reviewer)

Ao revisar PR de frontend, verificar:

- [ ] TypeScript sem `any` ou `@ts-ignore` injustificado
- [ ] Nenhuma lógica de negócio em componente de UI
- [ ] Acessibilidade: semântica HTML, ARIA correto, navegação por teclado
- [ ] Performance: sem re-renders desnecessários, lazy loading aplicado quando cabível
- [ ] Tokens do design system usados (sem valores hardcodados)
- [ ] Testes cobrem happy path e estado de erro
- [ ] Responsividade verificada em mobile e desktop
- [ ] Se micro frontend: contrato de interface atualizado, remote funciona standalone

---

## 9. Proibições Absolutas

- `document.querySelector` / manipulação direta do DOM em contexto React
- `!important` em CSS sem comentário explicativo
- Fetch direto em componente de UI (usar hooks, queries ou Server Actions)
- Importar de outro remote diretamente (rompe o isolamento do micro frontend)
- Hardcodar tokens de design (cores, espaçamentos, fontes) fora do sistema de tokens
- `console.log` em código commitado (usar logger estruturado ou remover)
