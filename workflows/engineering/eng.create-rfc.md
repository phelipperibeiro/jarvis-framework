---
description: Fluxo de trabalho de Engenharia para criação/iteração de RFC seguindo o RFC-Playbook
recommended_model: claude-sonnet-4-20250514
model_tier: high
model_justification: RFCs requerem análise de decisões técnicas complexas, trade-offs e governança de arquitetura
---

# Workflow de Engenharia – RFC (Request for Comments)

> 🔗 **Links**: antes de escrever o RFC, leia `$IDE/rules-on-demand/doc-links-rules.md` e siga-a: toda citação com lugar exato (requisito, documento, código, card, PR) vira link.

## Objetivo

Guiar o assistente de Engenharia (ENG) na criação, revisão ou iteração de um RFC,
seguindo o playbook `$IDE/templates/engineering/RFC-Playbook.md` e usando o template `$IDE/templates/engineering/RFC-template.md`.

Este workflow existe para garantir:

- Decisões técnicas claras
- Governança sem burocracia
- Rastreabilidade entre RFC ⇄ PRD ⇄ FRD ⇄ ARD
- Versionamento consistente (SemVer) em documentos versionados

Além disso, quando houver campo `Versão` no RFC, aplicar obrigatoriamente:

- `$IDE/rules/engineering/eng.bump-rules.md`

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| Passo 0.6 – Buscar Documentação Relacionada no Central Docs | `/jarvis-docs-central` (via `jarvis docs sync --silent`) | Se `CENTRAL_DOCS_STORAGE` estiver definido no ENV.md |

---

## Passo 0 – Definir se é novo RFC ou iteração

0. Se o comando vier com argumentos (atalhos):

- `eng.create-rfc new <nome> [--prd <caminho-do-prd>] [--frd <caminho-do-frd>] [--ard <caminho-do-ard>]` → modo **novo RFC**
- `eng.create-rfc edit <nome-ou-caminho>` → modo **iteração**

1. Se os argumentos **não** estiverem claros, pergunte ao usuário:
   - Você quer:
     - ( ) Criar um **novo RFC**
     - ( ) **Iterar** um RFC existente

2. Se for **iterar**:

- Peça o **caminho do arquivo** do RFC existente (preferencial) ou o **nome**.
- Leia o RFC atual e pergunte:
  - qual seção precisa mudar
  - qual o objetivo da iteração (investigação, convergência, decisão)

3. Se for **novo RFC**:

- Pergunte e confirme:
  - `Título`
  - `Slug` (kebab-case)
  - `Owner`
  - `Reviewers`
- Defina o `RFC-ID` automaticamente assim:
  - Se a pasta `$ENG_DOCS/RFC/` existir e houver arquivos no padrão `RFC-###-*.md`, use o maior `###` + 1.
  - Caso não exista ou não haja arquivos, iniciar em `RFC-001`.
- Defina:
  - `Status` inicial = `Draft`
  - `Caminho do arquivo` = `$ENG_DOCS/RFC/{RFC-ID}-{slug}.md`

---

## Passo 0.5 – Versionamento do RFC (obrigatório)

Aplicar **SemVer (x.y.z)** no campo `Versão` do RFC, seguindo obrigatoriamente:

- `$IDE/rules/engineering/eng.bump-rules.md`

Regras:

1. **Novo RFC**:

- Definir `Versão: 1.0.0`.

2. **Iteração de RFC existente**:

- Ler a `Versão` atual do RFC.
- Perguntar ao usuário (de forma objetiva) qual foi o tipo de mudança na iteração:
  - ( ) **Major**: mudança incompatível na decisão/escopo que invalida o entendimento anterior.
  - ( ) **Minor**: expansão retrocompatível do conteúdo (novas opções, novos critérios, etc.).
  - ( ) **Patch**: correções, clarificações, ajustes pequenos e/ou atualização de documentação.
- Atualizar o campo `Versão` incrementando apenas o componente adequado.

---

## Passo 0.6 – Buscar Documentação Relacionada no Central Docs (condicional)

Se `CENTRAL_DOCS_STORAGE` definido no ENV.md:

