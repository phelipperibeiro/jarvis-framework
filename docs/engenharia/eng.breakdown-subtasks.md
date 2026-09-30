# `/eng.breakdown-subtasks` — quebrar a Tech Spec em subtarefas

Workflow: `workflows/engineering/eng.breakdown-subtasks.md` · Regras: `rules/engineering/eng.breakdown-subtasks-rules.md`

## Em uma frase

Recebe uma Tech Spec e a quebra em subtarefas tão detalhadas que uma pessoa júnior consegue executar cada uma sem perguntar nada.

## O que é

Cada subtarefa vira um card com **sua própria branch, seu commit e seu deploy**. Por isso ela precisa ser uma **fatia vertical**: uma entrega completa que, sozinha, pode ser mergeada sem quebrar o sistema. É como um tutorial passo a passo.

Não confunda com o [`prod.spec.breakdown`](../produto/prod.spec.breakdown.md), que fatia uma **especificação de produto** em versões, épicos e histórias. Este aqui quebra uma **Tech Spec** de engenharia.

## Quando usar

- Depois de ter a Tech Spec ([`eng.build-tech-spec`](./eng.build-tech-spec.md)) aprovada
- Para distribuir o trabalho de uma história entre pessoas

## Quando **não** usar

- Você ainda não tem a Tech Spec → [`eng.build-tech-spec`](./eng.build-tech-spec.md)
- Você quer fatiar uma spec de produto → [`/prod.spec.breakdown`](../produto/prod.spec.breakdown.md)

## Como funciona

1. **Análise profunda da Tech Spec:** extrai componentes, decisões, escopo, riscos, testes, contratos de API, modelos de dados e fluxos
2. **Investigação do codebase (obrigatória)** antes de criar qualquer subtarefa: acha arquivos parecidos, entende os padrões e registra o que encontrou
3. **Estratégia de breakdown:** aplica o princípio da independência, define a ordem lógica e os prefixos de stack (`[BACKEND]`, `[FRONTEND]`, `[DATA]`, `[QA]`, `[INFRA]`, `[DOCS]`), e mapeia dependências (depende de, desbloqueia, paralela com)
4. **Cria as subtarefas** pelo template, com: o que fazer, contexto, stack, arquivos a criar ou modificar, passo a passo com código completo, testes com cenários, checklist, riscos, dependências e referências
5. **Gera a saída** em Markdown, uma seção por subtarefa, e roda o checklist de qualidade final

### O teste de independência

Toda subtarefa precisa responder **sim** a três perguntas. Se alguma for não, ela é reagrupada com a próxima:

1. Posso mergear esta branch sem quebrar o sistema?
2. Posso testar ou demonstrar esta entrega sem depender das próximas?
3. Ela entrega valor observável (endpoint funcionando, modal usável, tela navegável)?

Por isso, "só o enum", "só o repository" ou "só o DTO" **não são subtarefas válidas**. O endpoint inteiro é.

## Regras que importam

- Tamanho: mínimo de 4 horas e máximo de 1 dia por subtarefa. Menos de 4h é sinal de fatia horizontal e se agrupa; mais de 1 dia se divide em **duas fatias verticais**, nunca em camadas
- Testes unitários ficam **dentro** da subtarefa de código; `[QA]` é só para testes que cruzam várias subtarefas
- Código completo em cada passo, sem "..." nem "resto do código"

## Próximo passo típico

[`eng.qa-quality-gate-validation`](./eng.qa-quality-gate-validation.md) e depois [`eng.start`](./eng.start.md) em cada subtarefa
