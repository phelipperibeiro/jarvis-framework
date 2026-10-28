# Changelog

Todas as mudanças relevantes deste projeto são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), e o projeto segue [Semantic Versioning](https://semver.org/lang/pt-BR/) (ver `rules/engineering/eng.bump-rules.md`).

> Versões anteriores a `2.1.1` não foram documentadas retroativamente neste changelog — o histórico detalhado dessas versões continua disponível via `git log`.

## [Não lançado]

> Versão **major**: o bump e a data entram no commit `chore(release)` na `main`, depois do merge.

### Changed
- **Regra de ouro: nada é comentado nem publicado sem perguntar** (#184): comentário, PR/MR, issue, push e publicação no Central docs só saem depois de mostrar o texto e perguntar com `AskUserQuestion`, na hora do envio (**Sim, publicar** / **Não, manter só na sessão**), um por um. A regra fica em `rules/engineering/eng.integrations-rules.md`; o `eng-global-task-comment` ganhou o passo 0.5 (mostra o texto e pergunta; com Não, grava o `task-comment-*.md`); o `jarvis-report-issue` mostra título e corpo e pergunta antes de abrir a issue. No card só entram comentários que agregam (desvio do plano, auditoria do Advisor, bloqueio, link do MR, resultado do `eng.pre-pr`); nunca de início ou fim de comando. Vale depois do `jarvis init --upgrade` no projeto. A escolha da Fase 0 do `eng.pr` vale como a pergunta do push e do PR (exceção registrada na regra). Passam pela regra também o `eng.light-arch`, o `eng.spec-consolidate`, o `data.contract`, o `delivery-spec` do `eng-global-tech-spec`, o `prod.spec.issue` e o `jarvis-docs-central`. Teste novo `test/regra-de-ouro.test.js` (11 testes, provados por mutação) e `BASE` de tokens +1022 B em todos os perfis.
- **Instalação só global** (#187): o Jarvis é instalado com `npm install -g jarvis-ai-framework`. O `jarvis init` roda dentro do projeto e copia os assets do Jarvis global para `.$IDE/`. O README e os guias deixam de ensinar o `--save-dev` e o `npx jarvis`.
- **`jarvis init` e `jarvis init --upgrade`** avisam, antes do sync (e, na instalação, antes da pergunta de reinstalação), quando o projeto tem uma cópia local do Jarvis (`node_modules`, inclusive por `npm link`, ou dependência no `package.json`): ela é ignorada ou, se for ela que está rodando (`npx`, `node_modules/.bin`), o aviso diz isso. Também avisam quando o `jarvis-lock.json` do projeto é mais novo que o Jarvis em uso (é preciso atualizar o global).
- **`/jarvis-init`**: um Passo 0 compara o `jarvis-lock.json` com o `jarvis --version`. Com os assets mais antigos que o global, oferece atualizá-los antes de seguir: `jarvis init --upgrade --ide {ide}` com `ENV.md`, ou `jarvis init --ide {ide} --force` sem ele.
- **`jarvis init --upgrade`** com o lock do projeto mais novo que o Jarvis em uso pede confirmação antes de rebaixar os assets (o `--yes` libera; sem terminal, para).
- Mensagens do CLI e da regra do RTK com o comando `jarvis` (sem `npx`); o erro de assets não encontrados orienta a instalação global.

### Removed
- **BREAKING**: o comando `jarvis qa-signoff` e as variáveis `QA_SIGNOFF_BRANCHES` e `QA_SIGNOFF_MAX_AGE`. O `/eng.qa-release-signoff` continua gerando o documento GO/NO-GO, sem a validação pelo CI e sem o setup de pipeline (que mandava DM no Slack).
- **BREAKING**: o sync automático de assets no `postinstall` (quando o `npm install` rodava num projeto com `jarvis-lock.json`). Os assets de um projeto se atualizam só pelo `jarvis init`, dentro dele (`--upgrade`, ou `--force` antes do `/jarvis-init` criar o `ENV.md`).
- **BREAKING**: o suporte à instalação local do pacote (`--save-dev`). A cópia local é ignorada, com aviso.

### Fixed
- **#184**: a auditoria do Advisor (`eng.start`, `eng.plan`, `eng.work`), o comentário de desvio e de bloqueio, o comentário com o link do MR, o `git push` das correções do code review (`eng.pr` e `eng-global-pr`) e o `/jarvis-report-issue` saíam sem perguntar. O `eng-global-pr` também fazia push e abria o MR sem a pergunta. O "Mover card" agora só orienta a pessoa (`eng.start`, `eng.pr` e `eng-global-pr`): o Jarvis não move card. O `eng.light-arch`, o `data.contract`, o `delivery-spec` (inclusive o comentário da 7.4), o `prod.spec.issue` e o agente `eng.qa.quality-champion-task-agent` também comentavam, notificavam ou criavam card sem perguntar.
- **#186**: o `eng.pre-pr` preserva as rodadas anteriores do `gate-checklist.md`. Rodar de novo na mesma sessão renomeia o relatório existente para `gate-checklist-rodada-{N}.md` (nunca sobrescreve), e o relatório novo traz `Rodada`, `Commit`, as rodadas anteriores e a resolução das lacunas "Corrigir"; a lacuna "Corrigir" que continua presente volta já marcada; a numeração nunca repete número (conta também os `.public.md`); no modo workspace, o `Commit:` traz só os repositórios com mudança; as lacunas sem decisão, inclusive as ⚪, entram na resolução; o `.public.md` vai junto com a rodada, e um `.public.md` solto fica como está, com aviso; a Decisão ganha os ícones 🔧 Corrigir e 👍 Aceitar; `eng.pr`, `eng.spec-consolidate` e os guias tratam o `gate-checklist.md` como a rodada mais recente.
- **#187**: o `/jarvis-init` com assets de uma versão anterior (por exemplo, o Central docs em `./central-docs` no modo workspace, já corrigido no #180) não segue mais sem aviso.

## [7.0.0] - 2026-10-26

### Added
- **Links clicáveis nos documentos** (#182): `rules-on-demand/doc-links-rules.md` define como citar requisito, documento, código, card e PR. Os links são relativos ao próprio arquivo; o código leva `#L{linha}` e o nome do símbolo, e o requisito leva a âncora do título real. No `pull-request.md`, no `.public.md`, no Central docs e no texto publicado no card, que saem do workspace, issue, PR, card e código viram URL absoluta (`blob/{sha}`), e a sessão e o `docs/jarvis/` ficam em texto. Num documento versionado no repositório (`README.md`, `docs/` do projeto), o caminho é relativo dentro do repositório.
- **Integrações pelas CLIs oficiais** (#181): board de cards e host de git passam a usar só `gh` (GitHub), `glab` (GitLab) e `acli` (Jira Cloud), com o login delas. Catálogo único `bin/lib/integrations/vendors.json` (vendors, verificação de login, comandos por ação, variáveis com o link da doc) e runner `bin/lib/integrations/cli-runner.js` (`execFile` sem shell; saídas `0` ok, `1` uso, `3` indisponível sem nada enviado, `4` enviado com erro).
- **Cadeia de execução** (#181, `rules/engineering/eng.integrations-rules.md`): `jarvis` → CLI do vendor direto → `.md` (`task-comment-{data}.md`, `pull-request.md` ou `.jarvis/issues/`). No freelance, os eventos relevantes vão para o `task-log.md` da sessão (índice e texto em bloco de código).
- **Variáveis** `TASK_MANAGER_ACCESS` e `VERSION_CONTROL_ACCESS` (`cli` ou `manual`; vazio ou a lista do template = tenta a CLI e avisa). Um gate único (`accessGate`) decide antes de qualquer envio: `manual`, valor inválido (ex.: `manul`) e ENV.md ilegível ou ambíguo saem com `3`, sem enviar, no `jarvis tasks comment`, no `jarvis vcs create-merge` e no MR do Central docs. Valores entre aspas e com comentário de fim de linha são aceitos.
- **Onboarding no `/jarvis-init`** (#181): descoberta da CLI (instalada e logada, por host), variáveis explicadas uma a uma e gravação única no fim. Jira Data Center/Server fica em `manual`.
- **`jarvis tasks comment --body-file`**; o `jarvis tasks comment` e o `jarvis vcs create-merge` leem do `$IDE/ENV.md` o que não vier no ambiente e aceitam `--ide`/`--env-file` (workspace com mais de um ENV.md).
- Testes: `cli-runner.test.js`, `integrations-catalog.test.js` (inclui a consistência das variáveis `TASK_MANAGER_*`/`VERSION_CONTROL_*` citadas no framework) e `tasks-comment.test.js`, no `test:filtro`.

### Changed
- **Comandos que gravam documentos** (#182): os 24 que gravam documentos leem a rule de links antes de escrever: `eng.start`, `eng.plan`, `eng.work`, `eng.pre-pr`, `eng.pr`, `eng.create-ard`, `eng.create-ard-from-code`, `eng.create-rfc`, `eng.build-tech-spec`, `eng.breakdown-subtasks`, `eng.light-arch`, `eng.debug`, `eng.docs`, `eng.review`, `eng.rpa.robot`, `eng.spec-consolidate` e os `prod.spec.*` (prd, frd, epic, issue, discovery, breakdown, clarify, ard). O `eng.start` grava numa linha `Commit base:` própria o commit que leu (por repositório no modo workspace), ao qual as linhas citadas se referem; o `Branch base:` continua só com o nome da branch, e o `architecture-template.md` mostra os exemplos em link. As citações do Advisor são registradas como link. A Fase 3.0 do `eng.pr` atualiza o sha dos links quando reescreve commits.
- **`jarvis init --upgrade`** (#181): mostra a descoberta da CLI de cada eixo, avisa do `TOKEN_TASK_MANAGER` sem ler o valor e preenche o `JARVIS_PROJECT` vazio com o repositório oficial (exceção automática à regra "o upgrade só acrescenta"). O esvaziamento do token é feito no `/jarvis-init`, só com "sim".
- **`JARVIS_PROJECT`** precisa ser a URL completa; sem host, o `/jarvis-report-issue` não adivinha o vendor e grava o `.md`.
- **`eng.debug`** lê o card pela CLI (ação `view`) ou colado, e continua sem comentar no card.
- **Comentário no Jira** vai como texto simples (o markdown é convertido; o conteúdo dos blocos de código vai como está, sem as linhas de cerca).
- Central docs com git abre o MR pela CLI, respeitando o `VERSION_CONTROL_ACCESS` do ENV.md do projeto; sem a CLI, ou com `manual`/inválido, mantém o push e mostra o link para abrir à mão.

### Removed
- **BREAKING**: o REST com token dos adapters, o `TOKEN_TASK_MANAGER`, o `getVcsToken` e o `bin/lib/utils/npmrc-parser.js`. Quem usa Jira com token passa a receber o `.md` até fazer `acli jira auth login`.
- **BREAKING**: suporte a Linear, Asana e Bitbucket (o eixo fica em freelance). Saem também `apiBase` e `buildApiUrl` do `git-parser.js` e o `parseGitLabUrl`.
- Configuração do MCP do Jira nos assets do `/jarvis-init`.

### Fixed
- **#124**: com `TASK_MANAGER=github`, o comentário sai pelo `gh` já logado, sem `TOKEN_TASK_MANAGER`.
- **#120**: o `eng.debug` deixa de depender de MCP fixo para ler o card.

## [6.1.0] - 2026-10-22

### Added
- **Reference Spec no `/eng.build-tech-spec`** (#173): um segundo modo para escrever **especificações técnicas de referência**. São documentos normativos (contratos, convenções de nome, topologia, perfil de adaptação de uma spec, fases de adoção) que não derivam de card, não decidem trade-off (isso é do RFC) e não desenham arquitetura (isso é do ARD). A saída fica em `$ENG_DOCS/SPEC/SPEC-###-{slug}.md`, numerada como RFC e ARD, sem subtarefas e sem board. Sem RFC ou ARD de origem, a checagem de RFC aplica 7 dos 8 critérios: sai "padrão reutilizável", que é a natureza do documento. Cada decisão resolvida aponta a sua origem (RFC, ARD ou "resolvida aqui").
- **Skill `eng-global-tech-spec`** (#173), no padrão do `eng.debug`: `SKILL.md` com as regras comuns e um arquivo por modo em `references/` (`delivery-spec.md` e `reference-spec.md`). Cada modo lê só o seu arquivo.
- **Template `templates/engineering/ref-spec-template.md`** (#173): frontmatter com `id`, `version` (SemVer), `status` (`proposed | in_review | approved | superseded`) e `related`. Tem escopo normativo, decisões resolvidas com a origem de cada uma, contratos e convenções, critérios de aderência, fases e versionamento.
- **`test/framework-refs.test.js`** (#173, no `test:filtro`): confere que os caminhos `$IDE/...` citados em skills, templates, workflows, rules e agents existem, inclusive dentro de blocos de código. Confere também os links relativos de skills, templates e workflows e a `metadata.area` de todo skill (as áreas válidas vêm da `eng.skills-rules.md`).
- **`test/validate-frontmatter.test.js`** (#176, no `test:filtro`): o status `superseded` não gera aviso, e um status fora da lista gera.

### Changed
- **`/eng.build-tech-spec`** (#173): o workflow caiu de 976 para 139 linhas. Ficou com o gate de cargo, a triagem de modo e o passo de áreas. Com URL ou ID de card, segue no **Delivery Spec** (épico ou história) sem perguntar, com o comportamento de sempre e o texto movido sem reescrever para `references/delivery-spec.md`. Sem argumentos, pergunta o modo.
- **Especializações no `/eng.build-tech-spec`** (#173): o comando aplica a `eng.specializations-rules.md`, carregando o skill base de cada área da spec e as especializações registradas no `ENV.md`, com as mensagens e o bloqueio padrão. As áreas são identificadas dentro do modo, depois da leitura do card ou da triagem.
- **Fronteira com o `/eng.breakdown-subtasks`** (#173): o `build-tech-spec` entrega as fatias de 4h a 1 dia; o `breakdown-subtasks` só as detalha como passo a passo. Fica declarada no workflow, nos dois guias e nas rules.
- **SPEC nas listas de documentos de trabalho** (#173, #174): `rules/` (`eng-rules`, `prod-rules`, `artifact-style-rules`), templates (`ENV-template`, `central-feature-template`), `jarvis-docs-central`, `jarvis-init` (inclusive a carga inicial do Central docs), `eng.spec-consolidate`, `eng.docs` e o agente `eng.docs-consolidator`. O `/eng.spec-consolidate --inicial` passa a ler também `$ENG_DOCS/SPEC`. Custo: +12 B por sessão nos perfis de engenharia.
- Guias e índices (`docs/engenharia/eng.build-tech-spec.md`, `docs/comandos.md`, `docs/estrutura/`, `skills/AGENTS.md`, `templates/AGENTS.md`, `workflows/README.md`, `workflows/AGENTS.md`) com os dois modos.

### Fixed
- **Gate de `POSITION` no `/eng.build-tech-spec`** (#173): exigia `TECH LEAD` exato e bloqueava o `GENERALIST`, que a taxonomia define como coringa. Agora aceita `TECH LEAD`, `HEAD`, `CTO`, `SPECIALIST` e `SENIOR`, e o `GENERALIST` sempre passa. A linha `generalist` de `eng-rules.md` registra que ele satisfaz qualquer gate por cargo.
- **`jarvis docs publish --tipo spec`** (#176): respondia "Tipo inválido". Agora explica que a SPEC é documento de trabalho e fica em `docs/jarvis/`; a SPEC continua sem poder ser publicada. O validador de frontmatter passa a aceitar o status `superseded`.
- Link `RFC-Playbook@1.0.0.md` → `RFC-Playbook.md` (#173), que já estava quebrado; e o exemplo do Passo 8 do `jarvis-init`, que citava uma rule de QA já removida.

## [6.0.0] - 2026-10-20

> **Major:** o `/eng.bug-audit` deixa de existir. O `/eng.debug` vira o comando único de bugs: investiga um sintoma ou varre um escopo (pasta, módulo ou `--all`).

### Added
- **Skill `eng-global-investigation`** (#168): o método de investigação do `/eng.debug`, que busca a causa raiz antes de corrigir. Traz as fases, hipóteses com evidência (arquivo:linha), limite de 3 tentativas e os vereditos `confirmado`, `provável` e `inconclusivo`. O orçamento de etapas depende da urgência do `context.md` (5, 10 ou 15), com parada após 3 rodadas sem avançar e um crítico antes de concluir. Inclui a política de acesso por ambiente, só de leitura, e nada é publicado no card. Os dois casos e as técnicas independentes de stack ficam em `references/` (`caso-investigar.md`, `caso-varrer.md`, `rastrear-para-tras.md`, `fronteiras-entre-componentes.md`).
- Templates `templates/engineering/debug-report-template.md` (sintoma, código lido, hipóteses, evidências, veredito, correção, teste de regressão descrito e débitos como cards prontos) e `bug-audit-report-template.md` (suspeitos P0–P3 com o card pronto de cada um; nada é aberto no board).
- **Varredura em paralelo** (#168): com `--all` ou mais de 200 arquivos, o `/eng.debug` pergunta se varre em sequência ou em paralelo, com no máximo 4 subagentes, um por categoria.

### Changed
- **Breaking:** o `/eng.debug` (#168) detecta pela entrada o que fazer. Card, erro ou stack trace levam a investigar; pasta, módulo ou `--all` levam a varrer. Se a entrada for ambígua, ele faz uma pergunta. A saída fica em `debug-report.md` ou `bug-audit-report.md` na sessão, e a correção segue pelo `eng.plan` ou pelo `eng.work`. O workflow caiu de 463 para cerca de 150 linhas, e saiu o comentário fixo no Jira.
- Agente `eng.bug-hunter` reduzido à persona (postura, ceticismo, evidência e prevenção), apontando para a skill e para o `/eng.debug`.
- `eng-backend-microservices-trace`: passa o bug para o caso investigar do `/eng.debug`, sem passos numerados.
- Guia `docs/engenharia/eng.debug.md` com os dois casos e o "qual usar quando"; `docs/comandos.md`, `workflows/README.md` e `agents/README.md` atualizados.

### Removed
- **Breaking:** `/eng.bug-audit` (workflow e guia). Use `/eng.debug` com uma pasta, um módulo ou `--all`. O `jarvis init --upgrade` remove o comando das instalações.

### Fixed
- **Limpeza de workflows obsoletos** (#168): o `jarvis init --upgrade` procurava `workflows/engineering/...` na pasta da IDE, mas a instalação achata os workflows na pasta de comandos (ex.: `.claude/commands/`). Por isso comandos removidos antes, como `eng.qa-exploratory-session` e `eng.security-incident`, continuavam nas instalações. Agora eles são removidos pelo nome exato do arquivo (testes em `test/sync-engine.test.js`).

## [5.7.0] - 2026-10-17

### Added
- **`/eng.daily-report {N}`** (#165): junta os `daily.md` das sessões em um relatório por dia, do mais recente para o mais antigo, em lista aninhada (tarefa > frentes de trabalho > detalhes), com a linha de timesheet de cada tarefa e um bloco de alertas das sessões sem `daily.md` que deveriam ter (chegaram ao `eng.pr` ou começaram a partir de 2026-10-15). Janela de 1, 3, 7, 15, 30 ou 60 dias (padrão 7), no calendário local e incluindo hoje; outro valor é recusado sem gerar arquivo. O relatório fica em `$ENG_DOCS/daily-reports/daily-report-AAAA-MM-DD-{N}d.md` (a mesma janela no mesmo dia sobrescreve) e nunca é publicado. Guia em `docs/engenharia/eng.daily-report.md`.
- **`jarvis daily-report --days N [--json]`** (#165): a parte determinística do relatório (`bin/lib/core/session-scan.js`). Lê as sessões a partir do `ENV.md` do workspace, converte o `.timestamp_start` (UTC) para o dia local, deduz data e atividade das sessões sem `daily.md`, aplica a regra de alertas e remove e-mails. Testes em `test/session-scan.test.js`.

### Changed
- **Template do `architecture.md`, seção 8 (Questões em Aberto)** (#165): coluna "Opção escolhida" na tabela; ✅ e "(escolhida)" na opção adotada e ❌ nas demais (sem marcação enquanto a questão está aberta).
- **Consolidado de links da sessão** (#165, regra 5 de `eng.transitions-rules.md`): o bloco "Arquivos da sessão" aparece antes de **toda** pergunta de transição, inclusive as do início de um comando (como "O que fazer com o PR?"), e não só das que dependem de um arquivo.
- `daily-template.md` e o guia do `eng.pr` apontam para o `/eng.daily-report` (antes: "um comando futuro").

## [5.6.0] - 2026-10-17

### Added
- **`WORKSPACE_MODE=workspace|project`** (#163): nova chave do `ENV.md`, detectada pelo `jarvis init --upgrade` (e pelo `/jarvis-init`) com a função `detectWorkspaceMode`. O que define o modo é a **raiz** ser ou não um repositório (raiz sem `.git` e 1+ subpastas com `.git/` = `workspace`; raiz com `.git` = `project`), e não quantos repositórios existem. O upgrade nunca altera uma chave que já existe.
- **Regra de buscas em modo workspace** (#163, `eng-rules.md`): só os repositórios são código; a pasta da IDE ativa, `.jarvis/`, `.vscode/`, `node_modules/` e o `CDD-MIND-MAP.md` são ignorados nas buscas, salvo leitura pedida pelo workflow; `docs/jarvis/` é lida sob demanda como documento de trabalho. Tabela única `IDE → pasta` (inclui Kiro).
- **Consolidado de links da sessão** (#163, regra 5 de `eng.transitions-rules.md`): a cada etapa, o comando mostra o bloco "Arquivos da sessão" com links clicáveis de tudo o que já existe, com uma nota curta de estado em cada arquivo, antes das perguntas que dependem de um arquivo e na mensagem final.
- **`jarvis init --upgrade` lista e oferece remover skills antigos** (#163): os instalados que o framework não tem mais; a remoção só com confirmação no terminal ou `--remove-stale` (nunca com `--yes`); skills registrados em `*_SPECIALIZATIONS` nunca são listados.

### Changed
- **Perguntas do ciclo `eng.*`** (#163): rótulos que dizem o que acontece e nenhuma opção "Outros" listada (o `AskUserQuestion` já a acrescenta).
  - `eng.work`: "Depois do work" com Rodar o `/eng.pre-pr`, Rodar o `/eng.pr` (sem o pre-pr) e Fluxo normal (como hoje);
  - `eng.plan`: "O que fazer com o plano?" (aprovar e implementar agora, aprovar e seguir manualmente, ajustar);
  - `eng.pre-pr`: decisão das lacunas numa pergunta só (Corrigir/Aceitar); comentário no card só com board (só o resumo ou o relatório completo); pergunta final conforme haja lacunas;
  - `eng.pr`: "O que fazer com o PR?" (revisar e publicar, publicar sem revisar, só gerar os arquivos).
- **`daily.md`** é gerado com ou sem PR publicado (antes: só com PR aberto).
- **Humanização** (`ARTIFACT_STYLE=human-generated`): uma pergunta só, no fim do `eng.pr`, em abas (uma por documento); `pull-request.md` (já é público) e `context.md` ficam de fora.

### Fixed
- **Critério de modo workspace** no `jarvis-init` (#163): "2+ subpastas com `.git`" classificava um workspace de um repositório só como projeto único e escolhia o caminho errado do Central docs.
- **Pasta do Gemini** (#163): `.gemini/` → `.agents/` em `eng-rules`, `prod-rules`, `setup-guide` e `jarvis-init` (é a pasta que o `jarvis init` instala).
- **Skills `eng-scraper` e `eng-scraper-robot-builder`** (#163): o renome para `eng-automation` (#81) não estava em `OBSOLETE_PATHS`; ficavam sobrando na pasta da IDE e bloqueavam todo `eng.*` (área `scraper` não reconhecida). Agora o upgrade os remove.

## [5.5.0] - 2026-10-16

> Primeiro release desde a 5.2.0: reúne também as mudanças de [5.3.0] e [5.4.0], que não foram publicadas separadamente.

### Added
- **Transições do ciclo de engenharia com `AskUserQuestion`** (#161). A opção padrão de cada pergunta mantém o fluxo de sempre, com nome que diz o que acontece ("(como hoje)"), nunca "Ignorar". A regra geral fica em `rules-on-demand/engineering/eng.transitions-rules.md`. As perguntas:
  - `eng.start`, só sem Advisor: no início, como tratar as questões em aberto (no `architecture.md`, como hoje, ou uma a uma, assim que surgirem); no fim, "Aprovar o architecture.md?" (parar, seguir para o `/eng.plan` ou ajustar), que já é a aprovação. Com Advisor, nada muda;
  - `eng.plan`: a mesma pergunta no fim, seguindo para o `/eng.work`;
  - `eng.work`: no início, execução (fase a fase ou todas de uma vez, até o limite `MAX_AI_EXECUTION_PERCENTAGE`), commits (um por fase ou um só) e o que vem depois (sugerir ou rodar o `/eng.pre-pr`, ir direto ao `/eng.pr` ou parar), gravados no `plan.md`;
  - `eng.pre-pr`: no fim, seguir para o `/eng.pr` ou parar para ajustar;
  - `eng.pr`: no início, revisar o texto aqui ou publicar direto e validar no PR; no fim, "O PR já foi aprovado e mergeado?", com Sim chamando o `/eng.spec-consolidate`.
- **`jarvis vcs create-issue --label`** (#161): labels separadas por vírgula (padrão `bug`); no Bitbucket, a primeira label vira o `kind`.

### Changed
- **`jarvis-report-issue`** (#161): classifica o report em **bug** (`[BUG]`, label `bug`) ou **melhoria** (`[MELHORIA]`, label `enhancement`, corpo de issue autossuficiente); na dúvida, pergunta.
- `eng.spec-consolidate` roda **depois do merge** do PR (antes: "logo depois do PR aberto").
- Templates `architecture-template.md` e `plan-template.md` com os campos das escolhas novas.

## [5.4.0] - 2026-10-16

### Added
- **`ARTIFACT_STYLE=ai-generated | human-generated`** (#159): estilo dos artefatos, perguntado pelo `/jarvis-init` (Pergunta 9; `ai-generated` é o padrão e o `jarvis init --upgrade` o acrescenta em ENVs antigos). Com `human-generated`:
  - **publicado pelo Jarvis** (commit, PR/MR, comentário no card, issue): sempre sem marcas de IA ou da IDE (`Co-Authored-By` de ferramenta, "Generated with …");
  - **documento gerado** (PRD, FRD, épico, história, discovery, ARD, RFC, tech spec, Central docs e os documentos de sessão): grava o padrão e pergunta se você quer a versão humanizada, gravada ao lado como `{nome}.public.md`. No Central docs, ela fica na sessão e não é publicada.
- **`rules/artifact-style-rules.md`** (#159): a rule do `human-generated` (o que é publicado, a pergunta e o checklist "sem marcas de IA"). Com `ai-generated`, ela nem existe na sessão.
- **Eixo opcional `ARTIFACT_STYLE` no `Applies to`** (#159): 5º campo (`| ARTIFACT_STYLE: human-generated`); ausente = qualquer estilo. Sem coringa: FULLCYCLE e GENERALIST não o satisfazem. Vale no `bin/lib/core/profile-filter.js`, no Passo 8 do `/jarvis-init` e no `rules/AGENTS.md`.
- **`jarvis tokens --artifact-style`** (#159): estima o que carrega com cada estilo (lido do ENV quando falta algum eixo).

### Changed
- **`/eng.pr`** (#159): com `human-generated`, a Fase 3.0 confere os commits ainda não enviados e o `pull-request.md` antes do push, e reescreve as mensagens sem modo interativo; commit já enviado com marca não é reescrito (avisa e para).
- `eng-global-pr`, `eng-global-task-comment`, `jarvis-report-issue` e `eng.spec-consolidate` seguem o estilo (#159).
- Índice do Central docs ignora `*.public.md` (#159).
- `rules/AGENTS.md`: o filtro é o Passo 8 do `/jarvis-init` (o texto dizia Passo 9).

## [5.3.0] - 2026-10-16

### Added
- **`jarvis init --upgrade [--ide X] [--yes]`** (#157): atualiza um projeto já configurado numa passada, sem a pergunta "Deseja reinstalar?":
  - **arquivos do framework:** sincroniza como o `--force` (o `ENV.md` nunca é sobrescrito);
  - **`ENV.md`:** acrescenta só as chaves do template que faltam, num bloco `# --- Upgrade AAAA-MM-DD ---`. **Nenhuma chave existente muda** (preenchida, vazia ou com lista de opções). Chave nova com lista de opções entra vazia, e `PROD_MODE` nova vem da `AREA` (`ENGINEERING` → `developer-guided`, `PRODUCT` → `product-led`);
  - **documentos em caminhos antigos:** os mesmos do Upgrade (C) do `/jarvis-init`, mais os discoveries. Mostra a lista e pergunta antes de mover (`--yes` move sem perguntar; sem terminal interativo, não move). Usa `git mv` quando o arquivo é versionado, pula quando o destino já tem um arquivo com o mesmo nome e corrige o `related_discovery` pelo nome do arquivo;
  - **resumo:** versão anterior → nova, variáveis acrescentadas (só nomes), documentos movidos ou pulados, pendências, e o próximo passo: `/jarvis-init upgrade` na IDE.

  A lógica fica em `bin/lib/core/env-upgrade.js` e `bin/lib/core/docs-migrate.js`, com testes (`test/env-upgrade.test.js`, `test/docs-migrate.test.js`, `test/init-upgrade.test.js`).
- **`/jarvis-init upgrade`** (#157): com o `ENV.md` existente, vai direto ao Upgrade (C), sem o menu A/B/C/D.
- **`DISCOVERIES_FOLDER_NAME` e `DISCOVERIES_DOCS`** no `templates/ENV-template.md` (#157).

### Changed
- **Discoveries em pasta própria** (#157): `/prod.spec.discovery` grava em `$DISCOVERIES_DOCS` (`docs/jarvis/discoveries/`), fora de `product/`. As rules (`prod-rules.md`, `prod.spec-rules.md`), o workflow, os templates de PRD, FRD, épico e issue e o guia apontam para lá. ENV ainda sem a variável: os comandos usam `$PROD_DOCS/discoveries` se essa pasta existir e avisam para rodar o upgrade.
- **Upgrade (C) do `/jarvis-init`** (#157): o item 8 também move os discoveries, pula conflito e corrige o `related_discovery`. Na recusa, só as chaves **novas** recebem o caminho antigo (`DISCOVERIES_DOCS=$PROD_DOCS/discoveries`). O item 10 grava a `PROD_MODE` nova pela `AREA`; a criação do ENV continua perguntando.
- `syncAssets` aceita `keepEnvValues`: com o `--upgrade`, o RTK não troca `RTK_ENABLED=false` por `true` (acrescentar a chave quando ela não existe continua valendo).

## [5.2.0] - 2026-10-16

### Changed
- **`/prod.spec.discovery` mais fluido** (#154). O fluxo agora é:
  - lê o projeto em silêncio;
  - mostra **"O que entendi"** (dito por você, suposição, lacuna), com o tamanho da ideia e o nome do arquivo, numa **única confirmação**;
  - faz só perguntas de alto impacto, uma por vez, com **"pergunta N de até M"**, **por que importa** e a opção **recomendada**;
  - fecha com 2–3 abordagens, um **scorecard** por lente (forte, adequado, fraco, desconhecido), o veredito e o próximo passo com o comando pronto.

  O **orçamento de perguntas** vai pelo tamanho (`size` no frontmatter: `small` 0–2, `bounded` até 5, `broad` até 8). No modo `developer-guided`, as explicações do mentor não contam. Também mudam:
  - **Defaults razoáveis:** viram suposição explícita, não pergunta;
  - **Ideia pequena:** também gera o arquivo;
  - **Discoveries no formato antigo:** são convertidos no mesmo caminho (mesmo id e nome) ao serem retomados.
- `templates/product/prod-discovery-template.md`: seções Entendimento, Problema, Abordagens, Scorecard, Veredito, Próximo passo e Histórico (saem Hipóteses, Viabilidade, Alternativas e riscos e Perguntas em aberto); frontmatter com `size`
- `agents/product/prod.discovery-interviewer.md` só com a postura (de 105 para 40 linhas); workflow, agente e template somam 235 linhas (eram 392)
- `rules/product/prod.spec-rules.md` ("Discovery como insumo"): "suposições e lacunas" no lugar de "hipóteses e perguntas em aberto", sem mudar o comportamento
- **`/warm-up` reescrito** (#153): passou de 537 para 123 linhas e agora é a **preparação de contexto de uma tarefa nova**. Ele carrega só o que é relevante e guarda o resultado por apelido em `$SESSIONS_DIR/warm-ups/{apelido}/warm-up.md`. Passos:
  - **Mapa de tecnologias:** lê (ou cria) o `CDD-MIND-MAP.md`;
  - **Repositórios e áreas:** pergunta quais repositórios aquecer e confirma as áreas, carregando só as especialidades dessas áreas, em memória (o `ENV.md` nunca muda);
  - **Central docs:** lê só o recorte (produto ou funcionalidade) escolhido;
  - **Entregas recentes:** os 5 últimos merges de cada repositório ativo;
  - **Versões das ferramentas:** consulta o `context7` só com o MCP disponível, para até 5 ferramentas.
- `/eng.start` e `/prod.spec*` oferecem os aquecimentos existentes, gravam o escolhido no `context.md` da sessão (`$SESSIONS_DIR/eng/{KEY}/` ou `$SESSIONS_DIR/prod/{id do documento}/`) e apagam a pasta do apelido

### Added
- **`CDD-MIND-MAP.md`**: o mapa de tecnologias do workspace (stack e papel de cada repositório).
  - **Onde fica:** na raiz, ao lado do `AGENTS.md`, fora do versionamento.
  - **Validação:** sempre com o usuário.
  - **Criação:** pelo `/jarvis-init` (Passo 9) ou pelo primeiro `/warm-up`.
  - **No `AGENTS.md`:** ganha uma linha que identifica o mapa como contexto de workspace.
- `rules-on-demand/warm-up-consume-rules.md` (procedimento único de consumo do aquecimento), `templates/cdd-mind-map-template.md` e `templates/warm-up-template.md`

### Removed
- Do `/warm-up`:
  - os 7 menus por perfil e o ajuste por `POSITION`;
  - o perfil de comunicação (fica com o CDD);
  - o `context7` incondicional;
  - a releitura das rules;
  - o passo do `MAX_AI_EXECUTION_PERCENTAGE`;
  - as "Notas de Versão".

## [5.1.0] - 2026-10-15

### Added
- **`daily.md` no `eng.pr`** (#151): com PR aberto, a Conclusão registra o esforço em `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/daily.md`, só na sessão e nunca publicado.
  - **Data:** pergunta hoje ou retroativa.
  - **Dias trabalhados:** com o período em mais de um dia, pergunta antes sobre sábado/domingo trabalhados, feriados e outros dias não trabalhados.
  - **Conteúdo:** uma descrição detalhada e auditável, com *post mortem* em `bugfix`/`hotfix`, com mais de 1 dia trabalhado ou quando confirmado, e uma linha de timesheet.
  - **Nova execução:** atualiza conforme a origem da mudança (ajuste próprio ou pedido da liderança).
  - **Revisão:** descrição e timesheet aprovadas juntas.
  - **Formato:** fixo por data (`## AAAA-MM-DD`), para um comando futuro juntar os registros.
- Template `templates/engineering/daily-template.md`

### Changed
- `eng.pr`: fases e itens renumerados em sequência (havia duas "Fase 6" e itens `7.x`/`8.x` fora da fase); a mensagem final mostra o `daily.md` e a linha de timesheet

## [5.0.0] - 2026-10-15

> **Major:** o Central docs passa a guardar só o que foi implementado (`jarvis docs publish` aceita apenas `feature` e `delivery`), os documentos de trabalho mudam para `docs/jarvis/`, o `eng.pre-pr` deixa de corrigir e publicar, e o `eng.pr` deixa de apagar a sessão e só publica com Sim.

### Added
- **`/eng.spec-consolidate`** (#149): depois do PR aberto, consolida no Central docs o que a entrega implementou. Ele lê o `architecture.md`, o `plan.md`, os documentos de trabalho, o `git log`/diff desde a branch base (com autores), o PR/MR e o card. Gera um documento **por funcionalidade** (`feature-{slug}.md`, estado atual, completo e autossuficiente) e um **registro por entrega** (`delivery-{data}-{key}.md`), mostra para revisão e publica só com Sim. Modo `--inicial` para montar o Central docs a partir dos documentos existentes
- Agente `agents/engineering/eng.docs-consolidator.agent.md` (documentação para humanos e IAs: completude, bons nomes, referências de card e PR/MR com URL conforme `TASK_MANAGER`/`VERSION_CONTROL`, sem e-mails nem segredos)
- Templates `templates/engineering/central-feature-template.md` (11 seções) e `central-delivery-template.md` (7 seções)
- `eng.pre-pr` gera o **`gate-checklist.md`** na sessão (lacunas por área com onde, por que importa, sugestão, severidade e a coluna **Decisão**) e pergunta Sim/Não para publicá-lo como comentário na issue/card; evento novo permitido na `eng.integrations-rules.md`
- `eng.pr` gera o **`pull-request.md`** na sessão e pergunta Sim/Não antes do push e do MR/PR
- `JARVIS_DOCS` e `ENG_DOCS` no `ENV-template`; `/jarvis-init` com o Central docs ligado por padrão (Passo 5.2), migração "oferecer mover" dos documentos nos caminhos antigos e carga inicial do Central docs (Passo 5.3)

### Changed
- **Breaking:** `jarvis docs publish` aceita só `feature` e `delivery`; PRD, FRD, épico, ARD, RFC, swagger e qa-report são recusados com a explicação. Os workflows `prod.spec.{prd,frd,epic}`, `eng.create-ard`, `eng.create-ard-from-code` e `eng.create-rfc` deixam de oferecer a publicação
- **Breaking:** documentos de trabalho em `docs/jarvis/` nos dois modos (com `docs/jarvis/` no `.gitignore`): `PROD_DOCS=$JARVIS_DOCS/product`, e ARD, RFC, QA, swagger/openapi, robôs e C4 em `$ENG_DOCS/…` (workflows, skills, agentes, regras e templates)
- **Breaking:** `eng.pre-pr` só revisa e aponta lacunas (sem corrigir, sem escrever testes, sem atualizar documentação); sai o Gate 0 (publicação de ARD)
- **Breaking:** `eng.pr` não apaga mais a sessão (o `/eng.spec-consolidate` precisa dela) e termina lembrando o `/eng.spec-consolidate`
- Central docs ligado por padrão (`CENTRAL_DOCS_STORAGE=filesystem`); o índice lista só funcionalidades e as 10 entregas mais recentes por produto (PRD/ARD publicados na 4.0.0 ficam fora do índice)
- Quem consulta o Central docs (`warm-up`, `eng.start`, `prod.spec.*`, `eng.create-ard*`, `eng.create-rfc`, `eng.build-tech-spec`, `prod.discovery-interviewer`) passa a ler as funcionalidades já implementadas; PRD, ARD e RFC vêm de `docs/jarvis/`

### Removed
- Gate 0 do `eng.pre-pr` e a Fase 8 (limpeza da sessão) do `eng.pr`
- Publicação de documentos de trabalho no Central docs

## [4.0.0] - 2026-10-15

> **Major:** o Central docs trocou `CENTRAL_DOCS_REPO` por `CENTRAL_DOCS_STORAGE` + `CENTRAL_DOCS_LOCATION` (o Upgrade do `/jarvis-init` migra), mudou o destino do `jarvis docs publish` e removeu o `jarvis vcs fetch-raw`, o `[ref]` do `docs fetch` e o cache Redis. Inclui também o modo Developer-Guided (#146).

### Added
- **Modo Developer-Guided nos comandos de produto** (#146): o `/jarvis-init` sempre pergunta o modo de condução (`PROD_MODE=product-led | developer-guided`, sem opção sugerida, inclusive no Upgrade quando a chave é nova). Com `developer-guided`, os 10 comandos de `workflows/product/` e o `eng.create-ard` leem a regra sob demanda `rules-on-demand/product/prod.guided-rules.md`: uma pergunta por vez, termo de PM sempre com explicação, opções `[Sim]/[Não]/[Explicar melhor]/[Dúvida]` (a dúvida usa o "Outro" de texto livre), mentoria entre artefatos e revisão ao fechar cada documento. O documento gerado é o mesmo nos dois modos
- **Frontmatter comentado** em todos os templates de produto e no de ARD: cada campo diz o que significa e lista todas as opções
- **`recommended_model: opus`** nos documentos de produto e no ARD; os comandos que criam ou editam documento avisam (sem bloquear) quando a sessão está em outro modelo
- Status `deprecated` (esteve em produção e foi descontinuado) na lista única de `rules/product/prod-rules.md`; `cancelled` passa a significar "cancelado antes de ser entregue"
- **Central docs por adaptador de armazenamento** (#143): `CENTRAL_DOCS_STORAGE` escolhe o adaptador e `CENTRAL_DOCS_LOCATION` diz onde ele guarda. Primeiro adaptador: `filesystem` (uma pasta do disco). Se a pasta tiver `.git` (clone de um repositório de documentação), o adaptador faz `git pull` antes de ler e branch + commit + push + Pull/Merge Request ao publicar (usando o `scripts/build-index.sh` do repositório, quando existir). Código em `bin/lib/docs/storage/` (`index.js`, `filesystem.js`, `build-index.js`); S3 e Google Drive ficam para #144 e #145
- `{SQUAD}/index.md` regenerado a partir do frontmatter a cada publicação (em vez de editado), no mesmo caminho lido pelo `docs sync`
- `jarvis docs publish`: tipos `feat`, `epic`, `story` e `task` (o `/prod.spec.epic` passa a publicar), `--produto` (padrão `WORKSPACE`) e o nome do arquivo local como nome no Central docs (`--feature` só para nome fora do padrão)
- `/jarvis-init`: pergunta "Onde fica a documentação central?" (pasta local, repositório git com `git clone`, ou não usar), com o local padrão por modo de trabalho (`./central-docs` no workspace; `docs/jarvis/central-docs` no projeto único) e o `.gitignore` correspondente; migração do `CENTRAL_DOCS_REPO` no Upgrade
- **Branch base perguntada**: `eng.start` e `eng.rpa.robot` perguntam de qual branch partir (`main`, `dev`, a atual ou outra) e gravam `Branch base:` no `architecture.md`; o `eng.pr` abre o PR para essa base

### Changed
- `templates/engineering/ARD-template.md` ganhou frontmatter YAML (`status: proposed | in_progress | in_review | approved`, versão, datas, autor, relacionados); as linhas equivalentes saíram do bloco do corpo
- `prod-breakdown-template.md`: `last_updated` → `updated_at` e campo `status` novo; `prod-epic-template.md` e `prod-issue-template.md` usam a lista única de status
- `recommended_model` dos 11 workflows (10 de produto e `eng.create-ard`) passou a `opus` (o `prod.roadmap.preview` ganhou o campo)
- Upgrade do `jarvis-init`: numeração dos passos corrigida (havia dois "4." e dois "5.")
- **Breaking:** `CENTRAL_DOCS_REPO` deu lugar a `CENTRAL_DOCS_STORAGE` + `CENTRAL_DOCS_LOCATION`. Com a variável antiga e sem a nova, os comandos `jarvis docs` pedem o Upgrade do `/jarvis-init`
- **Breaking:** destino do publish passa a `{SQUAD}/{product|engineering}/{produto}/{arquivo}` (antes `{SQUAD}/{WORKSPACE}/product/{tipo}-{feature}.md`, com ARD em `engineering/ARD/`)
- Projeto único: `PROD_DOCS=docs/jarvis/product`, com `docs/jarvis/*` no `.gitignore`
- `jarvis docs fetch` lê pelo adaptador e perdeu o argumento `[ref]` (a ref vem de `CENTRAL_DOCS_REF`)
- Padrão de `CENTRAL_DOCS_TARGET_BRANCH` no código passou de `dev` para `main` (igual ao template)
- `validate-frontmatter.js`: status de produto, ARD e RFC atualizados (#146) e campos obrigatórios do ARD no frontmatter (`id`, `name`, `version`, `status`)
- Workflows, agente e templates que citavam `CENTRAL_DOCS_REPO` passam a checar `CENTRAL_DOCS_STORAGE`

### Removed
- `jarvis vcs fetch-raw` (e `bin/lib/vcs/fetch-raw.js`), `fetchRawFile` e `commitFiles` de `vcs/api.js`: a leitura do Central docs é sempre `jarvis docs fetch`
- Cache Redis (`bin/lib/docs/redis-cache.js`) e `CENTRAL_DOCS_CACHE_TTL`

## [3.2.0] - 2026-10-06

### Added
- **Advisor opcional no `eng.start`** (#140): no início do comando, o usuário escolhe se quer um Advisor e com qual modelo (lista `ADVISOR_MODELS` no `ENV.md`, até 4 opções; fallback `Sonnet 5.5`). O Advisor é um subagente novo, `agents/engineering/eng.advisor.agent.md` (sem `model:` fixo, só leitura, no GitHub só consulta), aberto só na primeira questão em aberto: faz uma carga inicial do contexto (card, documentos de especificação, sessão) e responde a uma questão por mensagem. A sugestão dele é a decisão adotada; o agente principal registra tudo num comentário de auditoria na issue
- `templates/engineering/advisor-template.md`: Prompt 1 (carga inicial), Prompt 2 (questão em aberto) e o modelo do comentário de auditoria
- `ADVISOR_MODELS` em `templates/ENV-template.md` (o Upgrade do `/jarvis-init` acrescenta a variável) e na tabela de opcionais do `jarvis-init`, sem pergunta na criação do `ENV.md`

### Changed
- `templates/engineering/architecture-template.md`: campo `Advisor:` no cabeçalho e a seção 8 "Questões em Aberto" reescrita (contexto, arquivos, dúvida, no mínimo 3 opções mais "4 — Outra", sugestões do agente principal e do Advisor, decisão adotada, divergência e impacto)
- `eng.start`: a Fase 0.5 vira "Advisor (opcional)", a nova Fase 4.3 trata as questões em aberto e, com Advisor, o gate de aprovação segue a autonomia do CDD (`alta` segue sem esperar); `eng.start-rules.md` registra a exceção
- `eng.plan` e `eng.work`: consulta ao Advisor só por exceção, quando surge uma questão nova (o ideal é levantar tudo no `eng.start`)
- **Comentários no `TASK_MANAGER` só para eventos relevantes:** desvio do plano, auditoria do Advisor, bloqueio (pré-PR reprovado) e, uma única vez, o link do MR. Saíram os 10 comentários de início e fim de `eng.start`, `eng.plan`, `eng.work`, `eng.pre-pr` e `eng.pr` (e as duas duplicatas do link do MR no `eng.pr`); regra única em `rules/engineering/eng.integrations-rules.md`

## [3.0.0] - 2026-10-05

### Added
- Estendido o mecanismo de especialização opt-in (skill base sempre carregada + especializações registradas no `ENV.md`) para as áreas `qa`, `data`, `automation` e `platform`, no mesmo padrão já usado por `backend`/`frontend` (`QA_SPECIALIZATIONS`, `DATA_SPECIALIZATIONS`, `AUTOMATION_SPECIALIZATIONS`, `PLATFORM_SPECIALIZATIONS`) — issue [#63](https://github.com/phelipperibeiro/jarvis-framework/issues/63)
- Criadas as skills base `eng-qa`, `eng-data`, `eng-ai` e `eng-platform`, todas no padrão de `eng-backend` (SKILL.md + `references/` por tema, agnósticas de ferramenta/provedor)
- `/jarvis-init` (Passo 9) e `/jarvis-list-specializations` passam a listar e registrar especializações das 6 áreas (qa/data/automation/platform ficam restritas a listar + registrar — sem detecção por código nem criação, que continuam exclusivas de backend/frontend)
- Adicionados 3 temas novos ao `eng-platform`: Profiling e Diagnóstico de Performance, Testes de Carga e Chaos Engineering, Cache Multi-Camada
- Adicionados 2 temas novos ao `eng-frontend`: Design System e Tokens, Arquitetura de Micro Frontend
- `QA_SPECIALIZATIONS` vem pré-registrada com `eng-qa-planner` por padrão no `ENV-template.md` (única especialização de QA hoje, útil pra quase todo projeto)

### Changed
- Gates/recomendações antes incondicionais de `eng.pre-pr.md`, `eng.pr.md` e `eng.review.md` (ex: `eng-qa-planner`) agora checam a especialização registrada antes de rodar — a skill base de cada área continua sempre disponível
- Toda citação de skill base em workflow/agente passa a vir acompanhada da variável de especialização correspondente (`eng-qa` + `QA_SPECIALIZATIONS`, etc.)

### Removed
- Descontinuada a área `security`: skills `eng-security-cybersecurity`, `eng-security-threat-model`, `eng-security-triage`, `eng-security-patch`, os workflows `eng.security-review/incident/audit/pipeline` e o agente `eng.cybersecurity.agent` (SENTINEL) — segurança de código de aplicação já é padrão embutido em `eng-backend`/`eng-frontend`; segurança de infraestrutura e fundamentos de segurança da informação entraram no `eng-platform`
- Consolidados os skills de QA (`eng-qa-test-plan`, `eng-qa-gate`, `eng-qa-cypress-e2e`, `eng-qa-exploratory`, `eng-qa-dev-guide`, `eng-qa-bug-report`, `eng-qa-quality-report`, `eng-qa-testsprite`, `eng-qa-a11y-audit`, `eng-qa-graphql-contract`, `eng-qa-e2e-spec-writer`) na base `eng-qa` + a especialização `eng-qa-planner`
- Consolidados os skills de Data (`eng-data-engineer`, `eng-data-bi`, `eng-data-debug`, `eng-data-onboard`, `eng-data-orchestrator`) na base `eng-data`
- Removidos `eng-devops-performance-engineer` (absorvido pelo `eng-platform`), `eng-frontend-design-system`/`eng-frontend-microfrontend` (princípios agnósticos absorvidos pelo `eng-frontend`), `eng-automation-robot-builder` e `eng-global-browser-extension-builder`
- Removidos os 5 workflows de QA que só orquestravam os skills descontinuados (`eng.qa-dev-quality-guide`, `eng.qa-e2e-test-generation`, `eng.qa-exploratory-session`, `eng.qa-quality-gate-validation`, `eng.qa-quality-report`)
- Resumo de 3 linhas de cada skill removido em `skills/*-skills-deleted.md` (por área)
- `OBSOLETE_PATHS` em `bin/lib/config/constants.js` atualizado com todos os caminhos acima, para instalações existentes limparem no próximo `jarvis init`

## [2.1.1] - 2026-10-04

### Fixed
- Removido o último resíduo textual do nome antigo do projeto ("spoiler-framework") em `CONTRIBUTING.md`
- Generalizados exemplos de domínio de negócio vazados do fork original (robô de multas/DETRAN, domínio "drivers"/condutores) em regras, skills e um agent

### Removed
- Removida a skill `eng-global-jira-comment` (alias morto, já substituído por `eng-global-task-comment`)
- Removido o agent `eng.qa.cypress-specialist.md` (conteúdo único migrado para `eng.qa.testing-engineer.md` antes da remoção)
- Removidas todas as referências a `agents/archive/`, uma biblioteca de 9 agentes que nunca existiu no repositório, incluindo nomes de agentes fictícios usados como exemplo em `AGENTS.md`, `agents/AGENTS.md` e `agents/README.md`

### Changed
- Consolidada a tabela "Comando → Skill", antes duplicada quase 1:1 entre `AGENTS.md` (raiz) e `skills/AGENTS.md`, em um único lugar (`skills/AGENTS.md`)
- Consolidada a lista de agentes disponíveis em `AGENTS.md` para uma referência a `agents/README.md`
- Consolidada a instrução `DOMAIN:` em `taxonomy.md`, antes repetida 3 vezes
- Renomeado `templates/CDD aplicado a Prompts.md` → `templates/cdd-aplicado-a-prompts.md` (kebab-case, consistente com o resto de `templates/`)
- Corrigida `rules/engineering/eng.bump-rules.md` para referenciar `package.json`/`npm` (Node.js) em vez de `pyproject.toml`/`uv` (Python)
- Contagens de agentes reconciliadas em todos os arquivos de catálogo (16 agentes ativos)