1. Consultar no Central docs as funcionalidades já implementadas relacionadas (o que existe hoje):
   ```bash
   jarvis docs sync --silent
   ```

2. Buscar documentação relacionada usando:
   - Título/objetivo do RFC
   - Jira ID (se disponível)
   - Tags semânticas

3. Documentos a buscar:
   - **Funcionalidades já implementadas** relacionadas (Central docs: `feature-*`)
   - **PRD relacionado** (em `$PROD_DOCS`, para rastreabilidade e contexto de negócio)
   - **ARD existente** e **RFCs anteriores** relacionados ao tema (em `$ENG_DOCS/ARD` e `$ENG_DOCS/RFC`)

4. Se documentos encontrados:
   - Carregar automaticamente como contexto
   - Informar ao usuário: "✅ Documentos encontrados no central-docs: [lista]"
   - Incorporar ao contexto antes do Passo 1

5. Se não encontrado:
   - Continuar normalmente
   - Perguntar manualmente se existem docs relacionados

> **Não bloquear o fluxo** se docs não forem encontrados.

---

## Passo 1 – Criação do RFC (Playbook: Passo 1)

1. Relembre o papel do RFC conforme o playbook:

- RFC é um container vivo de decisão técnica
- é aberto cedo (ainda na investigação)
- não define solução técnica no início

2. Preencha o `$IDE/templates/engineering/RFC-template.md` com o usuário, garantindo:

- `status: Draft`
- `created_at` e metadados
- `owner` e `reviewers`

3. Seções obrigatórias para um RFC Draft:

- Contexto e problema (sem solução)
- Motivação para investigação
- Escopo em discussão (dentro/fora)
- Pontos de atenção para engenharia
- Riscos e pendências (com owner)

---

## Passo 2 – Divulgação obrigatória (Playbook: Passo 2)

1. Gere uma mensagem padrão de divulgação (para Slack ou equivalente), contendo:

- Link/caminho do RFC
- Data limite para comentários (ex.: D+5)
- Lista de revisores

2. Regra:

- O RFC não vale se ninguém souber que ele existe.

---

## Passo 3 – Discussão assíncrona (Playbook: Passo 3)

1. Reforçar as regras:

- Comentários devem ficar no RFC (não em chats soltos)
- Opiniões precisam de argumento técnico

2. Se o usuário trouxer comentários de chat, orientar a registrar no RFC como resumo.

---

## Passo 4 – Preparar decisão formal (Playbook: Passo 4)

1. Quando o usuário indicar que PRD/FRD estão prontos, orientar atualização do RFC:

- `status: In Review` quando PRD/FRD existirem
- `status: Ready for Decision` quando for marcar agenda para decisão

2. Exigir rastreabilidade:

- `related_prd` e/ou `related_frd` preenchidos quando existirem
- `related_ard` preenchido quando já houver ARD

3. Preencher o checklist de revisão técnica (seção 7 do template) ao chegar em `Ready for Decision`.

---

## Passo 5 – Gate para implementação (Playbook: Passo 5)

1. Regra de ouro:

- Implementação relevante não começa sem RFC `Accepted`.

2. Ao fechar o RFC:

- preencher seção de decisão final (status final, data, decisores, condições)
- se `Superseded`, linkar o RFC substituto

3. Regras adicionais:

- Link do RFC vira pré-requisito do ARD
- PRs grandes devem referenciar a RFC

---

## Passo 6 – Entrega

Entregar:

1. Um rascunho de RFC preenchido conforme o `$IDE/templates/engineering/RFC-template.md`.
2. Um resumo executivo em poucas linhas:

- problema
- escopo
- riscos
- próximos passos

3. Uma mensagem pronta de divulgação (passo 2 do playbook).

---

## Central docs

Este documento é um **documento de trabalho**: fica em `$PROD_DOCS`/`$ENG_DOCS` (`docs/jarvis/`) e **não** é publicado no Central docs. O Central docs registra só o que foi implementado, e quem o atualiza é o `/eng.spec-consolidate`, depois do PR da entrega.

