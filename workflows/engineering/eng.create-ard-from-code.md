---
description: Fluxo de trabalho de Engenharia para criação/iteração de ARD baseado no código do repositório
recommended_model: claude-sonnet-4-20250514
model_tier: high
model_justification: Análise de codebase e extração de arquitetura requer compreensão profunda de código e padrões
---

# Workflow de Engenharia – ARD a partir do Código (Architecture Requirement Document)

## Objetivo

Guiar o assistente de Engenharia (ENG) na criação, revisão ou iteração de um ARD,
priorizando a **arquitetura observada no código do repositório**, usando o template
`$IDE/templates/engineering/ARD-template.md`, sempre alinhado com:

- contexto do projeto definido em `$IDE/ENV.md`
- regras de engenharia em `$IDE/rules/engineering/eng-rules.md`
- identidade em `$IDE/agents/engineering/eng.agent.md`

---

## Passo 0 – Definir se é novo ARD ou iteração

0. Se o comando vier com argumentos (atalhos):

- `eng.create-ard-from-code new <nome> [--prd <caminho-do-prd>]` → modo **novo ARD**
- `eng.create-ard-from-code edit <nome-ou-caminho>` → modo **iteração**

1. Se os argumentos **não** estiverem claros, pergunte ao usuário:
   - Você quer:
     - ( ) Criar um **novo ARD** a partir do código
     - ( ) **Iterar** um ARD existente a partir do código

2. Se for **iterar**:

- Se o usuário tiver passado `edit <nome-ou-caminho>`, use isso como entrada inicial.
- Peça o **caminho do arquivo** do ARD existente (preferencial) ou o **nome** do ARD, se ainda não tiver.
- Se o usuário passar só o nome, confirme onde ele está (ex.: `$DOCS_FOLDER/engineering/ARD/...`).
- Leia o ARD atual e pergunte quais seções mudam (ou qual é o objetivo da iteração).

3. Se for **novo ARD**:

- Se o usuário tiver passado `new <nome> [--prd <caminho-do-prd>]`, use isso como:
  - `Título` (se vier como texto normal)
  - ou `Slug` (se vier em kebab-case)
- O parâmetro `--prd <caminho-do-prd>` é opcional:
  - Se vier, usar essa rota para ler o PRD no Passo 1.1.
  - Se não vier, perguntar no Passo 1.1 se existe PRD e, se existir, pedir a rota do arquivo.
- Pergunte o que estiver faltando:
  - `Título`
  - `Slug` para o nome do arquivo (kebab-case)
- Defina o `ARD-ID` automaticamente assim:
  - Se a pasta `$DOCS_FOLDER/engineering/ARD/` existir e houver arquivos no padrão `ARD-###-*.md`, use o maior `###` + 1.
- Defina:
  - `Status`
  - `Caminho do arquivo` (`$DOCS_FOLDER/engineering/ARD/{ARD-ID}-{slug}.md` ou caminho fornecido para iteração)

---

## Passo 1 – Verificar PRD (obrigatório quando existir)

### 1.1 – Buscar PRD no Central Docs (condicional)

Se `CENTRAL_DOCS_REPO` definido no ENV.md:

1. Executar busca automática no central-docs:
   ```bash
   jarvis docs sync --silent
   ```

2. Buscar PRD relacionado usando:
   - Título/objetivo do ARD
   - Jira ID (se disponível)
   - Tags semânticas

3. Se PRD encontrado no central-docs:
   - Carregar automaticamente como contexto
   - Pular para item 2 (extração de requisitos)
   - Informar ao usuário: "✅ PRD encontrado no central-docs: [nome]"

4. Se PRD não encontrado:
   - Continuar com pergunta manual (item 1.2)

### 1.2 – Verificar PRD manualmente

1. Pergunte explicitamente:
   - Existe um PRD para essa iniciativa/feature?
     - ( ) Sim
     - ( ) Não

2. Se **Sim**:
   - Peça a **rota do arquivo** do PRD e não avance sem isso.
   - Leia o PRD e extraia (sem inventar):
     - **Requisitos funcionais**
     - **Requisitos não funcionais críticos**
     - **Restrições explícitas**
     - **Volume esperado** (usuários, requisições, dados)
     - **SLAs esperados**
     - **Métricas de sucesso**

3. Se **Não**:
   - Deixe explícito quais itens acima estão faltando e peça ao usuário o mínimo necessário antes de fixar decisões arquiteturais.

4. Regra de escopo:
   - O ARD **não pode inventar escopo novo** além do que está no PRD (ou do que o usuário confirmar explicitamente).

---

## Passo 2 – Coletar contexto do repositório (arquitetura observada)

Objetivo: montar um retrato fiel do que o código revela hoje.

1. Identificar e ler arquivos de topo (se existirem):

- `README.md`
- `ENV.md`
- `$DOCS_FOLDER/**` (especialmente `$DOCS_FOLDER/engineering/ARD/**` e docs de arquitetura existentes)

2. Identificar a stack e artefatos de build:

- arquivos de dependências (ex.: `package.json`, `requirements.txt`, `go.mod`, etc.)
- arquivos de runtime/infra (ex.: `Dockerfile`, `docker-compose.*`, manifests, etc.)

3. Mapear estrutura de diretórios (visão macro):

