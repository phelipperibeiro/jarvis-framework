---
description: Fluxo de trabalho de Engenharia para criação/iteração de ARD
globs:
  alwaysApply: false
  env_file: "@/ENV.md"
recommended_model: claude-sonnet-4-20250514
model_tier: high
model_justification: Documentação arquitetural requer análise de requisitos, trade-offs técnicos e decisões bem fundamentadas
---

# Workflow de Engenharia – ARD (Architecture Requirements Document)

## Objetivo

Guiar o assistente de Engenharia (ENG) na criação, revisão ou iteração de um ARD,
usando o template `$IDE/templates/engineering/ARD-template.md`, sempre alinhado com:

- contexto do projeto definido em `$IDE/ENV.md`
- regras de engenharia em `$IDE/rules/engineering/eng-rules.md`
- regras de versionamento em `$IDE/rules/engineering/eng.bump-rules.md`
- identidade em `$IDE/agents/engineering/eng.agent.md`

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| Objetivo | `eng.agent` (agente) | Sempre — identidade do workflow (alinhamento com `eng.agent.md`) |
| Passo 1.1.1 – Buscar PRD no Central Docs | `/jarvis-docs-central` (via `jarvis docs sync --silent`) | Se `CENTRAL_DOCS_REPO` estiver definido no ENV.md |
| Passo 8 – Publicar no Central Docs | `/jarvis-docs-central` (via `jarvis docs publish --tipo ard`) | Se `CENTRAL_DOCS_REPO` estiver definido, o ARD estiver aprovado e o usuário aceitar publicar |

---

## Passo 0 – Definir se é novo ARD ou iteração

0. Se o comando vier com argumentos (atalhos):

- `eng.create-ard new <nome> [--prd <caminho-do-prd>]` → modo **novo ARD**
- `eng.create-ard edit <nome-ou-caminho>` → modo **iteração**

1. Se os argumentos **não** estiverem claros, pergunte ao usuário:
   - Você quer:
     - ( ) Criar um **novo ARD**
     - ( ) **Iterar** um ARD existente

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
- Defina o `ARD-ID` automaticamente assim:
  - Se a pasta `$DOCS_FOLDER/engineering/ARD/` existir e houver arquivos no padrão `ARD-###-*.md`, use o maior `###` + 1.
- `Status`
- `Caminho do arquivo` (`$DOCS_FOLDER/engineering/ARD/{ARD-ID}-{slug}.md` ou caminho fornecido para iteração)

---

## Passo 0.5 – Versionamento do ARD (obrigatório)

Aplicar **SemVer (x.y.z)** no campo `Versão` do ARD, seguindo obrigatoriamente:

- `$IDE/rules/engineering/eng.bump-rules.md`

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
   - `Status`
   - `Caminho do arquivo` (`$DOCS_FOLDER/engineering/ARD/{ARD-ID}-{slug}.md` ou caminho fornecido para iteração)

---

## Passo 1.1 – Verificar PRD (obrigatório)

### 1.1.1 – Buscar PRD no Central Docs (condicional)

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

   - Regra de rastreabilidade:
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
> - `docs/engineering/swagger/`
> - `docs/engineering/openapi/`
> - `**/*swagger*.{yaml,yml,json}`
> - `**/*openapi*.{yaml,yml,json}`
> - `**/*api-spec*.{yaml,yml,json}`
>
> → Se encontrar: use o contrato disponível no repositório. Documente com referência ao arquivo fonte.
>
> **2. Se não encontrar no repositório**, pergunte ao usuário:
> *"Não encontrei o contrato da `{nome da integração}` no repositório. Você tem o contrato real? (Sim / Não)"*
>
> - **Sim** → Solicite o arquivo, link ou conteúdo. Documente apenas o que estiver no contrato fornecido.
> - **Não** → Registre apenas: qual integração, qual propósito, quais dados são necessários. Use `[A DEFINIR — contrato pendente com {time/parceiro}]`. Nunca crie paths, schemas ou payloads fictícios.

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

## Passo 8 – Publicar no Central Docs (condicional)

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
