# Regras do Workflow Pre-PR

## Propósito

O workflow `pre-pr` valida a branch antes de abrir um Merge Request — revisão de código, testes, documentação e qualidade.

**Segurança:** leia `$IDE/rules-on-demand/engineering/eng.security-rules.md`, seção "Fase: eng.pre-pr", e aplique-a no `gate-checklist.md` (checklist e label `security` no PR Brief).

---

## ⛔ Gate 0: Pré-requisitos Obrigatórios

Antes de qualquer ação, leia `$IDE/rules-on-demand/engineering/eng.gate0-rules.md` e aplique as Regras 0.1 (chave da tarefa), 0.2 (branch protegida) e 0.3 (a branch contém a chave, no padrão da skill `eng-global-branch`). Se qualquer condição falhar, o workflow para imediatamente.

---

## Regras de Validação

### Só revisar

O `eng.pre-pr` **aponta lacunas e não corrige nada**: não altera código, não escreve testes, não atualiza documentação e não publica no Central docs. Quem decide o que ajustar é o usuário.

### Escopo de Análise

Avaliar **apenas** as mudanças da branch atual em relação à branch base (`Branch base:` do `architecture.md`; sem ele, perguntar):

```bash
git diff {BRANCH_BASE}...HEAD
```

Da rodada 2 em diante, cada gate roda só se o diff desde o `Commit:` da rodada anterior tocar o que ele lê (seção "Rodada incremental" do `eng.pre-pr.md`). O gate que roda continua revisando a branch inteira.

### Evidências Obrigatórias

Cada lacuna cita onde está (`arquivo:linha` com o trecho) ou o comando que a revelou e o resultado, **e o que a derrubaria** (coluna Refutação). Antes de gravar, o passe crítico (seção "Passe crítico" do `eng.pre-pr.md`) remove a lacuna cuja refutação se sustenta e rebaixa a que pesa menos do que a severidade dada.

---

## Saída Final Obrigatória

O workflow **deve sempre** terminar com:

1. **`gate-checklist.md`** em `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/`:
   - semáforo (🟢 / 🟡 / 🔴), resumo (com a linha `Critério de parada:`, com a escolha no teto quando houve a pergunta), lacunas por área (o quê, com o "(item N)" do gate que a achou no fim, onde, por que importa, refutação, sugestão, severidade, **Decisão**), evidências e PR Brief (com a linha "Mandadas corrigir depois da rodada {N}, sem nova rodada do pre-pr: {lista}" quando a pessoa escolhe "Corrigir … e seguir para o PR" no fechamento, as rodadas por severidade, a rodada em que o critério de parada agiu, os ajustes do `architecture.md` e do `plan.md` antes da aprovação e as lições desta tarefa; guardar lições entre tarefas não é deste comando, é da #169).
   - `Rodada` e `Commit` no cabeçalho, as rodadas anteriores e, da rodada 2 em diante, a resolução das lacunas da rodada anterior.
   - Da rodada 2 em diante, as áreas cujos gates não rodaram na rodada incremental, marcadas como "Não reavaliada nesta rodada".
   - É sempre a rodada mais recente: ao rodar de novo na mesma sessão, o relatório existente é preservado como `gate-checklist-rodada-{N}.md` (seção "Rodadas" do `eng.pre-pr.md`). **Nunca** sobrescrever nem apagar uma rodada; renomear imediatamente antes de gravar.
2. **Decisões do usuário** gravadas na coluna Decisão (🔧 Corrigir / 👍 Aceitar + motivo; vazia se o usuário escolheu "Só gerar o relatório", exceto as decisões herdadas da rodada anterior). Na variante B do fechamento, as ⚪ aceitas levam `👍 Aceitar: aceito no fechamento da rodada {N}` e as 🟡 aceitas em bloco (só com o teto atingido) levam `👍 Aceitar: teto de rodadas atingido na rodada {N}`, e as decididas uma a uma levam o motivo dado pela pessoa; decisão herdada nunca é trocada. A opção "Corrigir … e seguir para o PR" da variante B grava `🔧 Corrigir` (sem motivo) nas pendentes e a linha "sem nova rodada do pre-pr" no PR Brief, e chama o `/eng.work`, que termina no `/eng.pr`.
   - **Critério de parada** (seção "Fechamento" do `eng.pre-pr.md`): teto de rodadas pela urgência do `context.md` (`alta` 3 · `normal` 5 · `baixa` 8) ou rodada sem lacuna 🔴 ou 🟡 nova (com os itens 2 e 3 tendo rodado). Sem 🔴 pendente nem 🟡 herdada com `🔧 Corrigir`, e com só ⚪ sem decisão (ou também 🟡, com o critério de parada atingido), o fechamento usa a variante B. Na variante B, "Aceitar as ⚪ e seguir para o PR" é a primeira opção (a recomendada) e "Só gerar o relatório" mantém o fluxo de hoje. Só o teto aceita 🟡 em bloco; com o gatilho "sem lacuna nova", as 🟡 são decididas uma a uma. O critério nunca pula a revisão nem a gravação. Fora desses casos (por exemplo, com 🔴 pendente), o ciclo segue na variante A. Sempre que o teto for atingido e houver pendência, o fechamento avisa e pergunta com `AskUserQuestion` ("Teto de {T} rodadas da urgência `{u}` atingido. Como seguir?"): **Parar e seguir para o PR** (a recomendada) / **Mais uma rodada** / **Só gerar o relatório (como hoje)**, antes das variantes. "Parar" com 🔴 pendente decide uma a uma, nunca em bloco; "Mais uma rodada" segue a variante A, ou, quando a tabela dá B, marca as sem decisão como `🔧 Corrigir` e, depois do passo 3, chama o `/eng.work`. A escolha vai na linha `Critério de parada:` (`escolha no teto: …`) e as rodadas acima do teto levam `além do teto, por decisão da pessoa` no Resumo e no PR Brief.
   - **Pendentes não reavaliadas** (rodada incremental): a lacuna pendente da rodada anterior cujo gate de origem (o "(item N)" da coluna Lacuna) não rodou é copiada para a rodada nova, com a decisão herdada.
3. **Pergunta** (`AskUserQuestion`) sobre registrar o resultado como comentário no card (`/eng-global-task-comment`): Não, manter só na sessão (como hoje) / Sim, só o resumo / Sim, o relatório completo. Nunca publicar sem a resposta. Freelance: não pergunta, só na sessão.
4. **Aguardar permissão explícita** do usuário para prosseguir para `/eng.pr`.
