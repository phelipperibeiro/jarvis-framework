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

Os comandos de frontend e de backend são **neutros de stack**: carregam a skill base mais as especializações que o projeto registrou no `ENV.md`. Veja [como adaptar o Jarvis à sua stack](../especializacoes-de-stack.md).

| Comando | Em uma frase |
|---|---|
| [`eng.frontend-component`](./eng.frontend-component.md) | Cria ou refatora um componente |
| [`eng.frontend-review`](./eng.frontend-review.md) | Revisa um PR de frontend |
| [`eng.frontend-perf-audit`](./eng.frontend-perf-audit.md) | Audita performance (Core Web Vitals, bundle) |

## QA

| Comando | Em uma frase |
|---|---|
| [`eng.qa-refinement-entry`](./eng.qa-refinement-entry.md) | Estratégia de testes a partir da spec, antes do código |
| [`eng.qa-sprint-planning`](./eng.qa-sprint-planning.md) | Capacidade de QA da sprint, por risco |
| [`eng.qa-release-signoff`](./eng.qa-release-signoff.md) | GO ou NO-GO antes do deploy |

## Fluxos especializados

| Comando | Em uma frase |
|---|---|
| [`eng.rpa.robot`](./eng.rpa.robot.md) | Cria ou mantém um robô de automação |

## Não sabe por onde começar?

- Vai desenvolver uma feature nova → [`eng.start`](./eng.start.md)
- Tem um bug para investigar → [`eng.debug`](./eng.debug.md)
- Quer revisar um PR → [`eng.review`](./eng.review.md) (ou [`eng.frontend-review`](./eng.frontend-review.md) se for interface)
- Precisa de uma decisão de arquitetura → [`eng.light-arch`](./eng.light-arch.md), [`eng.create-ard`](./eng.create-ard.md) ou [`eng.create-rfc`](./eng.create-rfc.md)
