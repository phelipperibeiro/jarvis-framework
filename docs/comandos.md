# Comandos do Jarvis — consulta rápida

Lista de todos os comandos `eng.*` (engenharia) e `prod.*` (produto). O nome de cada comando leva ao **guia didático** dele (quando usar, quando não usar, como funciona); a coluna Workflow leva ao arquivo-fonte que o agente segue. Guias de produto: [produto/](./produto/README.md). Guias de engenharia: [engenharia/](./engenharia/README.md).

> A fonte de cada comando é o arquivo em `workflows/`. Se um comando novo for criado ou removido, atualize esta página.

## Produto (`prod.*`)

Fonte: `workflows/product/`. Guia didático: [produto/README.md](./produto/README.md). Não sabe qual spec criar? Veja o [guia de decisão](./produto/prod.spec.guide.md).

| Comando                 | O que faz                                                                       | Workflow |
| ----------------------- | ------------------------------------------------------------------------------- | --- |
| [`/prod.spec`](./produto/prod.spec.md) | Ponto de entrada: guia a construção de especificações macro ou micro de produto | [workflow](../workflows/product/prod.spec.md) |
| [`/prod.spec.discovery`](./produto/prod.spec.discovery.md) | Investigação inicial de uma ideia: entrevista sobre o problema, os requisitos e a viabilidade, e gera um rascunho estruturado | [workflow](../workflows/product/prod.spec.discovery.md) |
| [`/prod.spec.prd`](./produto/prod.spec.prd.md) | Cria ou altera um PRD (Documento de Requisitos de Produto) | [workflow](../workflows/product/prod.spec.prd.md) |
| [`/prod.spec.frd`](./produto/prod.spec.frd.md) | Cria um FRD (Documento de Requisitos Funcionais) de uma feature | [workflow](../workflows/product/prod.spec.frd.md) |
| [`/prod.spec.epic`](./produto/prod.spec.epic.md) | Cria um épico que agrupa histórias e tarefas | [workflow](../workflows/product/prod.spec.epic.md) |
| [`/prod.spec.issue`](./produto/prod.spec.issue.md) | Cria issues: histórias de usuário, tarefas técnicas e bugs | [workflow](../workflows/product/prod.spec.issue.md) |
| [`/prod.spec.breakdown`](./produto/prod.spec.breakdown.md) | Quebra uma spec grande em fatias (versões, épicos e histórias) | [workflow](../workflows/product/prod.spec.breakdown.md) |
| [`/prod.spec.clarify`](./produto/prod.spec.clarify.md) | Faz até 5 perguntas para esclarecer ambiguidades e grava as respostas na spec | [workflow](../workflows/product/prod.spec.clarify.md) |
| `/prod.roadmap.preview` | Mostra o roadmap de entregas planejadas (períodos, projetos e responsáveis) | [workflow](../workflows/product/prod.roadmap.preview.md) |

## Engenharia (`eng.*`)

Fonte: `workflows/engineering/`. Guias didáticos: [engenharia/README.md](./engenharia/README.md).

### Ciclo de desenvolvimento

| Comando          | O que faz                                        | Workflow |
| ---------------- | ------------------------------------------------ | --- |
| [`/eng.start`](./engenharia/eng.start.md) | Inicia o planejamento e cria o `architecture.md` | [workflow](../workflows/engineering/eng.start.md) |
| [`/eng.plan`](./engenharia/eng.plan.md) | Planejamento de execução faseada da feature | [workflow](../workflows/engineering/eng.plan.md) |
| [`/eng.work`](./engenharia/eng.work.md) | Implementação do código, com commit por fase e sem push nem PR | [workflow](../workflows/engineering/eng.work.md) |
| [`/eng.pre-pr`](./engenharia/eng.pre-pr.md) | Validação antes de abrir o PR/MR | [workflow](../workflows/engineering/eng.pre-pr.md) |
| [`/eng.pr`](./engenharia/eng.pr.md) | Cria branch, commit e merge request | [workflow](../workflows/engineering/eng.pr.md) |
| [`/eng.review`](./engenharia/eng.review.md) | Revisão de solução ou PR | [workflow](../workflows/engineering/eng.review.md) |
| [`/eng.debug`](./engenharia/eng.debug.md) | Debugging e incidentes | [workflow](../workflows/engineering/eng.debug.md) |
| [`/eng.bug-audit`](./engenharia/eng.bug-audit.md) | Auditoria de bugs e gaps de qualidade | [workflow](../workflows/engineering/eng.bug-audit.md) |

### Arquitetura e specs técnicas

