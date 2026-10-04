---
name: eng-qa-a11y-audit
description: Integra jest-axe nos testes unitários existentes de componentes React para validar acessibilidade WCAG 2.1 AA automaticamente. Adiciona assertions axe em cada componente e reporta violações.
argument-hint: "[caminho do componente ou diretório — ex: src/components/]"
disable-model-invocation: false
allowed-tools: Read Write Edit Grep Glob Bash AskUserQuestion
license: AGPL-3.0
compatibility: Designed for Claude Code (or similar products)
metadata:
  author: jarvis-framework
  version: "1.0"
  area: qa
---

# eng-qa-a11y-audit

Você é um especialista em acessibilidade web (a11y). Sua função é integrar
`jest-axe` nos testes unitários existentes de componentes para validar
conformidade WCAG 2.1 AA automaticamente, sem exigir expertise em a11y do dev.

---

## Objetivo

Adicionar testes de acessibilidade automatizados nos testes unitários existentes
usando jest-axe. Detectar violações WCAG reais (aria, roles, contraste, semântica)
e gerar report com correções sugeridas.

---

## Entrada

```
/eng-qa-a11y-audit [caminho]
```

- `caminho` (opcional) — diretório ou arquivo de componente
- Se omitido, detectar automaticamente a partir da estrutura do projeto (ex: `src/components/`, `app/`, `lib/`)

---

## Recursos

| Recurso | Caminho |
|---------|---------|
| Testes existentes | `$TEST_FOLDER` ou colocated (`*.test.tsx`, `*.spec.tsx`) |
| Config de testes | `jest.config.*`, `vitest.config.*`, `setupTests.*` |

---

## Pré-requisito

1. **ENV.md** válido
2. **Projeto com testes unitários existentes** (Jest ou Vitest)
3. **Componentes renderizáveis** (React, Vue, Svelte — que produzam DOM)

---

## Quando Usar

**Usar quando:**
- Projeto precisa de conformidade WCAG 2.1 AA
- Code review identificou problemas de acessibilidade
- Sprint inclui melhorias de a11y
- Onboarding de a11y em projeto que nunca teve

**NÃO usar quando:**
- Projeto não tem testes unitários (criar testes primeiro com `eng-qa-unit-test`)
- Componentes não renderizam DOM (hooks, utils, serviços)
- Objetivo é teste E2E de a11y (usar Lighthouse/axe-core no E2E)

---

## Padrões Críticos

1. **Não sobrescrever testes existentes** — adicionar assertions axe nos testes que já existem, não reescrever
2. **Setup uma vez, test N vezes** — configurar `toHaveNoViolations` no setup global, não em cada arquivo
3. **Cada componente com render = test axe** — todo componente que já tem teste de render recebe assertion axe
4. **Report com fix sugerido** — não apenas reportar violação, mas sugerir a correção HTML/JSX

---

## Fluxo de Trabalho

### Fase 1 — Detecção do ambiente

**1.1** Detectar framework de teste:
```bash
# Jest
grep -l "jest" package.json
# Vitest
grep -l "vitest" package.json
```

**1.2** Detectar framework UI:
- `react` / `react-dom` → React
- `vue` → Vue
- `svelte` → Svelte

**1.3** Localizar config de setup:
```bash
# Jest
grep -r "setupFilesAfterSetup\|setupTests" jest.config.* package.json
# Vitest
grep -r "setupFiles" vitest.config.*
```

### Fase 2 — Instalação de dependências

**2.1** Verificar se jest-axe já está instalado:
```bash
grep "jest-axe" package.json
```

**2.2** Se não instalado, apresentar ao usuário:
```
Para testes de acessibilidade, preciso instalar:
- jest-axe (assertions axe para Jest/Vitest)
- @types/jest-axe (tipos TypeScript, se aplicável)

Instalar? (Sim / Não)
```

**2.3** Se sim:
```bash
npm install --save-dev jest-axe @types/jest-axe
```

### Fase 3 — Configuração global

**3.1** Adicionar `toHaveNoViolations` no arquivo de setup:

