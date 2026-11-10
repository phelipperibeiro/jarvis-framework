---
description: Fluxo de trabalho de Engenharia para criação/iteração de ARD, a partir de PRD ou do código existente
recommended_model: opus
---

# Workflow de Engenharia – ARD (Architecture Requirements Document)

> 🎓 **Modo de condução**: leia `PROD_MODE` no `$IDE/ENV.md`. Se for `developer-guided`, **antes de começar leia `$IDE/rules-on-demand/product/prod.guided-rules.md` e siga-o** em toda a conversa. Vazio ou `product-led`: siga este fluxo como está.
>
> 🤖 **Modelo**: se a IDE informar o modelo desta sessão e ele for de outra família que o `recommended_model` do documento (ou do template, se o documento for novo), avise em uma linha e siga, sem bloquear e sem repetir. Sem essa informação, não avise.
>
> 🔗 **Links**: antes de escrever o ARD, leia `$IDE/rules-on-demand/doc-links-rules.md` e siga-a: toda citação com lugar exato (requisito, documento, código, card, PR) vira link.

## Objetivo

Guiar o assistente de Engenharia (ENG) na criação, revisão ou iteração de um ARD,
a partir de PRD e decisões ou da arquitetura observada no código existente,
usando o template `$IDE/templates/engineering/ARD-template.md`, sempre alinhado com:

- contexto do projeto definido em `$IDE/ENV.md`
- regras de engenharia em `$IDE/rules/engineering/eng-rules.md`
- regras de versionamento em `$IDE/rules-on-demand/engineering/eng.bump-rules.md`
- identidade em `$IDE/agents/engineering/eng.agent.md`

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| Objetivo | `eng.agent` (agente) | Sempre — identidade do workflow (alinhamento com `eng.agent.md`) |
| Passo 1.1.1 – Consultar funcionalidades no Central Docs | `/jarvis-docs-central` (via `jarvis docs sync --silent`) | Se `CENTRAL_DOCS_STORAGE` estiver definido no ENV.md |
| Passo 3 (ramo código, Desenho da Arquitetura) | `/eng-global-arch-c4` | Opcional: só com a confirmação do usuário; sem ela, o diagrama vai no próprio ARD |

---

## Passo 0 – Definir se é novo ARD ou iteração

0. Se o comando vier com argumentos (atalhos):

- `eng.create-ard new <nome> [--prd <caminho-do-prd>] [--codigo]` → modo **novo ARD**
- `eng.create-ard edit <nome-ou-caminho> [--codigo]` → modo **iteração**
- `--codigo` → o ARD parte do **código existente** (pula a pergunta de origem do Passo 0)

1. Se os argumentos **não** estiverem claros, pergunte ao usuário:
   - Você quer:
     - ( ) Criar um **novo ARD**
     - ( ) **Iterar** um ARD existente

**Pergunta de origem.** Sem `--codigo`, pergunte com `AskUserQuestion` (uma pergunta separada da anterior): **"Qual é a base do ARD?"** → **De PRD e decisões (como hoje)** / **Do código existente**.
- **Do código existente** (ou `--codigo`): o fluxo é o mesmo, mais o Passo 2.1 (coletar contexto do repositório), o bloco "No ramo código" do Passo 3 e a arquitetura atual (observada) no resumo do Passo 7. O PRD continua sendo lido quando existir (Passo 1.1).

2. Se for **iterar**:

- Se o usuário tiver passado `edit <nome-ou-caminho>`, use isso como entrada inicial.
- Peça o **caminho do arquivo** do ARD existente (preferencial) ou o **nome** do ARD, se ainda não tiver.
- Se o usuário passar só o nome, confirme onde ele está (ex.: `$ENG_DOCS/ARD/...`).
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
  - Se a pasta `$ENG_DOCS/ARD/` existir e houver arquivos no padrão `ARD-###-*.md`, use o maior `###` + 1.
