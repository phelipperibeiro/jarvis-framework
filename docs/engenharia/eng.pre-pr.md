# `/eng.pre-pr` — rever lacunas antes do PR

Workflow: `workflows/engineering/eng.pre-pr.md` · Regras: `rules-on-demand/engineering/eng.pre-pr-rules.md`

## Em uma frase

Revê a branch atrás de lacunas (produto, código, testes, segurança, documentação) e gera o **`gate-checklist.md`** na sessão, com um semáforo, para você decidir o que ajustar antes do PR.

## O que é

É a revisão de qualidade que fica entre o [`eng.work`](./eng.work.md) e o [`eng.pr`](./eng.pr.md). Ela avalia **só as mudanças da sua branch** em relação à branch base e aciona agentes e skills especializados conforme o que a branch tocou. **Ela só aponta:** não corrige código, não escreve testes, não atualiza documentação e não publica nada.

## Quando usar

- Quando a implementação terminou e você quer chegar ao PR sem surpresa
- Depois de qualquer correção grande que mexeu na branch (rodar de novo guarda o relatório anterior como `gate-checklist-rodada-{N}.md`)

## Quando **não** usar

- Você está em `main`, `master`, `develop`, `staging` ou `homolog` → bloqueado
- Quer só criar o MR → [`eng.pr`](./eng.pr.md) (mas o `eng.pre-pr` deve vir antes)
- Quer só revisar código de outra pessoa → [`eng.review`](./eng.review.md)

## Como funciona

O comando percorre "gates" de revisão. Alguns sempre rodam, outros só quando a branch pede:

| Gate | Quando |
|---|---|
| Alinhamento com os docs do projeto (`prod.pm-checker`) | Sempre |
| Revisão de código (`eng.dev-code-reviewer`) | Sempre |
| Lacunas de cobertura de testes (`test-planner`) | Sempre |
| Requisitos não funcionais: performance, segurança, quality gates (`test-architect`) | Se a feature tiver requisitos assim |
| Testes automatizados nas mudanças (`eng-qa` + especialização registrada) | Sempre |
| Revisão de interface: TypeScript, tokens, acessibilidade (`eng.frontend.agent`) | Se houver mudança de UI |
| Usabilidade: estados vazios, carregando, mensagens de erro (`eng.ux-designer`) | Se houver nova feature de UI ou mudança de fluxo |
| Documentação desatualizada (`eng.docs-writer`, sem editar) | Sempre |
| Revisão de segurança (checklist inline: sanitização, auth guards, headers, secrets, `npm audit`) | Se tocar auth, sessões, inputs, CORS, CSP, permissões ou endpoints públicos |


## O resultado

Sempre termina com o arquivo **`$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/gate-checklist.md`**:

1. **Semáforo:** 🟢 pronto para PR, 🟡 pode abrir com notas, 🔴 há bloqueadores
2. **Lacunas por área**, cada uma com: o que é, onde (`arquivo:linha`), por que importa, sugestão, severidade e a coluna **Decisão**, que você preenche (Corrigir / Aceitar + motivo; ou "Só gerar o relatório" para analisar com calma, sem decidir agora)
3. **Evidências** (comandos rodados e resultados) e o **PR Brief**, que o `eng.pr` aproveita

**Rodadas:** se você rodar o `eng.pre-pr` de novo na mesma sessão (por exemplo, depois de corrigir lacunas com o `eng.work`), o relatório anterior não se perde: ele vira `gate-checklist-rodada-{N}.md`, e o `gate-checklist.md` passa a ser a rodada nova. Ela mostra o número da **Rodada**, o **Commit** em que foi gerada, os links das **Rodadas anteriores** e a **Resolução da rodada anterior**: para cada lacuna que você marcou como "Corrigir", se foi corrigida e em qual commit. O `eng.pr` usa sempre o `gate-checklist.md`, a rodada mais recente.

Depois, com board, pergunta se registra o resultado como comentário no card: **Não, manter só na sessão (como hoje)**, **Sim, só o resumo** ou **Sim, o relatório completo**. Sem board (freelance), não pergunta e o relatório fica só na sessão. E **espera sua permissão** antes do `eng.pr`.

## Perguntas que ele faz

- **No fim:** "Como seguir?", depois de uma mensagem com o link do relatório. Com lacunas: **Corrigir as lacunas agora**, **Parar aqui para corrigir à mão (como hoje)**, ou **Abrir o PR assim mesmo**. Sem lacunas: **Abrir o PR agora** ou **Parar aqui (como hoje)**.

## Regras que importam

- Ao dizer "testes passando", o comando mostra **qual comando rodou e o resultado**
- Segurança: nenhum secret no diff, `npm audit` sem vulnerabilidade alta ou crítica e lockfile atualizado
- Se o PR tocar áreas sensíveis, recomenda o label `security` e a revisão de segurança antes do merge
- Nenhuma rodada é sobrescrita ou apagada: rodar de novo guarda a anterior ao lado, como `gate-checklist-rodada-{N}.md`
- **Links clicáveis:** a coluna "Onde" e as demais citações do `gate-checklist.md` viram links que abrem o arquivo na linha (`rules-on-demand/doc-links-rules.md`)

## Próximo passo típico

[`eng.pr`](./eng.pr.md)
