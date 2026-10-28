# `/eng.pr` — abrir o merge request

Workflow: `workflows/engineering/eng.pr.md` · Regras: `rules-on-demand/engineering/eng.pr-rules.md`

## Em uma frase

Confere que tudo está passando, envia a branch e abre o merge request (ou pull request) com a descrição preenchida.

## O que é

É a etapa de entrega do ciclo. A branch nasceu no [`eng.start`](./eng.start.md) e os commits foram feitos pelo [`eng.work`](./eng.work.md); aqui o comando valida, faz o push e cria o MR/PR pela CLI do seu host (`gh` no GitHub, `glab` no GitLab), com o login dela.

## Quando usar

- Depois do [`eng.pre-pr`](./eng.pre-pr.md) com semáforo verde ou amarelo, e com sua autorização
- Quando a implementação está validada e você quer abrir o MR

## Quando **não** usar

- Você está em `main`, `master`, `develop`, `staging` ou `homolog` → bloqueado
- A branch não contém a chave da tarefa → o comando pede confirmação de que é a branch certa
- Ainda quer revisar a qualidade → [`eng.pre-pr`](./eng.pre-pr.md)

## Como funciona

1. **Pergunta o que fazer com o PR** (é a Fase 0 do workflow, feita antes de tudo; regra de ouro): **Revisar o texto e publicar**, **Publicar sem revisar o texto** ou **Só gerar os arquivos**. Essa escolha vale como a pergunta do push e do PR
2. **Valida:** testes, lint e build (e testes automatizados opcionais, se o projeto estiver rodando). Se algo falhar, corrige antes de seguir
3. **Verifica a branch:** confirma a branch ativa, a branch de destino e os commits
4. **Gera o `pull-request.md`** na sessão (`.jarvis/sessions/eng/{TASK_MANAGER_KEY}/`), a partir do template e do PR Brief do `gate-checklist.md`, e mostra o texto para a sua aprovação, se na Fase 0 você escolheu "Revisar o texto e publicar" ou "Só gerar os arquivos" ("Publicar sem revisar o texto" pula essa revisão). Na revisão de quem escolheu "Revisar o texto e publicar" aparece também o botão `[Só gerar os arquivos]`, que troca a escolha da Fase 0 por essa. Com "Só gerar os arquivos" (na Fase 0 ou no botão), o arquivo fica na sessão e nada é enviado
5. Se você escolheu publicar: **push** e **cria o MR/PR** com o texto aprovado. Com `VERSION_CONTROL_ACCESS=manual`, CLI sem login ou saída 3, nada é enviado: fica o `pull-request.md` e o link para abrir à mão. Com saída 4 (erro depois de enviar), não repita: confira no host se o MR/PR foi criado
6. **Mostra o comentário com o link do MR e pergunta; com o Sim, posta no card** (um único comentário), e orienta a mover para "In Review" (quando há board; o Jarvis não move card)
7. **Processa o code review:** analisa os comentários e aplica correções; o push das correções só sai depois da pergunta (regra de ouro)
8. **Registra métricas de lead time**
9. **Registra o esforço em `daily.md`** (com ou sem PR publicado), na sessão e nunca publicado:
   - pergunta a data (hoje ou retroativa);
   - se o período passar de um dia, pergunta sobre sábado/domingo trabalhados, feriados e outros dias não trabalhados, para contar os dias trabalhados;
   - usa o formato *post mortem* em `bugfix`/`hotfix` ou com mais de 1 dia trabalhado (senão, pergunta);
   - numa nova execução, pergunta se a mudança foi ajuste seu (o texto foca no que foi entregue) ou pedido da liderança (a mudança fica documentada);
   - mostra a descrição detalhada e a linha de timesheet juntas para você aprovar ou ajustar;
   - o [`/eng.daily-report`](./eng.daily-report.md) junta esses registros por dia, de todas as sessões.
10. **Mensagem final** ("Merge request criado" ou "PR não publicado", conforme a etapa 5 terminou com PR no host), com a linha de timesheet pronta para copiar, os labels sugeridos no PR Brief (a pessoa adiciona no host) e o lembrete do [`/eng.spec-consolidate`](./eng.spec-consolidate.md)

A sessão **não é apagada**: o `/eng.spec-consolidate` precisa dela. Remova à mão quando quiser.

## Perguntas que ele faz

- **No início:** "O que fazer com o PR?" → **Revisar o texto e publicar (como hoje)**, **Publicar sem revisar o texto**, **Só gerar os arquivos** (o texto ainda é mostrado para revisão; você abre o PR à mão e nada é enviado). Na revisão do texto de quem escolheu "Revisar o texto e publicar", o botão `[Só gerar os arquivos]` faz o mesmo.
- **No fim:** "O PR já foi aprovado e mergeado?" → **Ainda não (como hoje)** ou **Sim, rodar o `/eng.spec-consolidate`**, que registra no Central docs o que a entrega implementou.

## Regras que importam

- Nome da branch: `{TASK_MANAGER_KEY}-{titulo-em-kebab-case}`
- Commit de uma linha, começando pela chave da tarefa: `TASK-123 feat(auth): implementar autenticação JWT`
- Destino do MR: a `Branch base:` escolhida no `/eng.start` (gravada no `architecture.md`); só pergunta se o campo faltar
- **Nunca** `git add .`, push direto para `main`/`dev`, commit sem a chave da tarefa nem menção a IA no MR
- PR que toca auth, sessions, RBAC, CORS, CSP ou permissões (`eng-security-rules.md`) leva o label `security`: o PR Brief do `eng.pre-pr` registra, a mensagem final do `eng.pr` lembra e **a pessoa** o adiciona no host (a criação do MR pela CLI não põe label; o Jarvis não altera o PR sem perguntar)
- Nunca aprova um PR com secret no diff
- **Links no PR:** o `pull-request.md` sai do workspace, então issue, PR, card e código viram URL absoluta (código no `blob/{sha}` do commit enviado), e a sessão e o `docs/jarvis/` ficam em texto (`rules-on-demand/doc-links-rules.md`)

## Próximo passo típico

[`/eng.spec-consolidate`](./eng.spec-consolidate.md) para registrar no Central docs o que foi implementado; depois, aguardar o code review e concluir o card no board.
