# `/eng.frontend-component` — criar ou refatorar um componente

Workflow: `workflows/engineering/frontend/eng.frontend-component.md` · Skill base: `eng-frontend` (mais as especializações registradas em `FRONTEND_SPECIALIZATIONS`)

## Em uma frase

Guia a criação ou refatoração de um componente frontend com qualidade: decide **onde ele mora**, implementa com acessibilidade e tokens, e entrega com testes.

## O que é

Um roteiro, **neutro de stack**, para que todo componente frontend nasça com o mesmo padrão: no lugar certo, tipado, acessível, testado e exportado do ponto de entrada correto. O framework, as bibliotecas e a estrutura de pastas vêm do seu projeto e das especializações registradas no `ENV.md`; se faltar informação, o comando pergunta em vez de presumir.

## Quando usar

- Criar um componente novo
- Refatorar um componente existente
- Quando você não sabe se o componente deve ser compartilhado ou ficar local no módulo

## Quando **não** usar

- Revisar um PR de frontend → [`eng.frontend-review`](./eng.frontend-review.md)
- Investigar lentidão → [`eng.frontend-perf-audit`](./eng.frontend-perf-audit.md)

## Como funciona

**1. Análise.** Antes de qualquer código, responde a cinco perguntas:

1. O componente será reutilizado em mais de um módulo ou aplicação? Se sim, vai para a biblioteca de componentes **compartilhados** do projeto (se existir); se não, para o **módulo** onde será usado
2. Já existe um componente parecido?
3. Existe um primitivo ou componente pronto da biblioteca de UI do projeto para ele (modal, seleção, menu, dica de contexto, caixa de seleção)?
4. Quais variantes são necessárias? (levantar com o design antes)
5. Onde ele é renderizado e como guarda estado? (conforme a especialização registrada)

Depois lê o código ao redor para seguir os padrões em uso.

**2. Implementação,** com checklist de tipagem, tokens de design do projeto, acessibilidade e estados visuais.

**3. Testes** com a ferramenta de testes de interface que o projeto já usa. Cobertura mínima: renderização padrão, cada variante principal, estados de carregamento e de erro (se existirem), a interação principal e acessibilidade automatizada (se o projeto tiver ferramenta configurada).

**4. Documentação visual,** apenas se o projeto usa um catálogo de componentes: documentação gerada, controles para cada entrada variável, um exemplo por variante e por estado especial.

**5. Integração:** exporta do ponto de entrada que os demais componentes do projeto usam e verifica a responsividade nos tamanhos de tela do projeto (se o projeto não define, o comando parte de celular 375px, tablet 768px e desktop 1280px e confirma com você).

## Checklist final

- Componente no lugar correto
- Entradas tipadas ou documentadas, sem tipo genérico solto
- Tokens de design do projeto usados, sem valor fixo no código
- Estados visuais completos
- Acessibilidade: semântica, teclado e rótulos quando necessário
- Testes cobrindo os comportamentos críticos
- Documentação visual criada (se o projeto usa)
- Exportado do index correto
- Responsivo

## Próximo passo típico

[`eng.frontend-review`](./eng.frontend-review.md) → [`eng.pre-pr`](./eng.pre-pr.md)
