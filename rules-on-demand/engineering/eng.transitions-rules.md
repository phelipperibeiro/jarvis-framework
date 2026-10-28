> **Applies to:** HUB: all | POSITION: all | AREA: ENGINEERING | SQUAD: all

# Regras das transições do ciclo de engenharia

## Objetivo

Dar fluidez ao ciclo `eng.start → eng.plan → eng.work → eng.pre-pr → eng.pr → eng.spec-consolidate` com perguntas nos pontos de início e de transição, sem mudar nada para quem prefere o fluxo de sempre.

## Escopo

Lida pelos workflows `eng.start`, `eng.plan`, `eng.work`, `eng.pre-pr` e `eng.pr` (cada um manda ler este arquivo). Vale para as perguntas da tabela "Transições" abaixo. A regra 5 (consolidado de links) vale também para a mensagem final do `eng.spec-consolidate`, que fecha o ciclo.

## Regras

### Obrigatório

1. **A opção padrão mantém o fluxo atual.** É a primeira (ou a marcada como padrão) e diz o que acontece, com "(como hoje)" ou o nome do fluxo. **Nunca** se chama "Ignorar": quem a escolhe não pula nada, segue o fluxo de sempre e interage com o documento como sempre fez.
2. **Formato:** `AskUserQuestion`, uma pergunta por decisão, no máximo 4 opções. **Não liste "Outros"**: o `AskUserQuestion` já o acrescenta sozinho para o texto livre, e listá-lo gasta uma das 4 vagas. Sem `AskUserQuestion`, use a tabela de opções de `prod-rules.md`.
3. **A resposta é a aprovação.** "Aprovar e seguir" ou "Aprovar e parar aqui" valem como a aprovação explícita que as rules de cada comando exigem. Sem uma dessas respostas, nada avança.
4. **Seguir para o próximo comando:** se a IDE permite chamar outro comando (no Claude Code, pelo Skill tool), chame-o com o mesmo `{TASK_MANAGER_KEY}`; senão, mostre o comando pronto para colar.
5. **Consolidado de links, acumulado a cada etapa.** Ao terminar e antes de **cada pergunta de transição** (todas as da tabela "Transições", inclusive as do início, como "O que fazer com o PR?", e mesmo quando a pergunta é repetida), cada comando mostra o bloco "📄 Arquivos da sessão" com **todos** os arquivos que já existem na sessão, e não só os da etapa, para que a lista fique sempre visível até o `eng.spec-consolidate`:
   - Ordem do ciclo: `context.md`, `architecture.md`, `plan.md`, as rodadas anteriores `gate-checklist-rodada-{N}.md` (uma por rodada, em ordem crescente do número do nome, se houver), `gate-checklist.md`, `pull-request.md`, `daily.md`, as versões `{nome}.public.md` (se houver) e os arquivos de `consolidation/` (do `eng.spec-consolidate`). Só entra o que existe.
   - Cada item é um link markdown com caminho relativo ao workspace (ex.: `[architecture.md](.jarvis/sessions/eng/TASK-123/architecture.md)`), seguido de uma **nota curta de estado** entre parênteses: `novo` ou `atualizado` quando foi gerado ou alterado nesta etapa, mais o que mudou ou o que o arquivo contém (ex.: `plan.md (atualizado, com comentários por fase)`, `architecture.md (aprovado; 5 questões decididas)`, `daily.md (novo; aprovado, com timesheet)`, `gate-checklist-rodada-1.md (rodada 1; 27 lacunas)`, `gate-checklist.md (rodada 2, atual; 13 lacunas)`). Os arquivos que não mudaram na etapa aparecem sem nota ou com o estado em que ficaram.
   - A lista é **reimpressa inteira** a cada etapa, sem esconder os arquivos anteriores.
   - Logo abaixo, "🔗 Links" com o card/issue e, quando existir, o PR/MR.
   - **Antes de cada pergunta de transição**, escreva primeiro essa mensagem em markdown, com o resumo, e só então abra o `AskUserQuestion`. Isso vale também para as perguntas que não dependem de um arquivo: a lista é o mapa de onde a tarefa está no ponto de decisão. Na pergunta que depende de um arquivo (`architecture.md`, `plan.md`, `gate-checklist.md`, `pull-request.md`, `daily.md`), o resumo é o desse arquivo. A pergunta fica curta, só com a decisão e o nome do arquivo em texto simples; ela espera a resposta enquanto a pessoa abre e lê com calma. Não dependa do link dentro do `AskUserQuestion`.