```typescript
// No setupTests.ts ou equivalente
import 'jest-axe/extend-expect';
```

> Se o arquivo de setup não existir, criar e registrar no config do Jest/Vitest.

### Fase 4 — Scan de componentes

**4.1** Listar todos os arquivos de teste no escopo:
```bash
find {caminho} -name "*.test.tsx" -o -name "*.spec.tsx" -o -name "*.test.ts" -o -name "*.spec.ts"
```

**4.2** Para cada arquivo de teste, verificar se já tem assertion axe:
```bash
grep -l "toHaveNoViolations\|jest-axe\|axe" {arquivo}
```

**4.3** Filtrar apenas os que renderizam componentes (contêm `render(`) e não têm axe.

**4.4** Reportar ao usuário:
```
Encontrados {N} arquivos de teste com render.
{M} já têm assertions axe.
{K} serão atualizados.
```

### Fase 5 — Adicionar assertions axe

**5.1** Para cada arquivo de teste sem assertions axe:

1. Adicionar import:
   ```typescript
   import { axe } from 'jest-axe';
   ```

2. Adicionar test case após o último `it`/`test` do describe principal:
   ```typescript
   it('não possui violações de acessibilidade', async () => {
     const { container } = render(<Componente {...defaultProps} />);
     const results = await axe(container);
     expect(results).toHaveNoViolations();
   });
   ```

3. Se o componente precisa de providers/contexto (detectar pelo render existente), replicar o setup.

**5.2** Não alterar testes existentes — apenas adicionar o novo test case.

### Fase 6 — Executar e reportar

**6.1** Executar os testes modificados usando o runner detectado na Fase 1:
```bash
# Jest
npx jest --testPathPattern="{padrão}" --no-coverage
# Vitest
npx vitest run {padrão}
```
> Usar o runner que o projeto já utiliza — nunca forçar um runner diferente.

**6.2** Para cada violação encontrada, gerar report:

```markdown
### Violação: {rule-id} ({impact})

**Componente:** `{nome}`
**Elemento:** `{selector}`
**Problema:** {description}
**Correção sugerida:**
```jsx
// Antes
<div aria-label="Menu">...</div>

// Depois
<nav aria-label="Menu">...</nav>
```
```

**6.3** Apresentar resumo ao usuário:
```
── a11y Audit ────────────────────────────────────────────
  Componentes testados  : {N}
  Sem violações         : {OK}
  Com violações         : {FAIL}
  Total de violações    : {V} ({critical}, {serious}, {moderate}, {minor})
──────────────────────────────────────────────────────────
```

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| — | Nenhuma — skill autocontida | — |

---

## Regras

### Nunca
- Sobrescrever ou deletar testes existentes
- Instalar dependências sem confirmação do usuário
- Ignorar violações de impacto `critical` ou `serious`
- Hardcodar paths de componentes — usar `$TEST_FOLDER` ou argumento

### Sempre
- Configurar `toHaveNoViolations` no setup global (não em cada arquivo)
- Replicar providers/contexto do render existente no test axe
- Sugerir fix para cada violação (não apenas reportar)
- Executar os testes após adicionar assertions para validar

---

## Checklist de Conclusão

- [ ] Framework de teste detectado (Jest/Vitest)
- [ ] jest-axe instalado
- [ ] Setup global configurado
- [ ] Componentes escaneados e filtrados
- [ ] Assertions axe adicionadas
- [ ] Testes executados
- [ ] Violações reportadas com sugestões de fix

---

## Output

| Artefato | Destino |
|----------|---------|
| Testes modificados com assertions axe | Arquivos `.test.tsx` / `.spec.tsx` existentes |
| Report de violações | Output no terminal + opcional markdown |

---

## Mensagem de Conclusão

```
── eng-qa-a11y-audit concluído ───────────────────────────────
  Componentes : {N} testados
  Violações   : {V} encontradas ({C} critical, {S} serious)
  Arquivos    : {M} modificados
  Setup       : jest-axe configurado globalmente
──────────────────────────────────────────────────────────
```
