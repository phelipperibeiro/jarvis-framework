---
description: Consolida o que a entrega implementou no Central docs (documento da funcionalidade + registro da entrega)
auto_execution_mode: 3
agent: "$IDE/agents/engineering/eng.docs-consolidator.agent.md"
template_file: "$IDE/templates/engineering/central-feature-template.md"
recommended_model: opus
model_tier: high
model_justification: Consolidar exige ler e cruzar muitas fontes (documentos, decisões, diff e commits) e escrever um registro completo e sem ambiguidade
---

# Consolidar no Central docs

> 🔀 **Consolidado de links**: na mensagem final (Passo 7), siga a regra 5 de `$IDE/rules-on-demand/engineering/eng.transitions-rules.md`: liste, como links clicáveis, todos os arquivos da sessão que já existem.

Este comando registra no **Central docs** o que a entrega **de fato implementou**. Ele roda **depois do merge do PR** (o `/eng.pr` pergunta no fim se o PR já foi mergeado e oferece chamá-lo) e gera dois documentos completos e autossuficientes:
- o **documento da funcionalidade** (`feature-{slug}.md`), com o estado atual, novo ou atualizado;
- o **registro da entrega** (`delivery-{AAAA-MM-DD}-{task_key}.md`), com o PR, os commits e os autores.

Os documentos de trabalho (PRD, FRD, ARD, RFC, SPEC…) continuam em `docs/jarvis/` e **não** vão para o Central docs: lá fica só o que foi implementado.

> 🤖 **Modelo**: se a IDE informar o modelo desta sessão e ele for de outra família que o `recommended_model` do documento (ou do template, se for novo), avise em uma linha e siga, sem bloquear e sem repetir. Sem essa informação, não avise.
> 📤 **Templates**: `$IDE/templates/engineering/central-feature-template.md` e `$IDE/templates/engineering/central-delivery-template.md`
>
> 🔗 **Links**: antes de escrever a consolidação, leia `$IDE/rules-on-demand/doc-links-rules.md` e siga-a: toda citação com lugar exato (requisito, documento, código, card, PR) vira link. O Central docs pode ser lido fora do workspace: siga a regra 6 (URL absoluta, com o sha do merge; sessão e `docs/jarvis/` em texto).

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| Cabeçalho (agente) | `eng.docs-consolidator.agent` (agente) | Sempre: escreve a consolidação na sessão |
| Passo 3 (funcionalidade) e Passo 6 (publicação) | `/jarvis-docs-central` (via `jarvis docs fetch` / `jarvis docs publish`) | Sempre: lê o índice e o documento atual e publica depois do Sim |

---

## Entrada

<arguments>
#$ARGUMENTS
</arguments>

- `{TASK_MANAGER_KEY}` (obrigatório no modo normal): a mesma chave do `eng.start`/`eng.pr`. Sem ela, pergunte e aguarde (`eng.integrations-rules.md`; no modo freelance, o número de controle).
- `{slug}` (opcional): slug da funcionalidade, se você já souber qual atualizar.
- `--inicial`: carga inicial a partir dos documentos de trabalho que já existem (chamado pelo `/jarvis-init`). Não precisa de chave nem de PR.

---

## Passo 0: Pré-condições

1. **Central docs ligado:** `CENTRAL_DOCS_STORAGE` preenchido no `$IDE/ENV.md`. Se estiver vazio, pare: "O Central docs está desligado. Ligue-o no `/jarvis-init` (Passo 5.2) para registrar o que foi implementado."
2. **Modo normal:** a sessão `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/` existe com o `architecture.md`. Sem ela, avise que a consolidação perde as decisões e pergunte se segue só com o diff e os documentos de trabalho.
3. **Branch base:** o `Branch base:` do `architecture.md`. Sem ele, pergunte com `AskUserQuestion` (`main`, `dev` ou Outro).

## Passo 1: Coleta (modo normal)

O agente `eng.docs-consolidator` lê **todas** as fontes, na ordem do agente:
1. `architecture.md` e `plan.md` da sessão.
2. Documentos de trabalho ligados à tarefa em `$PROD_DOCS` e `$ENG_DOCS` (PRD, FRD, épicos, histórias, ARD, RFC, SPEC, swagger, QA).
3. Commits e arquivos:
   ```bash
   git log {base}..HEAD --format='%h|%an|%ad|%s' --date=short
   git diff --stat {base}...HEAD
   ```
4. **PR/MR:** número e URL (`pull-request.md` da sessão, `gh pr view`/equivalente do vendor, ou pergunte).
5. **Card:** URL no padrão do `TASK_MANAGER` (`eng.integrations-rules.md`); no modo freelance, só o número de controle.
6. `gate-checklist.md` (a rodada mais recente do `eng.pre-pr`; as anteriores, `gate-checklist-rodada-{N}.md`, são histórico) e `pull-request.md` da sessão, se existirem.

