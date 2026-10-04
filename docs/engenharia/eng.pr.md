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
3. **Push** para o remote
4. **Cria o MR/PR** com o template: descrição, link para a tarefa, mudanças, testes realizados e checklist
5. **Registra no card** e orienta a mover para "In Review" (quando há board)
6. **Processa o code review:** analisa os comentários e aplica correções
7. **Registra métricas de lead time** e mostra a mensagem final
8. **Limpa a sessão** (`.jarvis/sessions/eng/{TASK_MANAGER_KEY}/`), **pedindo confirmação antes**

## Regras que importam

- Nome da branch: `{TASK_MANAGER_KEY}-{titulo-em-kebab-case}`
- Commit de uma linha, começando pela chave da tarefa: `TASK-123 feat(auth): implementar autenticação JWT`
- Destino do MR: a branch que você indicar (normalmente `develop`; `main` só para hotfix)
- **Nunca** `git add .`, push direto para `main`/`dev`, commit sem a chave da tarefa nem menção a IA no MR
- PR que toca auth, inputs, APIs públicas ou permissões leva o label `security`
- Nunca aprova um PR com secret no diff

## Próximo passo típico

Aguardar o code review, corrigir se houver comentários e concluir o card no board.
