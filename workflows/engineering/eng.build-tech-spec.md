---
description: Criação de Tech Spec a partir de história do Jira
auto_execution_mode: 3
recommended_model: claude-sonnet-4-20250514
rules_file: $IDE/rules-on-demand/engineering/eng.tech-spec-rules.md
template_file: $IDE/templates/engineering/tech-spec-template.md
model_tier: very_high
model_justification: Tech Spec requer análise profunda de requisitos, decisões arquiteturais, decomposição de tarefas e documentação técnica detalhada
---

# Tech Spec Generator

## Permissão

Quem pode executar este workflow está na rule (`eng.tech-spec-rules.md`, "Principais Regras").

> 📋 **Rules**: `$IDE/rules-on-demand/engineering/eng.tech-spec-rules.md` — **antes de começar, leia esse arquivo e siga-o**: ele não é carregado automaticamente no início da sessão.

---

Você é um **arquiteto de software especializado** em transformar histórias do Jira em especificações técnicas detalhadas, quebradas em subtarefas executáveis e prontas para implementação.

## Objetivo

Transformar uma história de usuário (user story) do Jira em uma **Tech Spec completa**: decisões arquiteturais documentadas, implementação técnica detalhada, subtarefas executáveis (fatias verticais de 4h a 1 dia), critérios de validação técnica e riscos e dependências identificados.

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| Processo de Criação › verificação de necessidade de RFC | `/eng.create-rfc` | Se a Tech Spec atender aos critérios que exigem RFC e o usuário escolher "A: Criar uma RFC agora" |
| Caminho A › 2A.2 Análise de Documentação de Produto | `/jarvis-docs-central` | Se `CENTRAL_DOCS_REPO` estiver configurado (buscar PRD/FRD relacionados do épico) |
| FASE 7 › 7.3 Criação no Jira | `ferramenta MCP/API do Jira` (referência a confirmar) | Se o projeto usar Jira e houver ferramenta MCP ou API disponível; senão fornecer template para criação manual (o texto não nomeia a ferramenta) |

---

## Input

Você receberá um épico ou história do $TASK_MANAGER de uma das seguintes formas:

- URL do card
- ID do card (ex: EPIC-42, STORY-123)
- Conteúdo textual copiado

<jira_story>
#$ARGUMENTS
</jira_story>

**Se não receber argumentos**, pergunte ao usuário pelo card.

---

## Detecção do Tipo: Épico ou História

**Antes de qualquer outra coisa**, determine se o input é um **épico** ou uma **história/task**.

**Se veio via URL/ID do $TASK_MANAGER:**
- Busque o card e verifique o campo `issuetype` (Epic / Story / Task / Sub-task)

**Se veio como texto:**
- Procure por indicadores: tipo explícito no cabeçalho, label "Epic", ausência de critérios de aceitação, escopo amplo sem subtarefas

**Se não for possível inferir com certeza**, pergunte antes de prosseguir:

```
Este card é um épico ou uma história?

A: Épico — escopo amplo, sem critérios de aceitação por story
B: História / Task — implementação específica, pronta para desenvolvimento
```

**Aguarde a resposta antes de prosseguir.**

> O tipo determina o fluxo inteiro:
> - **Épico** → Tech Spec arquitetural (sem quebra em subtarefas — a quebra em histórias vem do produto)
> - **História** → Tech Spec de implementação (subtarefas de 4h a 1 dia, plano de execução)

---

## Processo de Criação da Tech Spec

### FASE 1: Entendimento Profundo

#### 1.1 Leitura e Análise do Card

**Se recebeu URL/ID do $TASK_MANAGER:**

- Busque o card usando a API ou ferramenta disponível
- **Épico**: extraia título, descrição, objetivo de negócio, escopo e iniciativa relacionada
- **História**: extraia título, descrição, critérios de aceitação, épico relacionado, comentários relevantes

**Se recebeu conteúdo textual:**

- Parse o conteúdo para identificar os elementos principais

#### 1.2 Contexto de Negócio

Documente o **porquê** (problema de negócio), **quem** (usuários/personas impactados), o **valor** entregue e como se encaixa no épico/iniciativa maior.

