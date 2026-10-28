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
| Alinhamento com os docs do projeto (`prod.pm-checker`) | Sempre na rodada 1; depois, se algo mudou |
| Revisão de código (`eng.dev-code-reviewer`) | Sempre na rodada 1; depois, se algo fora de `docs/` mudou |
| Lacunas de cobertura de testes (`test-planner`) | Sempre na rodada 1; depois, se algo fora de `docs/` mudou |
| Requisitos não funcionais: performance, segurança, quality gates (`test-architect`) | Se a feature tiver requisitos assim |
| Testes automatizados nas mudanças (`eng-qa` + especialização registrada) | Sempre na rodada 1; depois, se algo mudou |
| Revisão de interface: TypeScript, tokens, acessibilidade (`eng.frontend.agent`) | Se houver mudança de UI |
| Usabilidade: estados vazios, carregando, mensagens de erro (`eng.ux-designer`) | Se houver nova feature de UI ou mudança de fluxo |
| Documentação desatualizada (`eng.docs-writer`, sem editar) | Sempre na rodada 1; depois, se algo mudou |
| Revisão de segurança (checklist inline: sanitização, auth guards, headers, secrets, `npm audit`) | Se tocar auth, sessões, inputs, CORS, CSP, permissões ou endpoints públicos |

**Rodada incremental:** da segunda rodada em diante, um revisor só roda de novo se o que ele lê mudou desde a rodada anterior (o `Commit:` do relatório anterior). Quem roda revisa a branch inteira. Uma lacuna que ficou sem revisão continua pendente: ela é copiada para a rodada nova com a decisão que já tinha, e não some do relatório.


## O resultado

Sempre termina com o arquivo **`$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/gate-checklist.md`**:

1. **Semáforo:** 🟢 pronto para PR, 🟡 pode abrir com notas, 🔴 há bloqueadores
2. **Lacunas por área**, cada uma com: o que é (com o número do revisor que a achou, como "(item 3)"), onde (`arquivo:linha` com o trecho), por que importa, a **refutação** (o que derrubaria a lacuna), sugestão, severidade e a coluna **Decisão**, que você preenche (🔧 Corrigir ou 👍 Aceitar + motivo; ou "Só gerar o relatório" para analisar com calma, sem decidir agora). **Aceitar** quer dizer "vi o problema e decidi não corrigir agora": não bloqueia o PR e fica registrado com o motivo
3. **Evidências** (comandos rodados e resultados) e o **PR Brief**, que o `eng.pr` aproveita: resumo, como testar, riscos e os **labels sugeridos** (ex.: `security`; a pessoa adiciona no host, o `jarvis vcs create-merge` não põe label)

Antes de gravar, um **passe crítico** confere a refutação de cada lacuna: a que não se sustenta sai do relatório (com o motivo), e a que pesa menos do que a severidade dada é rebaixada. O resumo traz a linha **Critério de parada**, e o PR Brief traz as rodadas por severidade, os ajustes do `architecture.md` e do `plan.md` antes da aprovação e até 3 linhas de **lições desta tarefa** (o que deu mais voltas).

**Rodadas:** se você rodar o `eng.pre-pr` de novo na mesma sessão (por exemplo, depois de corrigir lacunas com o `eng.work`), o relatório anterior não se perde: ele vira `gate-checklist-rodada-{N}.md`, e o `gate-checklist.md` passa a ser a rodada nova. Ela mostra o número da **Rodada**, o **Commit** em que foi gerada (no modo workspace, um por repositório com mudanças), os links das **Rodadas anteriores** e a **Resolução da rodada anterior**: para cada lacuna que você marcou como "Corrigir", se foi corrigida e em qual commit. O `eng.pr` usa sempre o `gate-checklist.md`, a rodada mais recente. O que você mandou corrigir (🔧) e continua presente volta já marcado 🔧 Corrigir, para você confirmar ou mudar; o que você aceitou (👍) não volta como pendência, e entra como lacuna nova se o problema reaparecer. As lacunas sem decisão, inclusive as ⚪, também entram na resolução.

Depois, com board, pergunta se registra o resultado como comentário no card: **Não, manter só na sessão (como hoje)**, **Sim, só o resumo** ou **Sim, o relatório completo**. O `/eng-global-task-comment` ainda mostra o texto e pergunta uma última vez antes de enviar (regra de ouro). Sem board (freelance), não pergunta e o relatório fica só na sessão. E **espera sua permissão** antes do `eng.pr`.

## Perguntas que ele faz

- **Critério de parada:** a revisão sempre roda e grava o relatório; o que muda é a pergunta do fim. O critério é atingido pelo **teto de rodadas** (pela urgência do `context.md`: alta 3, normal 5, baixa 8) ou por uma **rodada sem lacuna 🔴 ou 🟡 nova** (com os revisores de código e de testes tendo rodado).
- **Com 🔴 pendente, ou 🟡 sem o critério atingido** (como hoje): "O que fazer com as {n} lacunas?" → **Corrigir todas**, **Corrigir só as bloqueadoras 🔴**, **Decidir uma a uma** ou **Só gerar o relatório**. Se o teto chegou, um aviso diz isso.
- **Só com ⚪, ou com o critério atingido** (sem 🔴 pendente nem 🟡 que você já tinha mandado corrigir): uma pergunta só, "Restam {…} sem decisão. Como seguir?" → **Aceitar as ⚪ e seguir para o PR** (a recomendada), **Corrigir antes do PR** ou **Só gerar o relatório**. Só o teto aceita 🟡 em bloco; pela rodada sem lacuna nova, as 🟡 são decididas uma a uma. Uma decisão sua de rodada anterior nunca é trocada.
- **No fim (com 🔴 ou 🟡, depois de decidir):** "Como seguir?", depois de uma mensagem com o link do relatório. Com lacunas: **Corrigir as lacunas agora**, **Parar aqui para corrigir à mão (como hoje)**, ou **Abrir o PR assim mesmo**. Sem lacunas: **Abrir o PR agora** ou **Parar aqui (como hoje)**.

## Regras que importam

- Ao dizer "testes passando", o comando mostra **qual comando rodou e o resultado**
- Segurança: nenhum secret no diff, `npm audit` sem vulnerabilidade alta ou crítica e lockfile atualizado
- Se o PR tocar áreas sensíveis (auth, sessions, RBAC, CORS, CSP, permissões), registra o label `security` nos labels sugeridos do PR Brief (a pessoa adiciona no host) e recomenda a revisão de segurança antes do merge
- O ciclo para pela regra, não quando a lista esvazia: lacunas menores (⚪) não geram mais uma rodada por si só
- Nenhuma rodada é sobrescrita ou apagada: rodar de novo guarda a anterior ao lado, como `gate-checklist-rodada-{N}.md`
- Com a versão humanizada (`ARTIFACT_STYLE=human-generated`), o `.public.md` vai junto com a rodada e reserva o número dela; um `.public.md` solto (sem o relatório que o originou, um estado anormal) fica como está, com aviso
- **Links clicáveis:** a coluna "Onde" e as demais citações do `gate-checklist.md` viram links que abrem o arquivo na linha (`rules-on-demand/doc-links-rules.md`)

## Próximo passo típico

[`eng.pr`](./eng.pr.md)
