# `/eng.frontend-perf-audit` — auditoria de performance frontend

Workflow: `workflows/engineering/frontend/eng.frontend-perf-audit.md` · Skill: `eng-frontend`

## Em uma frase

Mede, diagnostica e prioriza a performance de uma aplicação React ou micro frontend, com base nos Core Web Vitals, no bundle e nos re-renders.

## O que é

O princípio do comando é **nunca otimizar sem medir antes**. Ele começa coletando dados reais, diagnostica por área e só então propõe otimizações, ordenadas por impacto e esforço.

## Quando usar

- Investigar uma página ou interface lenta
- Auditar uma feature antes do deploy
- Planejar otimizações em uma aplicação React ou micro frontend

## Quando **não** usar

- Você quer revisar um PR → [`eng.frontend-review`](./eng.frontend-review.md)
- O problema de performance está no backend ou em consultas → [`eng.debug`](./eng.debug.md)

## Como funciona

| Fase | O que acontece |
|---|---|
| 1. Coleta de dados | Mede Core Web Vitals em produção ou staging (Lighthouse), analisa o bundle e identifica re-renders desnecessários (React DevTools) |
| 2. Diagnóstico por área | LCP alto (carrega devagar), CLS alto (layout se move), INP alto (interface trava) e bundle grande |
| 3. Otimizações | Por categoria: imagens, code splitting, renderização (Server vs Client), memoização (só quando justificada), listas longas (virtualização) e debounce em inputs |
| 4. Micro frontend | Dependências compartilhadas duplicadas e carregamento dos remotes |
| 5. Relatório | Core Web Vitals antes e esperados depois, problemas com impacto, esforço e prioridade, ações ordenadas e próximos passos com responsável |

### Metas dos Core Web Vitals

As metas obrigatórias do framework para frontend (`eng.frontend-rules.md`) são: LCP abaixo de 2,5 s, CLS abaixo de 0,1 e INP abaixo de 200 ms.

## Regras que importam

- **Medir antes de otimizar**
- Memoização só quando comprovada com o profiler, sem otimização prematura
- Imagens sempre com largura e altura definidas para evitar CLS

## Próximo passo típico

Abrir os itens do relatório como tarefas e seguir o ciclo normal: [`eng.start`](./eng.start.md) → [`eng.plan`](./eng.plan.md) → [`eng.work`](./eng.work.md)