- listar diretórios de primeiro nível
- identificar pastas prováveis de domínio (ex.: `src`, `apps`, `services`, `packages`, `api`, `web`, etc.)

4. Identificar entrypoints e “o que roda em produção”:

- procurar scripts de start/build/test
- localizar bootstrap do servidor, consumers, jobs, cron, CLIs internas

5. Mapear integrações e dependências externas observáveis:

- banco(s), filas/tópicos, storage, terceiros
- regras explícitas de autenticação/autorização

  > ⚠️ **Checkpoint obrigatório — Contratos de APIs externas** (aplicação de eng-rules: *"nunca invente endpoints ou integrações"*)
  >
  > Ao identificar integrações com APIs de terceiros no código, siga esta ordem:
  >
  > **1. Buscar contrato no repositório primeiro:**
  > Procure por specs existentes nos seguintes locais:
  > - `docs/engineering/swagger/`
  > - `docs/engineering/openapi/`
  > - `**/*swagger*.{yaml,yml,json}`
  > - `**/*openapi*.{yaml,yml,json}`
  > - `**/*api-spec*.{yaml,yml,json}`
  > - Client SDKs ou arquivos de contrato referenciados no código
  >
  > → Se encontrar: use o contrato disponível. Documente com referência ao arquivo fonte.
  >
  > **2. Se não encontrar no repositório**, pergunte ao usuário:
  > *"Identifiquei uma integração com `{nome}` mas não encontrei o contrato no repositório. Você tem o contrato real? (Sim / Não)"*
  >
  > - **Sim** → Solicite o contrato antes de documentar paths, schemas ou payloads.
  > - **Não** → No ARD, registre apenas: qual integração, qual propósito, quais dados são necessários. Use `[A DEFINIR — contrato pendente com {time/parceiro}]`.

6. Mapear contratos observáveis:

- rotas/endpoints (se houver)
- eventos/filas (nomes, exchanges, tópicos)
- schemas/DTOs

7. Extrair evidências e anotar incertezas:

- separar o que é “fato observado no código” vs “hipótese”
- registrar lacunas (ex.: não foi possível identificar entrypoint; faltam docs)

> Se o repositório for grande, priorize a visão macro (top-level + entrypoints + configs) antes de ler muitos arquivos.

---

## Passo 3 – Preencher o ARD-template.md com base no código

Siga o template `$IDE/templates/engineering/ARD-template.md` **seção a seção**.

Regras:

1. Onde houver PRD, preencher a tabela de requisitos consumidos e amarrar decisões aos IDs.
2. Onde não houver PRD, declarar explicitamente lacunas e validar premissas com o usuário.
3. Em “Desenho da Arquitetura”, preferir um diagrama que reflita o que existe hoje + proposta incremental.
4. Em “Componentes”, “Fluxos”, “Integrações” e “Contratos”, usar o que foi encontrado no código/config. Para integrações externas cujo contrato não está no repositório, aplicar o placeholder definido no Passo 2 (`[A DEFINIR — contrato pendente com {time/parceiro}]`) — nunca criar paths ou schemas fictícios.
5. Em “Decisões e Trade-offs”, separar:

- arquitetura atual (observada)
- arquitetura proposta (mudanças)
- motivação (RF/NFR/Restrição/SLA/Métrica)

---

## Passo 4 – Impactos, riscos e testes

1. Componentes afetados (diretos e indiretos)
2. Riscos (técnicos, operação, segurança, dados)
3. Mitigações (rollout/rollback, feature flags, observabilidade)
4. Estratégia de testes:

- unitários
- integração
- contrato/e2e quando aplicável

---

## Passo 5 – Checagem final

- Alguma recomendação viola ou encosta nos guard rails de `$IDE/rules/engineering/eng-rules.md`?
- Há decisões que exigem validação explícita do usuário/Produto?
- Há suposições não confirmadas?

Liste perguntas abertas e pontos que exigem aprovação.

---

## Passo 6 – Entrega

Entregar:

1. Um **rascunho de ARD preenchido** no formato do template.
2. Um **resumo executivo**:

- problema
- arquitetura atual (observada)
- proposta
- principais riscos
- próximos passos

---

## Passo 7 – Publicar no Central Docs (condicional)

Se `CENTRAL_DOCS_REPO` definido no ENV.md **E** o usuário aprovar o ARD:

1. Perguntar ao usuário:
   ```
   Deseja publicar este ARD no repositório central de documentação?
   - ( ) Sim, publicar agora
   - ( ) Não, vou publicar depois manualmente
   ```

2. Se **Sim**:
   - Extrair o slug do nome do arquivo (ex: `ARD-001-api-wallet-auth.md` → `api-wallet-auth`)
   - Executar:
     ```bash
     jarvis docs publish \
       --file {caminho_do_ard} \
       --tipo ard \
       --feature {slug}
     ```
   
3. Informar resultado:
   - ✅ Sucesso: "ARD publicado no central-docs. MR criado: [URL]"
   - ❌ Erro: Exibir mensagem de erro e orientar troubleshooting

4. Se **Não**:
   - Informar: "Para publicar depois, execute: `jarvis docs publish --file {caminho} --tipo ard --feature {slug}`"

> **Nota**: A publicação cria um Merge Request no GitLab. O ARD só será visível no central-docs após aprovação e merge do MR.