#### 1.3 Validação de Pré-requisitos

- **Épico**: objetivo claro de negócio, escopo (o que está/não está incluído) e contexto/motivação.
- **História**: user story clara (Como [usuário], quero [capacidade], para que [benefício]), critérios de aceitação, contexto/motivação e escopo.

Se faltar informação crítica, liste o que falta e pergunte ao usuário ANTES de prosseguir; não assuma nada.

#### 1.4 Perguntas de Clarificação

Formule **3-5 perguntas críticas** sobre ambiguidades nos requisitos, premissas técnicas a validar, escopo e prioridades, restrições conhecidas e dependências (**épico**: outros épicos ou squads; **história**: outras histórias). **Apresente ao usuário** e aguarde as respostas antes de prosseguir.

---

### FASE 1.5: Validação de Necessidade de RFC

Antes de prosseguir com a investigação técnica, valide se esta Tech Spec **requer um RFC** conforme o [RFC-Playbook]($IDE/templates/engineering/RFC-Playbook@1.0.0.md).

#### 1.5.1 Checklist de Obrigatoriedade de RFC

Uma RFC é **obrigatória** se **qualquer** item abaixo for verdadeiro:

| Critério                                                     | Aplica?           |
| ------------------------------------------------------------ | ----------------- |
| Impacta **mais de uma squad**                                | ( ) Sim / ( ) Não |
| Altera **arquitetura**, **padrões técnicos** ou **infra**    | ( ) Sim / ( ) Não |
| Introduz **nova dependência crítica** (serviço, lib, vendor) | ( ) Sim / ( ) Não |
| Afeta **custo recorrente** (cloud, APIs, licenças)           | ( ) Sim / ( ) Não |
| Muda **SLA, SLO ou contratos técnicos**                      | ( ) Sim / ( ) Não |
| Pode gerar **lock-in** ou dívida técnica relevante           | ( ) Sim / ( ) Não |
| Envolve **dados sensíveis / compliance**                     | ( ) Sim / ( ) Não |
| Vai virar **padrão reutilizável**                            | ( ) Sim / ( ) Não |

#### 1.5.2 Resultado da Validação

**Se pelo menos um critério for "Sim":** avise "⚠️ RFC Obrigatória", liste os critérios que se aplicam e, antes de prosseguir, verifique se já existe uma RFC relacionada (senão, sugira `/eng.create-rfc`), aguarde a RFC aprovada (status: Accepted) e vincule-a à Tech Spec. Pergunte:

- **A**: Criar uma RFC agora (`/eng.create-rfc`)
- **B**: Vincular a uma RFC existente (informe o ID/caminho)
- **C**: Prosseguir sem RFC (justifique o motivo)

**Se nenhum critério for "Sim":** informe "✅ RFC Não Obrigatória", citando que nenhum dos 8 critérios se aplica, e siga para a Fase 2 (Investigação Técnica).

#### 1.5.3 Registro na Tech Spec

Independente do resultado, registre na Tech Spec:

- **RFC Relacionada**: {RFC-XXX ou "Não aplicável"}
- **Justificativa**: {Por que precisa/não precisa de RFC}

---