| Comando                     | O que faz                                              | Workflow |
| --------------------------- | ------------------------------------------------------ | --- |
| [`/eng.light-arch`](./engenharia/eng.light-arch.md) | Design arquitetural leve | [workflow](../workflows/engineering/eng.light-arch.md) |
| [`/eng.create-ard`](./engenharia/eng.create-ard.md) | Cria ou itera um ARD | [workflow](../workflows/engineering/eng.create-ard.md) |
| [`/eng.create-ard-from-code`](./engenharia/eng.create-ard-from-code.md) | Cria ou itera um ARD a partir do código do repositório | [workflow](../workflows/engineering/eng.create-ard-from-code.md) |
| [`/eng.create-rfc`](./engenharia/eng.create-rfc.md) | Cria ou itera um RFC (RFC-Playbook) | [workflow](../workflows/engineering/eng.create-rfc.md) |
| [`/eng.build-tech-spec`](./engenharia/eng.build-tech-spec.md) | Cria a Tech Spec a partir de uma história do board | [workflow](../workflows/engineering/eng.build-tech-spec.md) |
| [`/eng.breakdown-subtasks`](./engenharia/eng.breakdown-subtasks.md) | Quebra a Tech Spec em subtarefas detalhadas | [workflow](../workflows/engineering/eng.breakdown-subtasks.md) |
| [`/eng.docs`](./engenharia/eng.docs.md) | Atualiza a documentação de engenharia | [workflow](../workflows/engineering/eng.docs.md) |

### Frontend

| Comando                    | O que faz                                                                        | Workflow |
| -------------------------- | -------------------------------------------------------------------------------- | --- |
| [`/eng.frontend-component`](./engenharia/eng.frontend-component.md) | Cria ou refatora um componente frontend (neutro de stack: acessibilidade, tokens e testes) | [workflow](../workflows/engineering/frontend/eng.frontend-component.md) |
| [`/eng.frontend-review`](./engenharia/eng.frontend-review.md) | Revisão de PR frontend (tipagem, a11y, tokens, itens da stack) | [workflow](../workflows/engineering/frontend/eng.frontend-review.md) |
| [`/eng.frontend-perf-audit`](./engenharia/eng.frontend-perf-audit.md) | Auditoria de performance frontend (Core Web Vitals, bundle) | [workflow](../workflows/engineering/frontend/eng.frontend-perf-audit.md) |

### QA

| Comando                           | O que faz                                           | Workflow |
| --------------------------------- | --------------------------------------------------- | --- |
| [`/eng.qa-refinement-entry`](./engenharia/eng.qa-refinement-entry.md) | Estratégia de testes a partir de spec, PRD ou FRD | [workflow](../workflows/engineering/qa/eng.qa-refinement-entry.md) |
| [`/eng.qa-quality-gate-validation`](./engenharia/eng.qa-quality-gate-validation.md) | Quality gate da tech spec antes do breakdown | [workflow](../workflows/engineering/qa/eng.qa-quality-gate-validation.md) |
| [`/eng.qa-e2e-test-generation`](./engenharia/eng.qa-e2e-test-generation.md) | Gera testes E2E Cypress | [workflow](../workflows/engineering/qa/eng.qa-e2e-test-generation.md) |
| [`/eng.qa-dev-quality-guide`](./engenharia/eng.qa-dev-quality-guide.md) | Orienta devs sobre cobertura de testes | [workflow](../workflows/engineering/qa/eng.qa-dev-quality-guide.md) |
| [`/eng.qa-exploratory-session`](./engenharia/eng.qa-exploratory-session.md) | Sessão de teste exploratório estruturada | [workflow](../workflows/engineering/qa/eng.qa-exploratory-session.md) |
| [`/eng.qa-sprint-planning`](./engenharia/eng.qa-sprint-planning.md) | Capacidade de QA da sprint e distribuição por risco | [workflow](../workflows/engineering/qa/eng.qa-sprint-planning.md) |
| [`/eng.qa-release-signoff`](./engenharia/eng.qa-release-signoff.md) | Sign-off pré-deploy (GO/NO-GO) | [workflow](../workflows/engineering/qa/eng.qa-release-signoff.md) |
| [`/eng.qa-quality-report`](./engenharia/eng.qa-quality-report.md) | Relatório de qualidade da sprint ou release | [workflow](../workflows/engineering/qa/eng.qa-quality-report.md) |

### Segurança

| Comando                  | O que faz                                                | Workflow |
| ------------------------ | -------------------------------------------------------- | --- |
| [`/eng.security-audit`](./engenharia/eng.security-audit.md) | Auditoria (OWASP, secrets, supply chain) | [workflow](../workflows/engineering/eng.security-audit.md) |
| [`/eng.security-review`](./engenharia/eng.security-review.md) | Review de segurança em PRs (gate pré-merge) | [workflow](../workflows/engineering/eng.security-review.md) |
| [`/eng.security-incident`](./engenharia/eng.security-incident.md) | Resposta a incidentes (CVEs, vulnerabilidades, breaches) | [workflow](../workflows/engineering/eng.security-incident.md) |
| [`/eng.security-pipeline`](./engenharia/eng.security-pipeline.md) | Pipeline completo: threat model, audit, triage e patch | [workflow](../workflows/engineering/eng.security-pipeline.md) |

### Fluxos especializados

| Comando               | O que faz                                                  | Workflow |
| --------------------- | ---------------------------------------------------------- | --- |
| [`/eng.rpa.robot`](./engenharia/eng.rpa.robot.md) | Ciclo de vida de um robô RPA | [workflow](../workflows/engineering/eng.rpa.robot.md) |

## Outros comandos

Os comandos de dados (`/data.new-pipeline`, `/data.contract`), `/jarvis-init`, `/warm-up` e `/taxonomy` não estão nesta lista. Para o quadro completo do que o CLI instala, rode `jarvis list`.
