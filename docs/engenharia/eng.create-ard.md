# `/eng.create-ard` — documento de requisitos de arquitetura

Workflow: `workflows/engineering/eng.create-ard.md` · Template: `templates/engineering/ARD-template.md`

## Em uma frase

Cria ou atualiza um **ARD** (Architecture Requirements Document): o documento que registra a arquitetura proposta, os impactos, os riscos e a estratégia de testes de uma demanda.

## O que é

O ARD responde "como vamos construir isto?" de forma versionada e revisável. Ele nasce de uma demanda de produto (PRD) e serve de base para as tarefas técnicas. O comando funciona em dois modos: **novo ARD** ou **iteração** de um ARD existente.

Atalhos:

- `eng.create-ard new <nome> [--prd <caminho-do-prd>]`
- `eng.create-ard edit <nome-ou-caminho>`

## Quando usar

- Mudança arquitetural relevante ou feature nova com impacto em vários componentes
- Quando a decisão precisa ficar documentada e versionada
- Para atualizar um ARD depois que a solução mudou

## Quando **não** usar

- Você quer um desenho rápido para uma feature pequena → [`eng.light-arch`](./eng.light-arch.md)
- O ARD deve refletir o código que já existe → [`eng.create-ard-from-code`](./eng.create-ard-from-code.md)
- A decisão precisa de discussão aberta e aprovação formal → [`eng.create-rfc`](./eng.create-rfc.md)

## Como funciona

| Passo | O que acontece |
|---|---|
| 0 | Define se é novo ARD ou iteração (pergunta se os argumentos não deixarem claro) |
| 0.5 | **Versiona** com SemVer: novo ARD começa em `1.0.0`; em iteração, você diz se a mudança foi major, minor ou patch (regras em `eng.bump-rules.md`) |
| 1 | Confirma o contexto e a origem da demanda |
| 1.1 | **Verifica o PRD** (obrigatório), no central docs ou manualmente |
| 2 | Lê os insumos relevantes |
| 2.5 | **Avalia a complexidade** (simples, moderada ou complexa) e declara o resultado antes de decidir qualquer coisa |
| 3 | Preenche o `ARD-template.md` |
| 4 | Análise de impacto e riscos |
| 5 | Estratégia de testes e validação |
| 6 | Checagem final com os guard rails das regras de engenharia |
| 7 | Entrega: ARD preenchido, resumo executivo e próximos passos |
| 8 | Publica no central docs, se `CENTRAL_DOCS_REPO` estiver configurado |

### Avaliação de complexidade (passo 2.5)

Critérios objetivos: volume de requisições, número de serviços impactados, necessidade de assíncrono, estado distribuído, dificuldade de rollback de dados e SLA. O resultado limita o que pode ser proposto: **simples** pede solução direta (sem filas nem cache distribuído); **moderada** aceita assíncrono se volume ou SLA justificarem; **complexa** autoriza arquitetura robusta, com justificativa para cada componente.

## Regras que importam

- **Proporcionalidade:** só introduz complexidade (filas, eventos, cache distribuído, saga) se a classificação permitir e houver justificativa técnica documentada
- Não inventa stack, endpoints nem integrações; pergunta
- Lista perguntas abertas e pontos que exigem aprovação de Produto ou de outra squad

## Próximo passo típico

Revisar o ARD com o time, priorizar próximos passos (tasks, spikes, provas de conceito) e seguir para [`eng.build-tech-spec`](./eng.build-tech-spec.md) ou [`eng.start`](./eng.start.md)
