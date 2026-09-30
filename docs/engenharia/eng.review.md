# `/eng.review` — revisar uma solução ou PR

Workflow: `workflows/engineering/eng.review.md` · Regras: `rules/engineering/eng-rules.md`

## Em uma frase

Revisa uma solução técnica, um ARD, um PR ou um trecho de código, apontando riscos, lacunas e melhorias, sem alterar nada.

## O que é

É uma revisão guiada em 7 passos, para quem quer uma segunda opinião estruturada. Serve tanto para o seu próprio trabalho quanto para o de outra pessoa.

## Quando usar

- Revisar um PR, uma proposta de solução ou um ARD
- Conferir uma mudança antes de pedir revisão humana
- Quando você quer riscos e edge cases levantados de forma sistemática

## Quando **não** usar

- Validação final antes de abrir o PR da própria branch → [`eng.pre-pr`](./eng.pre-pr.md)
- PR de frontend com checklist aprofundado (TypeScript, tokens, a11y, micro frontend) → [`eng.frontend-review`](./eng.frontend-review.md)
- Revisão específica de segurança → [`eng.security-review`](./eng.security-review.md)

## Como funciona

1. **Entender o objetivo da mudança:** o que ela faz e se está ligada a um ARD, um PRD, um bug ou um refactor
2. **Escopo e impacto declarado**
3. **Revisão estrutural**
4. **Riscos e edge cases**
5. **Qualidade e legibilidade**
6. **Testes e cobertura mínima**, com análise de cobertura e execução via TestSprite como etapas opcionais
7. **Recomendação e próximos passos**

Conforme o que a mudança toca, o comando recomenda apoio de agentes e skills: cobertura de testes, arquitetura (C4), frontend, design system, micro frontend e usabilidade.

## Regras que importam

- Segue as regras gerais de engenharia (`eng-rules.md`), como apontar riscos técnicos relevantes e nunca fingir que rodou testes
- Ao ver código que faz chamadas entre serviços sem Correlation ID, sinaliza como débito técnico

## Próximo passo típico

Aplicar as correções e, no fluxo da sua branch, [`eng.pre-pr`](./eng.pre-pr.md) → [`eng.pr`](./eng.pr.md)
