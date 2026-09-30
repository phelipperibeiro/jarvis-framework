# Engenharia no Jarvis (guias por comando)

Uma página por comando `eng.*`, no mesmo formato dos guias de [produto](../produto/README.md): em uma frase, o que é, quando usar, quando não usar, como funciona, regras que importam e o próximo passo típico.

Cada guia é escrito a partir do workflow do comando em `workflows/engineering/`. Para a lista completa em uma tabela só, com o arquivo-fonte de cada um, veja [comandos.md](../comandos.md).

## O ciclo principal

```
eng.start  →  eng.plan  →  eng.work  →  eng.pre-pr  →  eng.pr
(arquitetura)  (fases)     (código)      (validação)     (MR)
```

Cada etapa só avança com a sua aprovação. O `eng.start` e o `eng.plan` só planejam, o `eng.work` implementa fase por fase e o `eng.pr` entrega.

## Ciclo de desenvolvimento

| Comando | Em uma frase |
|---|---|
| [`eng.start`](./eng.start.md) | Investiga a tarefa e escreve o `architecture.md` |
| [`eng.plan`](./eng.plan.md) | Transforma a arquitetura em fases de cerca de 1 hora |
| [`eng.work`](./eng.work.md) | Implementa o plano, fase por fase |
| [`eng.pre-pr`](./eng.pre-pr.md) | Valida a branch e dá um semáforo antes do PR |
| [`eng.pr`](./eng.pr.md) | Faz o push e abre o merge request |
| [`eng.review`](./eng.review.md) | Revisa uma solução ou PR |
| [`eng.debug`](./eng.debug.md) | Investiga bug ou incidente com método |
| [`eng.bug-audit`](./eng.bug-audit.md) | Audita um projeto atrás de bugs e débito técnico |
| [`eng.docs`](./eng.docs.md) | Cria ou atualiza a documentação |

## Arquitetura e specs técnicas

| Comando | Em uma frase |
|---|---|
| [`eng.light-arch`](./eng.light-arch.md) | Desenho arquitetural leve, salvo no card |
| [`eng.create-ard`](./eng.create-ard.md) | ARD: arquitetura proposta, riscos e testes |
| [`eng.create-ard-from-code`](./eng.create-ard-from-code.md) | ARD a partir da arquitetura que o código já tem |
| [`eng.create-rfc`](./eng.create-rfc.md) | RFC: decisão técnica discutida em aberto |
| [`eng.build-tech-spec`](./eng.build-tech-spec.md) | Tech Spec de um épico ou história (Tech Lead) |
| [`eng.breakdown-subtasks`](./eng.breakdown-subtasks.md) | Quebra a Tech Spec em subtarefas verticais |

## Frontend

| Comando | Em uma frase |
|---|---|
| [`eng.frontend-component`](./eng.frontend-component.md) | Cria ou refatora um componente |
| [`eng.frontend-review`](./eng.frontend-review.md) | Revisa um PR de frontend |
| [`eng.frontend-perf-audit`](./eng.frontend-perf-audit.md) | Audita performance (Core Web Vitals, bundle) |

## QA

| Comando | Em uma frase |
|---|---|
| [`eng.qa-refinement-entry`](./eng.qa-refinement-entry.md) | Estratégia de testes a partir da spec, antes do código |
| [`eng.qa-quality-gate-validation`](./eng.qa-quality-gate-validation.md) | Quality gate da tech spec |
| [`eng.qa-e2e-test-generation`](./eng.qa-e2e-test-generation.md) | Gera testes E2E em Cypress |
| [`eng.qa-dev-quality-guide`](./eng.qa-dev-quality-guide.md) | Orienta o dev sobre os testes que ele deve escrever |
| [`eng.qa-exploratory-session`](./eng.qa-exploratory-session.md) | Sessão de teste exploratório |
| [`eng.qa-sprint-planning`](./eng.qa-sprint-planning.md) | Capacidade de QA da sprint, por risco |
| [`eng.qa-release-signoff`](./eng.qa-release-signoff.md) | GO ou NO-GO antes do deploy |
| [`eng.qa-quality-report`](./eng.qa-quality-report.md) | Relatório de qualidade da sprint ou release |

## Segurança

| Comando | Em uma frase |
|---|---|
| [`eng.security-audit`](./eng.security-audit.md) | Auditoria proativa (OWASP, secrets, supply chain) |
| [`eng.security-review`](./eng.security-review.md) | Review de segurança de um PR |
| [`eng.security-incident`](./eng.security-incident.md) | Resposta a incidente: contenção, correção e post-mortem |
| [`eng.security-pipeline`](./eng.security-pipeline.md) | Threat model, audit, triage e patch em um fluxo |

## Fluxos especializados

| Comando | Em uma frase |
|---|---|
| [`eng.rpa.robot`](./eng.rpa.robot.md) | Cria ou mantém um robô de automação |
| [`eng.ta.atendimento`](./eng.ta.atendimento.md) | Triagem de chamados do Tech Analyst |

## Não sabe por onde começar?

- Vai desenvolver uma feature nova → [`eng.start`](./eng.start.md)
- Tem um bug para investigar → [`eng.debug`](./eng.debug.md)
- Quer revisar um PR → [`eng.review`](./eng.review.md) (ou [`eng.frontend-review`](./eng.frontend-review.md) se for interface)
- Algo de segurança → [`eng.security-review`](./eng.security-review.md) para um PR, [`eng.security-incident`](./eng.security-incident.md) para um incidente
- Precisa de uma decisão de arquitetura → [`eng.light-arch`](./eng.light-arch.md), [`eng.create-ard`](./eng.create-ard.md) ou [`eng.create-rfc`](./eng.create-rfc.md)
