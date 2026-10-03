# `/eng.frontend-review` — revisar um PR de frontend

Workflow: `workflows/engineering/frontend/eng.frontend-review.md` · Skills: `eng-frontend`, `eng-frontend-design-system`, `eng-frontend-microfrontend`

## Em uma frase

Revisa um PR de frontend com um checklist aprofundado: TypeScript, componentes, tokens, acessibilidade, performance, micro frontend e testes.

## O que é

Complementa o [`eng.review`](./eng.review.md) genérico com os pontos específicos de interface. Você aponta um PR (ou um conjunto de arquivos) e o comando lê os arquivos alterados antes de revisar.

## Quando usar

- Revisar PR com componentes React, design system, micro frontend ou qualquer código de interface
- Antes de aprovar uma mudança de UI

## Quando **não** usar

- PR sem interface → [`eng.review`](./eng.review.md)
- Você vai criar o componente → [`eng.frontend-component`](./eng.frontend-component.md)
- O problema é lentidão → [`eng.frontend-perf-audit`](./eng.frontend-perf-audit.md)

## Como funciona

Lê os arquivos alterados do PR (`.tsx`, `.ts`, `.css`, `.scss`) e percorre 8 grupos de checklist:

1. TypeScript
2. Componentes
3. Tokens e design system
4. Acessibilidade
5. Performance
6. Micro frontend (se aplicável)
7. Testes
8. Código geral

### Como o feedback é classificado

| Prefixo | Significado |
|---|---|
| `[bloqueante]` | Deve ser resolvido antes do merge |
| `[sugestão]` | Melhoria recomendada, não obrigatória |
| `[dúvida]` | Pergunta para entender uma decisão |
| `[elogio]` | Destaca o que foi bem feito |

### O resultado

Um review com resumo (1 a 3 linhas), pontos de atenção (os bloqueantes), sugestões, dúvidas e um **veredicto**: aprovado, aprovado com ressalvas, ou mudanças necessárias.

## Próximo passo típico

Aplicar os bloqueantes e seguir para [`eng.pre-pr`](./eng.pre-pr.md)