- Defina:
  - `Status` (campo `status` no frontmatter: `proposed | in_progress | in_review | approved`)
  - `Caminho do arquivo` (`$ENG_DOCS/ARD/{ARD-ID}-{slug}.md` ou caminho fornecido para iteração)

---

## Passo 0.5 – Versionamento do ARD (obrigatório)

Aplicar **SemVer (x.y.z)** no campo `Versão` do ARD, seguindo obrigatoriamente:

- `$IDE/rules-on-demand/engineering/eng.bump-rules.md`

Regras:

1. **Novo ARD**:

- Definir `Versão: 1.0.0`.

2. **Iteração de ARD existente**:

- Ler a `Versão` atual do ARD.
- Perguntar ao usuário (de forma objetiva) qual foi o tipo de mudança na iteração:
  - ( ) **Major**: mudanças incompatíveis/decisão arquitetural que invalida premissas/contratos anteriores.
  - ( ) **Minor**: novas capacidades/expansões retrocompatíveis no desenho.
  - ( ) **Patch**: correções, clarificações, ajustes pequenos e/ou atualização de documentação.
- Atualizar o campo `Versão` incrementando apenas o componente adequado.

---

## Passo 1 – Confirmar contexto e fonte da demanda

1. Pergunte ao usuário:
   - De onde vem essa necessidade?
     - ( ) PRD / especificação de produto
     - ( ) Demanda puramente técnica (refactor, débitos, plataforma)
     - ( ) Incidente / problema em produção
   - Qual é o objetivo principal desse ARD?
   - Há algum prazo / restrição crítica (ex.: janela de deploy, dependência com outra squad)?

2. Reflita de forma explícita:
   - Que problema esse ARD precisa resolver?
   - Quais são os **limites de escopo** (o que entra / o que não entra)?

3. Confirme os metadados definidos no Passo 0:
   - `ARD-ID`
   - `Título`
   - `Status` (campo `status` no frontmatter)
   - `Caminho do arquivo` (`$ENG_DOCS/ARD/{ARD-ID}-{slug}.md` ou caminho fornecido para iteração)

---

## Passo 1.1 – Verificar PRD (obrigatório; no ramo código, quando existir)

### 1.1.1 – Buscar o PRD em `$PROD_DOCS` e o implementado no Central docs

1. Se `CENTRAL_DOCS_STORAGE` estiver definido no ENV.md, consultar no Central docs as funcionalidades já implementadas relacionadas (o que existe hoje); vazio: pule só este item:
   ```bash
   jarvis docs sync --silent
   ```

2. Buscar o PRD relacionado em `$PROD_DOCS` (sempre, com ou sem Central docs) usando:
   - Título/objetivo do ARD
   - Jira ID (se disponível)
   - Tags semânticas

