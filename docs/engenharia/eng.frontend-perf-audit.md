# `/eng.frontend-perf-audit` — auditoria de performance frontend

Workflow: `workflows/engineering/frontend/eng.frontend-perf-audit.md` · Skill base: `eng-frontend` (mais as especializações registradas em `FRONTEND_SPECIALIZATIONS`)

## Em uma frase

Mede, diagnostica e prioriza a performance de uma aplicação frontend, de qualquer stack, com base nos Core Web Vitals, no pacote entregue e nas renderizações desnecessárias.

## O que é

O princípio do comando é **nunca otimizar sem medir antes**. Ele começa coletando dados reais, diagnostica por área e só então propõe otimizações, ordenadas por impacto e esforço.

## Quando usar

- Investigar uma página ou interface lenta
- Auditar uma feature antes do deploy
- Planejar otimizações em uma aplicação frontend

## Quando **não** usar

- Você quer revisar um PR → [`eng.frontend-review`](./eng.frontend-review.md)
- O problema de performance está no backend ou em consultas → [`eng.debug`](./eng.debug.md)

## Como funciona

| Fase | O que acontece |
|---|---|
| 1. Coleta de dados | Mede Core Web Vitals em produção ou staging (Lighthouse), analisa o pacote entregue e identifica renderizações desnecessárias (com a ferramenta de profiling da stack do projeto) |
| 2. Diagnóstico por área | LCP alto (carrega devagar), CLS alto (layout se move), INP alto (interface trava) e pacote grande |
| 3. Otimizações | Por categoria, com a técnica que a stack do projeto oferece: imagens, carregamento tardio do código, onde renderizar, memoização (só quando justificada), listas longas (virtualização) e debounce em campos de busca |
| 4. Arquiteturas distribuídas | Só se o projeto divide o frontend em partes carregadas separadamente: dependências duplicadas e carregamento dos módulos |
| 5. Relatório | Core Web Vitals antes e esperados depois, problemas com impacto, esforço e prioridade, ações ordenadas e próximos passos com responsável |

### Metas dos Core Web Vitals

As metas obrigatórias do framework para frontend (`eng.frontend-rules.md`) são: LCP abaixo de 2,5 s, CLS abaixo de 0,1 e INP abaixo de 200 ms.

## Regras que importam

- **Medir antes de otimizar**
- Memoização só quando comprovada com o profiler, sem otimização prematura
- Imagens sempre com largura e altura definidas para evitar CLS

## Próximo passo típico

Abrir os itens do relatório como tarefas e seguir o ciclo normal: [`eng.start`](./eng.start.md) → [`eng.plan`](./eng.plan.md) → [`eng.work`](./eng.work.md)
