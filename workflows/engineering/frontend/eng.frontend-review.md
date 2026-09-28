---
name: eng.frontend-review
description: >
  Workflow de revisão de código específico para PRs frontend: TypeScript, tokens,
  acessibilidade, performance, micro frontend e design system.
  Complementa o eng.review genérico com checklist frontend aprofundado.
author: jarvis-team
version: "1.0"

---

# Workflow: Revisão de Código Frontend

## Contexto

Use este workflow ao revisar PRs que envolvem componentes React, design system,
micro frontend ou qualquer código de interface.

**Skill de referência**: `eng-frontend`, `eng-design-system`, `eng-microfrontend`

---

## Como usar

Execute para um PR específico ou para um conjunto de arquivos:

```bash
# Ler arquivos alterados no PR
git diff origin/main...HEAD --name-only | grep -E "\.(tsx|ts|css|scss)$"

# Ler cada arquivo alterado antes de revisar
```

---

## Checklist de Revisão

### 1. TypeScript

- [ ] Sem `any` não documentado
- [ ] Sem `@ts-ignore` sem comentário explicativo
- [ ] Sem `!` (non-null assertion) sem verificação prévia
- [ ] Props exportadas para componentes públicos
- [ ] `strict: true` não relaxado

**Flags de atenção:**
```bash
grep -n "as any\|@ts-ignore\|@ts-expect-error\| \! " {arquivo}
```

---

### 2. Componentes

- [ ] Single Responsibility — componente faz uma coisa só
- [ ] Sem lógica de negócio acoplada ao componente de UI
- [ ] Sem fetch direto no componente (usar hooks ou Server Components)
- [ ] `forwardRef` em componentes com elemento DOM
- [ ] Estados visuais tratados: loading, erro, vazio

**Perguntas a fazer no review:**
- "Este componente pertence ao design system ou ao remote?"
- "Existe componente similar no design system que poderia ser usado?"
- "Esta lógica deveria estar em um hook?"

---

### 3. Tokens e Design System

- [ ] Cores via tokens semânticos (sem `#hex`, `rgb()`, `hsl()`)
- [ ] Espaçamentos via escala do design system (sem px hardcodados inline)
- [ ] Componentes reutilizáveis criados no design system, não duplicados por remote
- [ ] Variantes com `cva` (não condicionais de classe espalhadas)

**Flags de atenção:**
```bash
grep -n "#[0-9a-fA-F]\{3,6\}\|rgb(\|style={{" {arquivo}
```

---

### 4. Acessibilidade

- [ ] Semântica HTML correta (`<button>` para ações, `<a>` para navegação)
- [ ] Imagens com `alt` (informativas: descritivo; decorativas: `alt=""`)
- [ ] Formulários: `<label>` associado via `htmlFor` ou `aria-label`
- [ ] Erros de form com `role="alert"` ou `aria-live`
- [ ] Elementos interativos são navegáveis por teclado
- [ ] Focus visível — `outline` não removido sem substituto

**Flags de atenção:**
```bash
grep -n "outline-none\|outline: none\|tabIndex={-1}" {arquivo}
# outline-none do Tailwind em elementos interativos sem focus-visible alternativo
```

---

### 5. Performance

- [ ] Sem `useEffect` para fetch de dados (usar React Query / Server Components)
- [ ] Lazy loading em componentes pesados (`lazy()` + `<Suspense>`)
- [ ] Dependências novas justificadas (avaliar impacto no bundle)
- [ ] Memoização só onde necessário e comprovado (`memo`, `useMemo`, `useCallback`)
- [ ] Imagens com `width` e `height` definidos

**Perguntas a fazer:**
- "Este componente precisa ser Client Component, ou funciona como Server Component?"
- "Esta dependência nova já está no bundle ou é nova?"

---

### 6. Micro Frontend (se aplicável)

- [ ] Sem import direto de outro remote
- [ ] Comunicação via event bus ou props do shell
- [ ] Contrato de interface atualizado se houver mudança na API exposta
- [ ] Remote ainda funciona em modo standalone

**Flag de atenção:**
```bash
# Import entre remotes (nunca deve existir)
grep -n "from.*'apps/" {arquivo}
grep -n "from.*'remote" {arquivo}
```

---

### 7. Testes

- [ ] Testes para o happy path
- [ ] Testes para estado de erro
- [ ] Queries por acessibilidade (`getByRole`, `getByLabelText`)
- [ ] Sem `getByTestId` como primeira opção
- [ ] Sem `act()` manual desnecessário

---

### 8. Código Geral

- [ ] Sem `console.log` commitado
- [ ] Sem `TODO` sem issue associada
- [ ] Seguindo convenções de nomenclatura do projeto

```bash
grep -n "console\.log\|console\.error\|console\.warn" {arquivo}
```

---

## Classificação do Feedback

Use prefixos para clareza no review:

```
[bloqueante]  — deve ser resolvido antes do merge
[sugestão]    — melhoria não obrigatória, mas recomendada
[dúvida]      — pergunta para entender melhor a decisão
[elogio]      — destacar o que foi bem feito
```

---

## Output do Review

```
## Review Frontend — {título do PR}

### Resumo
{1-3 linhas: qual é a mudança e qual o impacto geral}

### Pontos de atenção
{lista dos [bloqueante] encontrados}

### Sugestões
{lista dos [sugestão]}

### Dúvidas
{lista dos [dúvida]}

### Veredicto
[ ] Aprovado
[ ] Aprovado com ressalvas (sugestões não bloqueantes)
[ ] Mudanças necessárias (bloqueantes listados acima)
```