3. **Não achou em `$PROD_DOCS`?** Pode já ter sido consolidado e removido de lá (`/eng.spec-consolidate --finalize`/`--force`, #220): busque em `decisions/` da funcionalidade pela skill `jarvis-docs-central` (Modo 1), pelo mesmo basename.
4. Se o PRD for encontrado em `$PROD_DOCS` (ou em `decisions/`):
   - Carregar automaticamente como contexto
   - Pular para item 2 (extração de requisitos)
   - Informar ao usuário: "✅ PRD encontrado: [caminho]"

5. Se PRD não encontrado:
   - Continuar com pergunta manual (item 1.1.2)

### 1.1.2 – Verificar PRD manualmente

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
     - **Métricas de sucesso** (para orientar decisões técnicas)

   - Regra adicional (modo `new`):
     - Se o comando veio com `--prd <caminho-do-prd>`, usar essa rota como fonte e iniciar a leitura imediatamente.

   - Regra de rastreabilidade (com PRD):
     - Toda **decisão técnica** no ARD deve citar explicitamente pelo menos um item acima (ex.: `RF-03`, `NFR-02`, `SLA-01`, etc.).
     - Se não houver referência no PRD, trate como **lacuna do PRD** e peça validação explícita antes de registrar como decisão.

3. Se **Não**:
   - Deixe explícito quais itens acima estão faltando e peça ao usuário o mínimo necessário antes de fixar decisões arquiteturais.

4. Regra de escopo:
   - O ARD **não pode inventar escopo novo** além do que está no PRD (ou do que o usuário confirmar explicitamente).
   - Se surgir qualquer necessidade fora do PRD, registre como **proposta** e peça validação do usuário antes de incorporar.

5. O que **não** é papel do ARD:
   - Redefinir objetivo de produto.
   - Mudar regra de negócio.
   - Criar feature nova “porque tecnicamente é melhor”.
   - Discutir roadmap ou priorização.

   Se isso acontecer durante a elaboração do ARD, trate como **sinal de PRD mal definido ou incompleto** e peça ao usuário para:
   - atualizar/fornecer um PRD mais claro, ou
   - validar explicitamente a mudança de escopo antes de qualquer decisão arquitetural.

---

## Passo 2 – Ler insumos relevantes

1. Se existir PRD ou documento de produto:
   - Peça o conteúdo ou o arquivo.
   - Resuma em poucas linhas:
     - problema
     - usuários impactados
     - objetivos de negócio
     - métricas de sucesso (se existirem)

2. Consulte quando necessário:
   - $IDE/ENV.md → stack, ferramentas, restrições.
   - Código / pastas mencionadas pelo usuário.
   - Outros ARDs relacionados (se forem fornecidos).
   - Incidente/alerta relacionado (se aplicável) e evidências: logs, métricas, traces.
   - Requisitos não-funcionais explícitos (SLO/SLA, latência, throughput, custo).
   - Restrições operacionais: rollout/rollback, janelas, dependências.

> Se o contexto estiver incompleto, **pare e peça esclarecimentos** antes de propor solução.

---

## Passo 2.1 – Coletar contexto do repositório (só no ramo código)

Objetivo: montar um retrato fiel do que o código revela hoje.

1. Identificar e ler arquivos de topo (se existirem):

- `README.md`
- `$IDE/ENV.md`
- `$DOCS_FOLDER/**` (especialmente `$ENG_DOCS/ARD/**` e docs de arquitetura existentes)

2. Identificar a stack e artefatos de build:

- arquivos de dependências (ex.: `package.json`, `requirements.txt`, `go.mod`, etc.)
- arquivos de runtime/infra (ex.: `Dockerfile`, `docker-compose.*`, manifests, etc.)

3. Mapear estrutura de diretórios (visão macro):

- listar diretórios de primeiro nível (no modo workspace, dentro de cada repositório; ver "Buscas de código em modo workspace" em `eng-rules.md`)
- identificar pastas prováveis de domínio (ex.: `src`, `apps`, `services`, `packages`, `api`, `web`, etc.)

4. Identificar entrypoints e "o que roda em produção":

- procurar scripts de start/build/test
- localizar bootstrap do servidor, consumers, jobs, cron, CLIs internas

5. Mapear integrações e dependências externas observáveis:

- banco(s), filas/tópicos, storage, terceiros
- regras explícitas de autenticação/autorização
- para APIs de terceiros, aplique o checkpoint de contratos do Passo 3 (contrato no repositório primeiro; sem ele, pergunte; sem contrato, `[A DEFINIR — contrato pendente com {time/parceiro}]`)

6. Mapear contratos observáveis:

- rotas/endpoints (se houver)
- eventos/filas (nomes, exchanges, tópicos)
- schemas/DTOs

7. Extrair evidências e anotar incertezas:

- separar o que é "fato observado no código" vs "hipótese"
- registrar lacunas (ex.: não foi possível identificar entrypoint; faltam docs)

> Se o repositório for grande, priorize a visão macro (top-level + entrypoints + configs) antes de ler muitos arquivos.

---

## Passo 2.5 – Avaliar Complexidade (obrigatório)

Antes de propor qualquer decisão arquitetural, classifique a demanda com critérios objetivos. Isso define o nível de complexidade **permitido** na proposta.

| Critério | Simples | Moderada | Complexa |
|---|---|---|---|
| **Volume esperado** | < 100 req/min | 100–10k req/min | > 10k req/min |
| **Serviços impactados** | 1 serviço | 2–3 serviços | 4+ serviços / multi-squad |
| **Necessidade de async** | Não | Opcional | Obrigatório |
| **Estado distribuído** | Não | Possível | Sim (cache, fila, saga) |
| **Rollback de dados** | Trivial | Migration simples | Migration complexa / multi-step |
| **SLA exigido** | Sem SLA formal | p95 < 1s | p95 < 200ms ou alta disponibilidade |

**Declare o resultado antes de avançar para o Passo 3:**

```
Complexidade classificada: {Simples / Moderada / Complexa}

Critérios determinantes:
- {Critério}: {valor observado / informado pelo PRD ou usuário}

Implicação:
- Simples   → solução direta; sem filas, sem cache distribuído, sem eventos
- Moderada → async permitido se volume ou SLA justificar; documentar justificativa
- Complexa → arquitetura robusta autorizada; cada componente adicional deve ter justificativa explícita
```

> ⚠️ **Regra de proporcionalidade**: Só introduza complexidade (filas, eventos, cache distribuído, saga) se a classificação for **Moderada** ou **Complexa** E houver justificativa técnica documentada. Complexidade não justificada é overengineering — simplifique a proposta.

---

## Passo 3 – Preencher o ARD-template.md

Siga o template `$IDE/templates/engineering/ARD-template.md` **seção a seção**.
Para cada seção do template:

1. Reescreva o conteúdo em linguagem clara, estruturada.
2. Indique quando algo é:
   - fato conhecido
   - hipótese
   - risco
   - ponto que depende de decisão de negócio

Sempre que possível, destaque:

- **Componentes afetados (diretos e indiretos)**
- **Integrações externas / dependências**
- **Impactos em dados, segurança, performance e observabilidade**

> 📌 **Regra obrigatória**: Em "Decisões e Trade-offs", a opção **mais simples** deve ser sempre uma das alternativas consideradas. Se não for escolhida, o descarte deve ter justificativa técnica explícita vinculada à classificação de complexidade do Passo 2.5. Nunca proponha componentes de complexidade superior ao que a classificação autoriza sem justificativa documentada.

> ⚠️ **Checkpoint obrigatório — Contratos de APIs externas** (aplicação de eng-rules: *"nunca invente endpoints ou integrações"*)
>
> Para cada integração com API de terceiro ou serviço externo identificada, siga esta ordem:
>
> **1. Buscar contrato no repositório primeiro:**
> Procure por specs existentes nos seguintes locais:
> - `$ENG_DOCS/swagger/`
> - `$ENG_DOCS/openapi/`
> - `**/*swagger*.{yaml,yml,json}`
> - `**/*openapi*.{yaml,yml,json}`
> - `**/*api-spec*.{yaml,yml,json}`
> - Client SDKs ou arquivos de contrato referenciados no código
>
> → Se encontrar: use o contrato disponível no repositório. Documente com referência ao arquivo fonte.
>
> **2. Se não encontrar no repositório**, pergunte ao usuário:
> *"Não encontrei o contrato da `{nome da integração}` no repositório. Você tem o contrato real? (Sim / Não)"*
>
> - **Sim** → Solicite o arquivo, link ou conteúdo. Documente apenas o que estiver no contrato fornecido.
> - **Não** → Registre apenas: qual integração, qual propósito, quais dados são necessários. Use `[A DEFINIR — contrato pendente com {time/parceiro}]`. Nunca crie paths, schemas ou payloads fictícios.

**No ramo código** (pergunta de origem do Passo 0), preencha o template a partir do que o Passo 2.1 encontrou:

1. Onde houver PRD, preencher a tabela de requisitos consumidos e amarrar decisões aos IDs.
2. Onde não houver PRD, declarar explicitamente lacunas e validar premissas com o usuário.
3. Em "Desenho da Arquitetura", preferir um diagrama que reflita o que existe hoje + proposta incremental. Para diagramas C4, ofereça o `/eng-global-arch-c4` com `AskUserQuestion` (opcional; o diagrama fica em `$ENG_DOCS/c4/` e o ARD o cita por link); sem o Sim, o diagrama vai no próprio ARD.
4. Em "Componentes", "Fluxos", "Integrações" e "Contratos", usar o que foi encontrado no código/config. Para integrações externas cujo contrato não está no repositório, aplicar o placeholder do checkpoint acima — nunca criar paths ou schemas fictícios.
5. Em "Decisões e Trade-offs", separar:

- arquitetura atual (observada)
- arquitetura proposta (mudanças)
- motivação (RF/NFR/Restrição/SLA/Métrica)

Garanta que o ARD cubra explicitamente:

- **Arquitetura proposta**
- **Componentes e responsabilidades**
- **Fluxos de dados**
- **Integrações**
- **Contratos (APIs, eventos, filas)**
- **Decisões técnicas e trade-offs**
- **Riscos técnicos**
- **Impactos em escala, segurança e observabilidade**
- A pergunta: **“Como vamos construir isso de forma segura, escalável e sustentável?”**

---

## Passo 4 – Análise de impacto e riscos

Inclua no ARD, de forma explícita:

1. **Escopo**
   - O que muda.
   - O que explicitamente **não** muda.

2. **Componentes afetados**
   - Serviços, módulos, bancos, filas, jobs, APIs, etc.

3. **Riscos**
   - Técnicos (complexidade, pontos frágeis, tecnologias novas).
   - De negócio (impacto se falhar, regressões possíveis).
   - De operação (deploy complexo, rollback difícil, dependência de terceiros).

4. **Mitigações**
   - Estratégias de rollout/rollback.
   - Feature flags, dark launch, testes adicionais.
   - Observabilidade necessária (logs, métricas, alertas).

---

## Passo 5 – Estratégia de testes e validação

No ARD, sempre inclua:

- Tipos de teste necessários:
  - unitários
  - integração
  - contrato / e2e (se fizer sentido)
- Cenários mínimos que devem ser cobertos (happy path + edge cases críticos).
- Como validar em ambiente não-produtivo antes do rollout.

---

## Passo 6 – Checagem final com guard rails

Antes de finalizar o ARD, faça uma checagem explícita:

- Alguma recomendação viola ou encosta nos guard rails de `$IDE/rules/engineering/eng-rules.md`?
- Há alguma suposição técnica não confirmada?
- Há decisões que exigem validação de Produto / outra squad?

Liste **perguntas abertas** e **pontos que exigem aprovação**.

---

## Passo 7 – Entrega para o usuário

Finalize entregando:

1. Um **rascunho de ARD preenchido** no formato do `$IDE/templates/engineering/ARD-template.md`.
2. Um **resumo executivo** em poucas linhas:
   - problema
   - arquitetura atual (observada), no ramo código
   - solução proposta
   - principais riscos
   - próximos passos sugeridos
3. Próximos passos operacionais sugeridos:
   - lista de tasks/spikes/PoCs (se aplicável)
   - quem precisa revisar/aprovar
   - riscos que precisam de decisão explícita antes de implementar

Peça explicitamente para o usuário:

- revisar o ARD
- confirmar ou ajustar decisões críticas
- priorizar próximos passos (ex.: quebrar em tasks, spikes, PoCs).

---

## Central docs

Este documento é um **documento de trabalho**: fica em `$PROD_DOCS`/`$ENG_DOCS` e **não** é publicado no Central docs. O Central docs registra só o que foi implementado, e quem o atualiza é o `/eng.spec-consolidate`, depois do PR da entrega.

