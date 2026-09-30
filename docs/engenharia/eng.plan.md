# `/eng.plan` — plano de execução em fases

Workflow: `workflows/engineering/eng.plan.md` · Regras: `rules/engineering/eng.plan-rules.md`

## Em uma frase

Transforma o `architecture.md` em um `plan.md`: fases de cerca de 1 hora, cada uma com tarefas claras e testes, para implementar aos poucos e poder retomar de onde parou.

## O que é

Depois de decidir **o que** fazer no [`eng.start`](./eng.start.md), este comando decide **em que ordem**. O plano fica em `.jarvis/sessions/eng/{TASK_MANAGER_KEY}/plan.md` e é o roteiro que o [`eng.work`](./eng.work.md) segue.

Cada fase:

- leva no máximo cerca de 1 hora
- entrega algo testável sozinho e não quebra o sistema
- tem tarefas específicas, com **o que**, **onde**, **como** e **como verificar**
- inclui uma tarefa de testes (`X.T`), baseada na estratégia do `architecture.md`

## Quando usar

- Logo depois de aprovar o `architecture.md`
- Antes de começar a implementar

## Quando **não** usar

- Ainda não existe `architecture.md` → rode [`eng.start`](./eng.start.md) primeiro (o comando pede isso)
- Você quer escrever código → [`eng.work`](./eng.work.md)

## Como funciona

1. Confirma que o `architecture.md` existe e o lê
2. Pesquisa o codebase: arquivos que serão modificados e padrões parecidos já implementados
3. Calibra o plano pelo contexto (veja abaixo)
4. Divide o trabalho em fases incrementais, ordenadas por dependência
5. Detalha as tarefas e marca dependências (sequencial ou paralelo)
6. Apresenta o plano, discute ajustes e confirma com você antes de seguir

Todos os status começam como não iniciados (⏳). Ao longo do `eng.work` eles passam a em progresso (⏰), completada (✅) ou bloqueada (🚫), sempre com **uma só fase em progresso por vez**.

### Calibração do plano

| Tipo de trabalho | Ajuste |
|---|---|
| `hotfix` | 1 a 2 fases, foco cirúrgico |
| `bugfix` | 2 a 3 fases, com uma fase de teste que reproduz o bug |
| `feature` | Fases completas, todas as validações |
| `refactor` | Fase 0 obrigatória de testes antes de qualquer mudança |

Por cargo: `JUNIOR`/`PLENO` recebem mais detalhe e mais checkpoints; `SENIOR` e acima, fases maiores.
Por `MAX_AI_EXECUTION_PERCENTAGE`: de 80% para cima, plano completo validado no final; de 70 a 79%, primeiro um resumo e o detalhe depois da aprovação; de 60 a 69%, cada fase é aprovada antes de ser detalhada.

## Regras que importam

- **Só planejamento:** não escreve código, não altera arquivos do projeto, não roda build nem testes
- Fases maiores que 1 hora e tarefas vagas ("implementar a feature") não valem
- O plano só está pronto quando você o **valida**
- Tudo em português (pt-BR)

## Próximo passo típico

[`eng.work`](./eng.work.md)