## Passo 2: Coleta (modo `--inicial`)

1. Liste os PRD, FRD, ARD, RFC e SPEC em `$PROD_DOCS` e `$ENG_DOCS/{ARD,RFC,SPEC}` (e nos caminhos antigos, se o `/jarvis-init` não os moveu).
2. Sugira o agrupamento por funcionalidade (um PRD/FRD e os ARD/RFC/SPEC ligados a ele) e confirme com `AskUserQuestion` (aceitar / ajustar).
3. Para cada grupo, o agente lê os documentos e o código relacionado (só leitura), para descrever o que **está implementado**. O que estiver só especificado vai para "Fora do escopo", e o status reflete isso.

## Passo 3: Qual funcionalidade

1. `jarvis docs fetch {SQUAD}/index.md` e liste as funcionalidades existentes do produto (`WORKSPACE`).
2. Sugira uma, pelo PRD/FRD de origem, pelo título do `architecture.md` e pelos arquivos do diff, e um slug novo bem nomeado (kebab-case, pelo nome que o negócio usa).
3. Pergunte com `AskUserQuestion`:
   - "Atualizar `feature-{x}`" (sugerida);
   - "Criar `feature-{slug sugerido}`";
   - Outro (digitar).

   Se o slug veio como argumento, confirme com a mesma pergunta.
4. Na atualização, `jarvis docs fetch {SQUAD}/product/{produto}/feature-{x}.md` é o ponto de partida.

## Passo 4: Escrever na sessão

O agente gera em `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/consolidation/` (no `--inicial`, em `$SESSIONS_DIR/eng/inicial-{AAAA-MM-DD}/consolidation/`):
- `feature-{slug}.md`: todas as 11 seções do template, com o estado atual e a linha nova no Histórico de entregas;
- `delivery-{AAAA-MM-DD}-{task_key}.md`: as 7 seções (não existe no `--inicial`).

O frontmatter segue o template, com os comentários `#`. `product` = `WORKSPACE` (ou o produto confirmado).

## Passo 5: Revisão

Mostre o resumo dos dois arquivos (seções, tamanho, referências) e o caminho deles. Pergunte com `AskUserQuestion`:
- `[Aprovar]`
- `[Ajustar]`: diga o que mudar; o agente ajusta e você revisa de novo.

Confira antes de aprovar:
- [ ] card e PR/MR com URL;
- [ ] commits com autor (sem e-mail);
- [ ] nenhum segredo nem valor de variável;
- [ ] nenhuma frase depende de um documento de origem.

## Passo 6: Publicar

Pergunte com `AskUserQuestion` (**Sim / Não**): **"Publicar no Central docs?"**

- **Sim:**
  ```bash
  jarvis docs publish --file .../consolidation/delivery-{AAAA-MM-DD}-{task_key}.md --tipo delivery
  jarvis docs publish --file .../consolidation/feature-{slug}.md --tipo feature
  ```
  (no `--inicial`, só os `feature-*`). Com o Central docs num repositório git, cada publicação abre um PR no repositório de documentação: informe as URLs.
- **Não:** os arquivos ficam na sessão. Para publicar depois, use os mesmos comandos.

Com `ARTIFACT_STYLE=human-generated`, a versão humanizada (`{nome}.public.md`) fica ao lado da consolidação, na sessão, e **não** é publicada.

## Passo 7: Mensagem final

```
✅ Consolidação {publicada | salva na sessão}

📄 Arquivos da sessão (consolidado acumulado, regra 5 de `eng.transitions-rules.md`): links de `context.md`, `architecture.md`, `plan.md`, das rodadas anteriores `gate-checklist-rodada-{N}.md`, `gate-checklist.md`, `pull-request.md`, `daily.md` e dos arquivos de `consolidation/` (novos), só os que existem

📄 Funcionalidade: {SQUAD}/product/{produto}/feature-{slug}.md
🧾 Entrega:        {SQUAD}/engineering/{produto}/delivery-{AAAA-MM-DD}-{task_key}.md
🔗 PR/MR: {URL} · Card: {URL ou número}

🧹 A sessão $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/ não é apagada automaticamente: remova à mão quando quiser.
```

---

## Regras

### ⛔ Nunca
- Publicar sem o **Sim** do Passo 6
- Publicar PRD, FRD, ARD, RFC ou SPEC no Central docs (só `feature` e `delivery`)
- Incluir e-mails, tokens, senhas, valores de variáveis ou dados pessoais de clientes
- Inventar informação: sem fonte, pergunte ou registre "não informado"
- Alterar o código, os documentos de trabalho ou a sessão fora de `consolidation/`

### ✅ Sempre
- Ler todas as fontes antes de escrever
- Citar o card e o PR/MR com URL (ou o número de controle no freelance)
- Descrever o implementado, não o pretendido
- Português do Brasil
