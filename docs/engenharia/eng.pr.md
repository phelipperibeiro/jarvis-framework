# `/eng.pr` — abrir o merge request

Workflow: `workflows/engineering/eng.pr.md` · Regras: `rules-on-demand/engineering/eng.pr-rules.md`

## Em uma frase

Confere que tudo está passando, envia a branch e abre o merge request (ou pull request) com a descrição preenchida.

## O que é

É a etapa de entrega do ciclo. A branch nasceu no [`eng.start`](./eng.start.md) e os commits foram feitos pelo [`eng.work`](./eng.work.md); aqui o comando valida, faz o push e cria o MR/PR pelo adapter do seu vendor (`VERSION_CONTROL`: GitLab, GitHub ou Bitbucket).

## Quando usar

- Depois do [`eng.pre-pr`](./eng.pre-pr.md) com semáforo verde ou amarelo, e com sua autorização
- Quando a implementação está validada e você quer abrir o MR

## Quando **não** usar

- Você está em `main`, `master`, `develop`, `staging` ou `homolog` → bloqueado
- A branch não contém a chave da tarefa → o comando pede confirmação de que é a branch certa
- Ainda quer revisar a qualidade → [`eng.pre-pr`](./eng.pre-pr.md)

## Como funciona

1. **Valida:** testes, lint e build (e testes automatizados opcionais, se o projeto estiver rodando). Se algo falhar, corrige antes de seguir
2. **Verifica a branch:** confirma a branch ativa, a branch de destino e os commits
3. **Gera o `pull-request.md`** na sessão (`.jarvis/sessions/eng/{TASK_MANAGER_KEY}/`), a partir do template e do PR Brief do `gate-checklist.md`, e pede sua aprovação
4. **Pergunta Sim / Não: publicar o PR agora?** Com Não, o arquivo fica na sessão e nada é enviado
5. Com Sim: **push** e **cria o MR/PR** com o texto aprovado
6. **Posta o link do MR no card** (um único comentário) e orienta a mover para "In Review" (quando há board)
7. **Processa o code review:** analisa os comentários e aplica correções
8. **Registra métricas de lead time**
9. **Registra o esforço em `daily.md`** (só com PR aberto), na sessão e nunca publicado:
   - pergunta a data (hoje ou retroativa);
   - se o período passar de um dia, pergunta sobre sábado/domingo trabalhados, feriados e outros dias não trabalhados, para contar os dias trabalhados;
   - usa o formato *post mortem* em `bugfix`/`hotfix` ou com mais de 1 dia trabalhado (senão, pergunta);
   - numa nova execução, pergunta se a mudança foi ajuste seu (o texto foca no que foi entregue) ou pedido da liderança (a mudança fica documentada);
   - mostra a descrição detalhada e a linha de timesheet juntas para você aprovar ou ajustar.
10. **Mensagem final**, com a linha de timesheet pronta para copiar e o lembrete do [`/eng.spec-consolidate`](./eng.spec-consolidate.md)

A sessão **não é apagada**: o `/eng.spec-consolidate` precisa dela. Remova à mão quando quiser.

## Perguntas que ele faz

- **No início:** "Como validar o PR?" → **Revisar o texto e confirmar a publicação aqui (como hoje)** ou **Publicar direto e validar no PR** (pula a revisão do texto e o "Publicar agora?").
- **No fim:** "O PR já foi aprovado e mergeado?" → **Ainda não (como hoje)** ou **Sim, rodar o `/eng.spec-consolidate`**, que registra no Central docs o que a entrega implementou.

## Regras que importam

- Nome da branch: `{TASK_MANAGER_KEY}-{titulo-em-kebab-case}`
- Commit de uma linha, começando pela chave da tarefa: `TASK-123 feat(auth): implementar autenticação JWT`
- Destino do MR: a `Branch base:` escolhida no `/eng.start` (gravada no `architecture.md`); só pergunta se o campo faltar
- **Nunca** `git add .`, push direto para `main`/`dev`, commit sem a chave da tarefa nem menção a IA no MR
- PR que toca auth, inputs, APIs públicas ou permissões leva o label `security`
- Nunca aprova um PR com secret no diff

## Próximo passo típico

[`/eng.spec-consolidate`](./eng.spec-consolidate.md) para registrar no Central docs o que foi implementado; depois, aguardar o code review e concluir o card no board.