> ## ⚠️ Bifurcação de Fluxo
>
> A partir daqui, o processo diverge conforme o tipo detectado na etapa de Detecção:
>
> - **ÉPICO** → seguir o [Caminho A: Tech Spec Arquitetural](#caminho-a-épico--tech-spec-arquitetural) (Fases 2A → 3A → Doc)
> - **HISTÓRIA** → seguir o [Caminho B: Tech Spec de Implementação](#caminho-b-história--tech-spec-de-implementação) (Fases 2B → 2.5B → 3B → 4B → 5B → Doc)

---

## Caminho A: Épico → Tech Spec Arquitetural

### FASE 2A: Investigação Arquitetural

Foco em entender o sistema como um todo — não arquivos específicos, mas fronteiras e contratos.

#### 2A.1 Mapeamento de Componentes Existentes

Identifique os serviços/módulos impactados ou criados, leia a documentação de alto nível (`README.md`, `ARCHITECTURE.md`, ARDs em `$DOCS_FOLDER`) e mapeie as dependências entre serviços (não entre arquivos).

#### 2A.2 Análise de Documentação de Produto

Verifique PRD ou FRD relacionado ao épico em `$DOCS_FOLDER` ou no $TASK_MANAGER; com `CENTRAL_DOCS_REPO` configurado, busque via skill `jarvis-docs-central`.

#### 2A.3 Identificação de Restrições

Restrições técnicas (SLA, throughput, compliance), dependências de outros times ou squads e limitações da infraestrutura atual.

---

### FASE 3A: Proposta Arquitetural

Este é o **output principal** da Tech Spec de épico.

#### 3A.1 Decisões Arquiteturais

Para cada decisão importante, documente pelo menos 2 alternativas (a mais simples sempre entre elas), na estrutura da seção 2.5 do template: contexto, opções com prós e contras, decisão e justificativa (por que a mais simples não é suficiente, se aplicável).

#### 3A.2 Desenho da Solução

- **Estado Atual (As-Is)**: como o sistema funciona hoje na área impactada
- **Estado Proposto (To-Be)**: fronteiras de componentes, contratos entre serviços, fluxos de dados principais
- Crie diagramas Mermaid para comunicar a arquitetura (graph TD, sequenceDiagram)
- Integrações externas sem contrato confirmado → marcar como `[A DEFINIR]`

#### 3A.3 Contratos e Interfaces

Para cada novo serviço ou integração:

- Interface pública (endpoints, eventos, filas)
- Schema de dados trocados
- Comportamento em falha

#### 3A.4 Riscos Arquiteturais

Documente na tabela de riscos da seção 10 do template (risco, probabilidade, impacto, mitigação, plano B).

#### 3A.5 Apresentação ao Usuário

Apresente resumo executivo, diagramas e principais decisões. **Aguarde aprovação antes de gerar o documento.**

---

### FASE 4A: Geração do Documento Arquitetural

Salve em: `$SESSIONS_DIR/eng/{epic-slug}/tech-spec-arch.md`

Conteúdo obrigatório:

- [ ] Contexto do épico e objetivo de negócio
- [ ] Decisões arquiteturais com justificativas
- [ ] Diagramas de arquitetura e sequência
- [ ] Contratos e interfaces entre componentes
- [ ] Riscos identificados e mitigações
- [ ] RFC vinculada (se aplicável)

Após salvar, exiba:

```
✅ Tech Spec Arquitetural criada!

📄 Documento: $SESSIONS_DIR/eng/{epic-slug}/tech-spec-arch.md

📐 Decisões registradas: {N}
⚠️  Riscos identificados: {N}
🔗 RFC: {RFC-XXX ou "não aplicável"}

📌 Próximos passos:
- As histórias técnicas serão definidas pelo time de produto com base nesta spec
- Cada história poderá gerar sua própria Tech Spec de implementação via /eng.build-tech-spec
```

---

## Caminho B: História → Tech Spec de Implementação

### FASE 2: Investigação Técnica do Codebase

#### 2.1 Identificação de Componentes

Use Glob (ex.: `**/*auth*`, `**/api/**`) para achar os arquivos ligados à história, Grep para funções, endpoints e modelos de dados similares e Read para entender os componentes que serão modificados, os padrões e as dependências.

#### 2.2 Análise de Documentação Existente

Verifique se há documentação relevante:

- **PRD relacionada**: `$DOCS_FOLDER/**/*prd*.md` ou anexos no Jira
- **FRD relacionada**: `$DOCS_FOLDER/**/*frd*.md` ou anexos no Jira
- **ADRs (Architecture Decision Records)**: `$DOCS_FOLDER/ARD/*.md` ou `./sessions/**/adr.md`
- **README e documentação técnica**: `README.md`, `ARCHITECTURE.md`, `API.md`

#### 2.3 Identificação de Padrões e Convenções

Documente os padrões arquiteturais do projeto, convenções de nomenclatura, estrutura de pastas, frameworks e bibliotecas, padrões de testes e de tratamento de erros.

#### 2.4 Mapeamento de Dependências

Identifique:

- **Dependências externas**: APIs de terceiros, serviços externos

  > ⚠️ **Checkpoint obrigatório — Contratos de APIs externas** (aplicação de eng-rules: *"nunca invente endpoints ou integrações"*)
  >
  > Para cada API externa identificada, siga esta ordem **antes de avançar para a Fase 3**:
  >
  > **1. Buscar contrato no repositório primeiro:**
  > Procure por specs existentes nos seguintes locais:
  > - `docs/engineering/swagger/`
  > - `docs/engineering/openapi/`
  > - `**/*swagger*.{yaml,yml,json}`
  > - `**/*openapi*.{yaml,yml,json}`
  > - `**/*api-spec*.{yaml,yml,json}`
  >
  > → Se encontrar: use o contrato disponível. Documente com referência ao arquivo fonte.
  >
  > **2. Se não encontrar no repositório**, pergunte ao usuário:
  > *"Não encontrei o contrato da `{nome da API}` no repositório. Você tem o contrato real? (Sim / Não)"*
  >
  > - **Sim** → Solicite o contrato (arquivo, link ou conteúdo). Documente apenas o que estiver no contrato fornecido.
  > - **Não** → Registre como `[A DEFINIR — contrato pendente com {time/parceiro}]`. Não crie paths, schemas ou payloads fictícios.

- **Dependências internas**: Módulos/componentes do próprio sistema
- **Dependências de outras histórias**: Histórias que precisam estar concluídas antes

---

### FASE 2.5: Avaliação de Complexidade (obrigatória)

Antes de propor qualquer arquitetura, classifique a feature com critérios objetivos. Isso define o nível de complexidade **permitido** na proposta.

#### Tabela de Classificação

| Critério | Simples | Moderada | Complexa |
|---|---|---|---|
| **Volume esperado** | < 100 req/min | 100–10k req/min | > 10k req/min |
| **Serviços impactados** | 1 serviço | 2–3 serviços | 4+ serviços / multi-squad |
| **Necessidade de async** | Não | Opcional | Obrigatório |
| **Estado distribuído** | Não | Possível | Sim (cache, fila, saga) |
| **Rollback de dados** | Trivial | Migration simples | Migration complexa / multi-step |
| **SLA exigido** | Sem SLA formal | p95 < 1s | p95 < 200ms ou alta disponibilidade |

**Declare o resultado antes de avançar:**

```
Complexidade classificada: {Simples / Moderada / Complexa}

Critérios determinantes:
- {Critério 1}: {valor observado / informado}
- {Critério 2}: {valor observado / informado}

Implicação para a proposta arquitetural:
- Simples   → solução direta; sem filas, sem cache distribuído, sem eventos
- Moderada → async permitido se volume ou SLA justificar; documentar justificativa
- Complexa → arquitetura robusta autorizada; cada componente adicional deve ter justificativa explícita
```

> ⚠️ **Regra de proporcionalidade (guard rail)**: Só introduza complexidade (filas, eventos, cache distribuído, saga) se a classificação for **Moderada** ou **Complexa** E houver justificativa técnica documentada. Complexidade não justificada pela classificação é overengineering — reduza a proposta.

---

### FASE 3: Proposta Arquitetural

#### 3.1 Análise de Soluções Possíveis

Para cada decisão arquitetural importante, considere **pelo menos 2 alternativas**:

> 📌 **Regra obrigatória**: A opção **mais simples** deve ser sempre uma das alternativas consideradas. Se não for escolhida, o descarte deve ter justificativa técnica explícita vinculada à classificação de complexidade da Fase 2.5.

Registre cada decisão na estrutura da seção 2.5 do template (contexto, opções com prós, contras e trade-offs, decisão e justificativa, incluindo por que a mais simples não é suficiente).

#### 3.2 Desenho da Solução Técnica

Documente:

**Estado Atual (As-Is):**

- Como o sistema funciona hoje
- Fluxo de dados atual
- Componentes envolvidos

**Estado Proposto (To-Be):**

- Como o sistema funcionará após a implementação
- Novos fluxos de dados
- Componentes novos/modificados

  > 📌 Integrações externas sem contrato confirmado na Fase 2.4 devem aparecer como `[A DEFINIR]` — nunca com paths, schemas ou payloads fictícios.

**Crie diagramas Mermaid** quando útil:

- Diagrama de arquitetura (graph TD)
- Diagrama de sequência (sequenceDiagram)
- Diagrama de fluxo (flowchart)

#### 3.3 Seleção de Tecnologias/Bibliotecas

Para cada tecnologia ou biblioteca nova, registre nome e versão, justificativa, alternativas, riscos e licença compatível. **Priorize bibliotecas já usadas no projeto.**

#### 3.4 Apresentação da Proposta ao Usuário

Apresente o resumo executivo (2-3 parágrafos), o diagrama de arquitetura (se criado), as decisões técnicas e justificativas, as alternativas descartadas e os riscos com mitigações. **Aguarde aprovação do usuário antes de prosseguir**; se pedir mudanças, itere, atualize a documentação e apresente de novo.

---

### FASE 4: Quebra em Subtarefas Executáveis

#### 4.1 Estratégia de Faseamento

Divida a implementação em **fases lógicas e incrementais**: cada fase entrega **valor testável**, é **sequencial** quando há dependência e **paralela** quando independente, e cada subtarefa fica **entre 4 horas e 1 dia** (fatia vertical completa). Exemplo: 1. Backend/API (endpoints completos), 2. Frontend/UI (telas e modais completos, integrados à API), 3. Testes E2E e validação de performance.

#### 4.2 Criação de Subtarefas

Para cada subtarefa, preencha o bloco `SUBTASK` da seção 3 do template (descrição, arquivos, critérios de aceitação técnicos, testes requeridos, dependências, estimativa e prioridade P0/P1/P2), seguindo o princípio 3 da rule.

#### 4.3 Mapeamento de Dependências

Crie uma **hierarquia clara** de subtarefas:

```
STORY-XXX: {História original}
│
├─ Fase 1: Backend
│  ├─ SUBTASK-001: [BACKEND] Criar endpoint POST /api/recurso (migration + use-case + repository + controller + testes)
│  └─ SUBTASK-002: [BACKEND] Criar endpoint GET /api/recurso (fatia vertical completa)
│     └─ Paralela com: SUBTASK-001
│
├─ Fase 2: Frontend
│  └─ SUBTASK-003: [FRONTEND] Criar tela de listagem e modal de criação (componente + hooks + integração + testes)
│     └─ Depende de: SUBTASK-001 e SUBTASK-002
│
└─ Fase 3: Testes
   └─ SUBTASK-004: [QA] Testes E2E do fluxo completo (cruza backend e frontend)
      └─ Depende de: SUBTASK-003
```

> Cada subtarefa é uma fatia vertical de 4h a 1 dia. Nunca divida por camada (só migration, só modelo, só serviço).

#### 4.4 Validação da Quebra

Valide cada subtarefa com o "Template de Validação" (princípio 3) e as validações dos princípios 3 e 5 da rule: independente e completa, critérios claros, ordem lógica de dependência, estimativa entre 4h e 1 dia, e o conjunto cobre 100% da história. Fatia vertical: mergeada isoladamente a aplicação continua funcionando, a entrega é observável e há implementação funcional (não só contratos, interfaces ou tipos).

> Se qualquer item for "não" → reagrupar com a subtarefa seguinte até formar uma fatia vertical completa.
>
> ❌ Evitar: `[BACKEND] Criar interfaces e contratos do módulo X`
> ✅ Preferir: `[BACKEND] Criar endpoint GET /X/:id com retorno de dado real`

---

### FASE 5: Documentação de Riscos e Considerações

#### 5.1 Identificação de Riscos

Documente na tabela de riscos da seção 10 do template, com as categorias e a validação do princípio 4 da rule.

#### 5.2 Considerações Técnicas

Documente segurança (inputs, autenticação/autorização, OWASP Top 10, criptografia), performance (latência, throughput, otimizações, métricas), escalabilidade (escala horizontal, gargalos, limitações) e observabilidade (logs, métricas, alertas), nas seções 4.1 a 4.4 do template.

#### 5.3 Casos Extremos e Erros

Para cada caso extremo ou erro, registre o cenário, o comportamento esperado, a solução técnica e a mensagem ao usuário (se aplicável).

---

### FASE 6: Criação do Artefato Tech Spec

#### 6.1 Geração do Documento

**Preencha todas as seções** com as informações coletadas nas fases anteriores.

**Salve o arquivo na SESSÃO do projeto:**
`$SESSIONS_DIR/eng/{feature-name}/tech-spec.md`

Exemplo: `$SESSIONS_DIR/eng/story-123/tech-spec.md`

> **IMPORTANTE**: A tech spec é salva na sessão e anexada no Jira. O Jira é a fonte da verdade, não o repositório.

#### 6.2 Revisão de Qualidade

Valide o documento com o "Checklist de Revisão" da rule (conteúdo obrigatório, qualidade, subtarefas, decisões e riscos).

#### 6.3 Apresentação ao Usuário

Apresente o resumo da Tech Spec, o link do arquivo, a lista de subtarefas com estimativas e os próximos passos. **Aguarde aprovação final do usuário.**

---

### FASE 7: Criação de Subtarefas no Jira

#### 7.1 Preparação para Criação

**Se o projeto usa Jira e ferramentas MCP estão disponíveis:**

Para cada subtarefa no plano:

- Título: `SUBTASK-XXX: {Nome}`
- Descrição: Incluir descrição técnica, arquivos, critérios, testes
- Tipo: Subtask
- Pai: {STORY-XXX original}
- Prioridade: {P0/P1/P2}
- Estimativa: {X horas}
- Labels: `tech-spec`, `{área}` (ex: backend, frontend)

#### 7.2 Estrutura da Descrição no Jira

Use o formato **Entrega › Descrição da subtarefa no Jira** do template (seções: Descrição, Arquivos a Modificar/Criar, Critérios de Aceitação, Testes Requeridos, Dependências, Referência).

#### 7.3 Criação no Jira

**Se houver API/ferramenta disponível:**

- Use para criar subtarefas automaticamente
- Vincule à história pai
- Configure dependências entre subtarefas

**Se não houver ferramenta:**

- Forneça ao usuário **template formatado** para copiar/colar no Jira
- Forneça **instruções passo-a-passo** para criação manual

#### 7.4 Atualização da História Original

Adicione comentário na história original (STORY-XXX) no formato **Entrega › Comentário na história original** do template.

---

### FASE 8: Validação Final e Entrega

#### 8.1 Checklist de Conclusão

Valide que:

- [ ] Tech Spec completa e aprovada pelo usuário
- [ ] Arquivo salvo na sessão: `$SESSIONS_DIR/eng/{feature-name}/tech-spec.md`
- [ ] Tech Spec anexada na issue do Jira
- [ ] Subtarefas documentadas com critérios claros
- [ ] Subtarefas criadas no Jira (ou template fornecido)
- [ ] História original atualizada com link para tech spec
- [ ] Decisões arquiteturais documentadas
- [ ] Riscos identificados e mitigados
- [ ] Dependências mapeadas
- [ ] Estratégia de testes definida

#### 8.2 Entrega ao Usuário

Entregue ao usuário a **Entrega › Mensagem de entrega** do template.

---

## Regras

- **Nunca assuma, sempre pergunte**: informação crítica faltando, mais de uma interpretação ou decisão com trade-offs → pergunte ao usuário.
- Siga as convenções do projeto: analise o código existente antes de propor padrões novos e justifique qualquer desvio.
- Subtarefas, estimativas, riscos, testes e documentação seguem os princípios da rule (`eng.tech-spec-rules.md`).

## Templates

`templates/engineering/tech-spec-template.md`: estrutura da Tech Spec e, na seção final "Entrega", os formatos de entrega (descrição da subtarefa no Jira, comentário na história, mensagem de entrega e fluxo resumido).

## Tratamento de Erros

- História incompleta → liste o que falta e peça ao usuário para completar.
- Sem acesso ao Jira → peça ao usuário para copiar e colar o conteúdo da história.
- Conflito com a arquitetura existente → apresente o conflito e discuta antes de prosseguir.
- Estimativa muito alta → discuta reduzir o escopo ou dividir em várias histórias.
- Risco crítico sem mitigação clara → sinalize ao usuário e peça orientação antes de finalizar.

---

**Agora, inicie o processo com a história fornecida.**