6. **Limites que nenhuma escolha dispensa:** `MAX_AI_EXECUTION_PERCENTAGE`, testes e lint passando, e a parada em questão nova em aberto.

### Proibido

- Pergunta nova sem a opção que mantém o fluxo atual.
- Avançar para o próximo comando sem a resposta do usuário.
- Usar a escolha de um comando para contornar o `MAX_AI_EXECUTION_PERCENTAGE`.

### Transições

| Comando | Quando | Pergunta | Opções (padrão primeiro) |
|---|---|---|---|
| `eng.start` | Início, só **sem Advisor** | "Como tratar as questões em aberto que surgirem?" | Tratar no architecture.md (como hoje) · Uma a uma, assim que surgirem |
| `eng.start` | Fim, só **sem Advisor** | "Aprovar o architecture.md?" | Aprovar e parar aqui (como hoje) · Aprovar e seguir para o `/eng.plan` · Ajustar o documento |
| `eng.plan` | Fim | "O que fazer com o plano?" | Aprovar e implementar agora · Aprovar e seguir manualmente (como hoje) · Ajustar o plano |
| `eng.work` | Início | Execução | Fase a fase, com aprovação (como hoje) · Todas de uma vez ("N de M tarefas", pelo limite) |
| `eng.work` | Início | Commits | Um por fase (como hoje) · Um commit só ao final |
| `eng.work` | Início | Depois do work | Rodar o `/eng.pre-pr` · Rodar o `/eng.pr` · Fluxo normal (como hoje: o usuário segue os próximos comandos manualmente) |
| `eng.pre-pr` | Fim | Com lacunas: "Como seguir?" (depois da mensagem com o link do relatório) | Corrigir as lacunas agora · Parar aqui para corrigir à mão (como hoje) · Abrir o PR assim mesmo |
| `eng.pre-pr` | Fim | Sem lacunas: "Como seguir?" | Abrir o PR agora · Parar aqui (como hoje) |
| `eng.pre-pr` | Fim | Variante B do fechamento (sem 🔴 pendente nem 🟡 herdada com `🔧 Corrigir`; só ⚪ sem decisão, ou 🟡 com o teto atingido): "Restam {c} lacunas ⚪… Como seguir?" (substitui as perguntas 2 e 4 do fechamento) | Aceitar as ⚪ e seguir para o PR · Corrigir antes do PR · Só gerar o relatório (como hoje) |
| `eng.pr` | Início | "O que fazer com o PR?" | Revisar o texto e publicar (como hoje) · Publicar sem revisar o texto · Só gerar os arquivos (o usuário abre o PR à mão; quem escolheu revisar também tem o `[Só gerar os arquivos]` na revisão da 4.2) |
| `eng.pr` | Fim | "O PR já foi aprovado e mergeado?" | Ainda não (como hoje) · Sim, rodar o `/eng.spec-consolidate` |

Nas perguntas "Depois do work", "O que fazer com o plano?" e na variante B do fechamento do `eng.pre-pr`, a opção "como hoje" não é a primeira (em "Depois do work" e na variante B fica por último), por escolha de produto: as primeiras opções são as ações que o usuário mais quer. Na variante B, a #191 pede "Aceitar as ⚪ e seguir para o PR" como primeira opção (a recomendada), para lacunas menores não gerarem mais uma rodada. Mesmo assim, é o fluxo que vale quando o usuário não escolhe.

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
