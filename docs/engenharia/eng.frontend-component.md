# `/eng.frontend-component` — criar ou refatorar um componente

Workflow: `workflows/engineering/frontend/eng.frontend-component.md` · Skills: `eng-frontend`, `eng-frontend-design-system`

## Em uma frase

Guia a criação ou refatoração de um componente frontend com qualidade: decide **onde ele mora**, implementa com acessibilidade e tokens, e entrega com testes.

## O que é

Um roteiro para que todo componente React (em micro frontends ou no design system) nasça com o mesmo padrão: no lugar certo, tipado, acessível, testado e exportado do ponto de entrada correto.

## Quando usar

- Criar um componente novo
- Refatorar um componente existente
- Quando você não sabe se o componente vai para o design system ou para um remote

## Quando **não** usar

- Revisar um PR de frontend → [`eng.frontend-review`](./eng.frontend-review.md)
- Investigar lentidão → [`eng.frontend-perf-audit`](./eng.frontend-perf-audit.md)

## Como funciona

**1. Análise.** Antes de qualquer código, responde a cinco perguntas:

1. O componente será reutilizado em mais de um remote ou app? Se sim, vai para o **design system**; se não, para o **remote**
2. Já existe um componente parecido?
3. Existe um primitivo Radix UI para ele (modal, select, dropdown, tooltip, checkbox)?
4. Quais variantes são necessárias? (levantar com o design antes)
5. É Server Component ou Client Component? Se usa hooks ou eventos, é Client Component

Depois lê o código ao redor para seguir os padrões em uso.

**2. Implementação,** com checklist de TypeScript, tokens do design system, acessibilidade e estados visuais.

**3. Testes** com Testing Library. Cobertura mínima: renderização padrão, cada variante principal, estados de carregamento e de erro (se existirem), a interação principal e acessibilidade via `axe` (se o addon estiver configurado).

**4. Story** no Storybook, **apenas para o design system:** autodocs, controles para cada prop variável, uma story por variante e por estado especial, e uma `AllVariants` para visão geral.

**5. Integração:** exporta do ponto de entrada correto (`index.ts` do design system ou do remote) e verifica a responsividade nos breakpoints do projeto (mobile 375px, tablet 768px, desktop 1280px).

## Checklist final

- Componente no lugar correto
- Props tipadas, sem `any`
- Tokens do design system usados, sem valor fixo no código
- Estados visuais completos
- Acessibilidade: semântica, teclado e ARIA quando necessário
- Testes cobrindo os comportamentos críticos
- Story criada (se for design system)
- Exportado do index correto
- Responsivo

## Próximo passo típico

[`eng.frontend-review`](./eng.frontend-review.md) → [`eng.pre-pr`](./eng.pre-pr.md)
