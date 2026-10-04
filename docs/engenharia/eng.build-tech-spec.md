# `/eng.build-tech-spec` — Tech Spec a partir de um card

Workflow: `workflows/engineering/eng.build-tech-spec.md` · Regras: `rules-on-demand/engineering/eng.tech-spec-rules.md` · Template: `templates/engineering/tech-spec-template.md`

## Em uma frase

Transforma um épico ou uma história do board em uma **Tech Spec**: decisões arquiteturais justificadas, plano de implementação, riscos, testes e (para histórias) subtarefas prontas para virar cards.

## O que é

A Tech Spec é o documento técnico auto-contido de um card: um desenvolvedor deve conseguir executá-la sem precisar perguntar. Ela **é salva na sessão** (`.jarvis/sessions/eng/{card}/tech-spec.md`) e anexada ao card, que é a fonte da verdade.

> **Restrito a `POSITION=TECH LEAD`.** Se o seu cargo no `ENV.md` for outro, o comando responde "Acesso Negado" e para.

## Quando usar

- Antes de implementar uma história ou épico que precisa de especificação técnica detalhada
- Quando o time quer subtarefas bem definidas para distribuir o trabalho

## Quando **não** usar

- Você quer o fluxo enxuto de planejamento de uma tarefa → [`eng.start`](./eng.start.md)
- Só quer quebrar uma Tech Spec que já existe → [`eng.breakdown-subtasks`](./eng.breakdown-subtasks.md)
- A decisão ainda está em discussão → [`eng.create-rfc`](./eng.create-rfc.md)

## Como funciona

O comando começa **detectando se o card é um épico ou uma história** (e pergunta se não conseguir inferir). O tipo decide o resto do fluxo.

**Etapas comuns**

1. **Entendimento profundo:** lê o card, o contexto de negócio, valida pré-requisitos e faz perguntas de clarificação
2. **Validação de necessidade de RFC:** checa 8 critérios (impacta mais de uma squad, altera arquitetura ou infra, nova dependência crítica, custo recorrente, SLA ou contratos, lock-in, dados sensíveis, padrão reutilizável). Se qualquer um se aplicar, o RFC é obrigatório: você cria um, vincula um existente ou segue sem RFC justificando

**Caminho A: épico → Tech Spec arquitetural**

Investigação arquitetural, proposta (decisões, desenho, contratos, riscos), apresentação a você e geração do documento `tech-spec-arch.md`. **Não quebra em subtarefas**, porque a quebra em histórias vem de Produto.

**Caminho B: história → Tech Spec de implementação**

Investigação técnica do codebase, **avaliação de complexidade**, proposta arquitetural, quebra em subtarefas, riscos e considerações, criação do `tech-spec.md`, criação das subtarefas no board (ou um template para você criar) e validação final.

## Regras que importam

- **Nunca inventa dados**; se não souber, pergunta
- Toda decisão arquitetural tem justificativa, com pelo menos duas alternativas consideradas
- Toda Tech Spec documenta riscos com mitigação
- Subtarefas são **fatias verticais completas** (endpoint inteiro, modal inteiro, tela inteira) e nunca fatias horizontais (só enum, só repository, só DTO)

## Próximo passo típico

[`eng.breakdown-subtasks`](./eng.breakdown-subtasks.md) → [`eng.qa-quality-gate-validation`](./eng.qa-quality-gate-validation.md) → [`eng.start`](./eng.start.md) em cada subtarefa
