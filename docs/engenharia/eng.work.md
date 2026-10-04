# `/eng.work` — implementar o plano

Workflow: `workflows/engineering/eng.work.md` · Regras: `rules-on-demand/engineering/eng.work-rules.md`

## Em uma frase

Escreve o código e os testes, fase por fase, seguindo o `plan.md`, sempre pedindo sua aprovação antes de começar e depois de terminar cada fase.

## O que é

É a etapa de codificação do ciclo. Ela lê o `plan.md`, pega a fase atual (em progresso ou a primeira não iniciada) e executa uma fase de cada vez, atualizando o plano com o progresso e comentários (decisões, mudanças, aprendizados).

## Quando usar

- Depois de [`eng.start`](./eng.start.md) e [`eng.plan`](./eng.plan.md) aprovados
- Para retomar uma implementação interrompida (o plano diz onde parou)

## Quando **não** usar

- Não existe `plan.md` → o comando não prossegue; rode [`eng.plan`](./eng.plan.md)
- Você está em `main`, `master`, `develop`, `staging` ou `homolog` → o comando bloqueia; use uma branch de feature (o [`eng.start`](./eng.start.md) cria)
- Abrir MR ou dar push → [`eng.pr`](./eng.pr.md)

## Como funciona

Para cada fase do plano:

1. **Apresenta o plano de abordagem:** tarefas, arquivos a criar e modificar, pontos de atenção. **Para e aguarda sua aprovação**
2. **Implementa** o código seguindo os padrões do projeto
3. **Valida localmente:** lint, testes e build
4. **Analisa e implementa testes:** identifica lacunas e escreve os testes que faltam, depois revalida
5. **Apresenta o resultado** para você validar e itera se precisar
6. **Atualiza o `plan.md`:** marca as tarefas como completadas e registra comentários
7. **Faz o commit da fase**, com arquivos adicionados um a um e a chave da tarefa na mensagem
8. **Pergunta** se você quer iniciar a próxima fase e espera a resposta

## O limite da IA

O comando respeita `MAX_AI_EXECUTION_PERCENTAGE` do `ENV.md` (padrão 80, mínimo 60, máximo 100). Ele conta as tarefas do plano e executa só até `floor(total × MAX / 100)`. Ao atingir o limite, **para**, conta o que fez, lista o que sobrou e pergunta como você quer continuar. Ele nunca contorna esse limite. As tarefas restantes ele pode ajudar a explicar, mas quem executa é você.

Exemplo: plano com 10 tarefas e `MAX=80` → a IA executa 8 e para.

## Regras que importam

- **Não faz push nem abre PR** (isso é do `eng.pr`)
- **Nunca usa `git add .`** e nunca commita sem sua aprovação da fase nem com testes falhando
- **Não move cards** no board
- **Stack do projeto:** em trabalho de backend ou de frontend, carrega a skill base mais as **especializações** registradas no `ENV.md` (`BACKEND_SPECIALIZATIONS` e `FRONTEND_SPECIALIZATIONS`); se algum skill instalado não tem `metadata.area`, **o comando é interrompido** ([especializações de stack](../especializacoes-de-stack.md))
- Se surgir um bloqueio técnico, registra no plano como bloqueada (🚫), explica e sugere alternativas
- Se você pedir commit antes da fase terminar, ele explica que o commit é feito ao final da fase validada

## Próximo passo típico

Revise o código e os commits, e depois [`eng.pre-pr`](./eng.pre-pr.md) → [`eng.pr`](./eng.pr.md)
