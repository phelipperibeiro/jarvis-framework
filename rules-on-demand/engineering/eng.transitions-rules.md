> **Applies to:** HUB: all | POSITION: all | AREA: ENGINEERING | SQUAD: all

# Regras das transições do ciclo de engenharia

## Objetivo

Dar fluidez ao ciclo `eng.start → eng.plan → eng.work → eng.pre-pr → eng.pr → eng.spec-consolidate` com perguntas nos pontos de início e de transição, sem mudar nada para quem prefere o fluxo de sempre.

## Escopo

Lida pelos workflows `eng.start`, `eng.plan`, `eng.work`, `eng.pre-pr` e `eng.pr` (cada um manda ler este arquivo). Vale para as perguntas da tabela "Transições" abaixo.

## Regras

### Obrigatório

1. **A opção padrão mantém o fluxo atual.** É a primeira (ou a marcada como padrão) e diz o que acontece, com "(como hoje)" ou o nome do fluxo. **Nunca** se chama "Ignorar": quem a escolhe não pula nada, segue o fluxo de sempre e interage com o documento como sempre fez.
2. **Formato:** `AskUserQuestion`, uma pergunta por decisão, no máximo 4 opções. Sem `AskUserQuestion`, use a tabela de opções de `prod-rules.md`.
3. **A resposta é a aprovação.** "Aprovar e seguir" ou "Aprovar e parar aqui" valem como a aprovação explícita que as rules de cada comando exigem. Sem uma dessas respostas, nada avança.
4. **Seguir para o próximo comando:** se a IDE permite chamar outro comando (no Claude Code, pelo Skill tool), chame-o com o mesmo `{TASK_MANAGER_KEY}`; senão, mostre o comando pronto para colar.
5. **Limites que nenhuma escolha dispensa:** `MAX_AI_EXECUTION_PERCENTAGE`, testes e lint passando, e a parada em questão nova em aberto.

### Proibido

- Pergunta nova sem a opção que mantém o fluxo atual.
- Avançar para o próximo comando sem a resposta do usuário.
- Usar a escolha de um comando para contornar o `MAX_AI_EXECUTION_PERCENTAGE`.

### Transições

| Comando | Quando | Pergunta | Opções (padrão primeiro) |
|---|---|---|---|
| `eng.start` | Início, só **sem Advisor** | "Como tratar as questões em aberto que surgirem?" | Tratar no architecture.md (como hoje) · Uma a uma, assim que surgirem |
| `eng.start` | Fim, só **sem Advisor** | "Aprovar o architecture.md?" | Aprovar e parar aqui (como hoje) · Aprovar e seguir para o `/eng.plan` · Ajustar o documento |
| `eng.plan` | Fim | "Aprovar o plan.md?" | Aprovar e parar aqui (como hoje) · Aprovar e seguir para o `/eng.work` · Ajustar o plano |
| `eng.work` | Início | Execução | Fase a fase, com aprovação (como hoje) · Todas de uma vez ("N de M tarefas", pelo limite) |
| `eng.work` | Início | Commits | Um por fase (como hoje) · Um commit só ao final |
| `eng.work` | Início | Depois do work | Sugerir o `/eng.pre-pr` (como hoje) · Rodar o `/eng.pre-pr` na sequência · Ir direto para o `/eng.pr` · Parar aqui |
| `eng.pre-pr` | Fim | "Seguir para o `/eng.pr`?" | Parar aqui para ajustar (como hoje) · Seguir para o `/eng.pr` |
| `eng.pr` | Início | "Como validar o PR?" | Revisar o texto e confirmar a publicação aqui (como hoje) · Publicar direto e validar no PR |
| `eng.pr` | Fim | "O PR já foi aprovado e mergeado?" | Ainda não (como hoje) · Sim, rodar o `/eng.spec-consolidate` |

**Com Advisor**, o `eng.start` não ganha pergunta nova: o Advisor decide as questões em aberto e o gate do fim segue a autonomia do `context.md`, como já estava.

### Recomendado

- Mostre, na própria opção, o que muda na prática (ex.: "Todas de uma vez (6 de 6 tarefas)").
- No `eng.work`, grave as escolhas no cabeçalho do `plan.md`; numa retomada, pergunte uma vez se mantém.

## Exceções

- O usuário pode dar as escolhas em texto livre ("faça todas as fases, um commit, direto ao PR"); valem como as respostas das perguntas correspondentes. É o "Escape Hatch" de `eng-rules.md` ("o usuário pode sempre fazer override de qualquer regra contextual com instrução explícita").

## Referências

- `workflows/engineering/eng.{start,plan,work,pre-pr,pr}.md`
- `rules/engineering/eng-rules.md` (`MAX_AI_EXECUTION_PERCENTAGE`)
- `rules/product/prod-rules.md` (formato sem `AskUserQuestion`)
