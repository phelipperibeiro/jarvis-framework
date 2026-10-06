# `/eng.start` — iniciar uma tarefa

Workflow: `workflows/engineering/eng.start.md` · Regras: `rules-on-demand/engineering/eng.start-rules.md`

## Em uma frase

Investiga a tarefa, tira as dúvidas com você e escreve o `architecture.md`: o documento que diz **o que muda e por quê**, antes de qualquer código.

## O que é

É a primeira etapa do ciclo de engenharia. O comando **só planeja**. O único documento que produz é o `architecture.md`, guardado na pasta de sessão da tarefa (`.jarvis/sessions/eng/{TASK_MANAGER_KEY}/`).

Além do documento, ele prepara o ambiente: cria a **branch de feature** a partir de `dev` (padrão `{TASK_MANAGER_KEY}-{titulo-em-kebab-case}`, reaproveitando a branch se você já estiver nela) e a pasta da sessão, com o `TASK_MANAGER_KEY` em minúsculas.

## Quando usar

- Ao começar uma feature, tarefa ou refactor
- Antes de [`eng.plan`](./eng.plan.md) e [`eng.work`](./eng.work.md)
- Quando você quer alinhar arquitetura e riscos antes de escrever código

## Quando **não** usar

- Você quer implementar direto → [`eng.work`](./eng.work.md) (exige `plan.md`, que exige `architecture.md`)
- Bug em produção que precisa de diagnóstico → [`eng.debug`](./eng.debug.md)

## Como funciona

1. **Identifica a tarefa.** Se você não passou o `TASK_MANAGER_KEY`, ele pergunta. Sem board configurado (modo freelance), você informa um número de controle próprio
2. **Calibra o contexto** (CDD) e confirma com você; em seguida pergunta se você quer usar o **Advisor** nas questões em aberto e, se sim, com qual modelo (lista `ADVISOR_MODELS` do `ENV.md`)
3. **Prepara o ambiente:** branch de feature e pasta da sessão
4. **Entende a tarefa:** coleta informações, busca documentação central se estiver configurada e faz de 3 a 5 perguntas de clarificação
5. **Investiga o código** (somente leitura): padrões, documentação existente e estratégia de testes
6. **Escreve o `architecture.md`** pelo template, com componentes impactados reais, decisões justificadas, riscos com mitigação e estratégia de testes. Tudo que for diferente do código ou ambíguo no card vira uma **questão em aberto** (seção 8), com no mínimo 3 opções; com Advisor, a sugestão dele é a decisão adotada e fica registrada num comentário de auditoria na issue
7. **Apresenta e itera** até você aprovar de forma explícita (com Advisor e autonomia alta no CDD, apresenta o resumo e segue para o `eng.plan`)
8. Lembra você de mover o card para "Em progresso" (quando há board)

## Regras que importam

- **Só planejamento:** não escreve código, não executa, não commita
- **Nunca cria branch a partir de `main`/`master`**, sempre de `dev`
- **Nunca avança sozinho:** só termina com aprovação explícita do documento, exceto com o Advisor habilitado e autonomia alta no CDD
- **Advisor (opcional):** um subagente (`eng.advisor.agent`) com o modelo que você escolher, consultado só nas questões em aberto; os prompts e o modelo de auditoria ficam em `templates/engineering/advisor-template.md`. A lista de modelos oferecidos vem de `ADVISOR_MODELS` no `ENV.md`; no Claude Code só a família do modelo é respeitada
- **No card, só eventos relevantes:** auditoria do Advisor (quando usado); nada de comentário de início ou fim
- **Não assume requisitos:** distingue fato de suposição e pergunta
- **Stack do projeto:** em trabalho de backend ou de frontend, carrega a skill base mais as **especializações** registradas no `ENV.md` (`BACKEND_SPECIALIZATIONS` e `FRONTEND_SPECIALIZATIONS`); se algum skill instalado não tem `metadata.area`, **o comando é interrompido** ([especializações de stack](../especializacoes-de-stack.md))
- Toda feature precisa registrar em `architecture.md` os pontos de segurança (dados sensíveis, superfície de ataque, modelo de auth), ou declarar "sem superfície de segurança identificada"

## Próximo passo típico

[`eng.plan`](./eng.plan.md) → [`eng.work`](./eng.work.md)
