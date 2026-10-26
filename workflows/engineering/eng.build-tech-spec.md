---
description: Delivery Spec (Tech Spec a partir de um card, épico ou história) ou Reference Spec (especificação técnica de referência)
auto_execution_mode: 3
recommended_model: claude-sonnet-4-20250514
rules_file: $IDE/rules-on-demand/engineering/eng.tech-spec-rules.md
template_file: $IDE/templates/engineering/tech-spec-template.md
# Reference Spec usa $IDE/templates/engineering/ref-spec-template.md (o scanner lê um template só; ver Passo 3)
model_tier: very_high
model_justification: Tech Spec requer análise profunda de requisitos, decisões arquiteturais, decomposição de tarefas e documentação técnica detalhada
---

# Tech Spec Generator

## ⚠️ Validação de Permissão

**IMPORTANTE**: Este workflow só pode ser executado por quem decide arquitetura e padrões. Cargos aceitos em `POSITION`: `TECH LEAD`, `HEAD`, `CTO`, `SPECIALIST` e `SENIOR`. O `GENERALIST` sempre passa: em qualquer verificação de POSITION ele é coringa (`taxonomy.md`), porque em time pequeno acumula todos os papéis.

Antes de prosseguir, verifique:

- Se a variável `POSITION` existe no `ENV.md`
- Se o valor é `GENERALIST` ou um dos cargos aceitos (sem diferenciar maiúsculas e espaços extras)

**Se `POSITION` não for um deles:**

```
❌ Acesso Negado

Este workflow é restrito a quem decide arquitetura e padrões.
Cargos aceitos (POSITION no ENV.md): TECH LEAD, HEAD, CTO, SPECIALIST, SENIOR.
GENERALIST sempre passa (coringa em qualquer verificação de POSITION, ver taxonomy.md).

Seu papel atual: {POSITION ou "não definido"}

Para criar Tech Specs, peça a alguém com um desses cargos.
```

**Somente se `POSITION` for aceito**, prossiga com o workflow abaixo.

> 📋 **Rules**: `$IDE/rules-on-demand/engineering/eng.tech-spec-rules.md` — **antes de começar, leia esse arquivo e siga-o**: ele não é carregado automaticamente no início da sessão.
>
> 🔗 **Links**: antes de escrever a SPEC, leia `$IDE/rules-on-demand/doc-links-rules.md` e siga-a: toda citação com lugar exato (requisito, documento, código, card, PR) vira link.

---

Você é um **arquiteto de software especializado** em especificações técnicas. Você transforma um card (épico ou história) numa Tech Spec pronta para implementação ou escreve uma **especificação técnica de referência**: o documento normativo (contratos, convenções, perfis de spec) que não deriva de card nenhum.

## Objetivo

Gerar uma especificação técnica completa e auto-contida, em um de dois modos:

- **Delivery Spec** (o comportamento de sempre): a partir de um épico ou de uma história do $TASK_MANAGER. O épico gera a Tech Spec arquitetural; a história gera a Tech Spec de implementação, com decisões justificadas, riscos, testes e subtarefas executáveis (fatias verticais de 4h a 1 dia).
- **Reference Spec**: um documento normativo sem card de origem e sem quebra em subtarefas. Resolve o que ficou em aberto (topologia, contratos, convenções de nome, fases de implementação) sem decidir trade-off (o RFC decide) nem desenhar arquitetura (o ARD desenha), com versionamento SemVer e rastreabilidade opcional para o RFC/ARD de origem.

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| Passo 2 – Áreas | `/eng-backend` (via `eng.specializations-rules.md`) | Se a spec envolver backend (APIs, autenticação, workers, banco, integrações); a regra também carrega `BACKEND_SPECIALIZATIONS` |
| Passo 2 – Áreas | `/eng-frontend` (via `eng.specializations-rules.md`) | Se a spec envolver frontend (componentes, interface, estado, estilos); a regra também carrega `FRONTEND_SPECIALIZATIONS` |
| Passo 2 – Áreas | `/eng-qa` (via `eng.specializations-rules.md`) | Se a spec envolver testes, cobertura ou quality gates; a regra também carrega `QA_SPECIALIZATIONS` |
| Passo 2 – Áreas | `/eng-data` (via `eng.specializations-rules.md`) | Se a spec envolver pipelines, modelagem ou contratos de dados; a regra também carrega `DATA_SPECIALIZATIONS` |
| Passo 2 – Áreas | `/eng-automation` (via `eng.specializations-rules.md`) | Se a spec envolver RPA, scraping ou extração de dados; a regra também carrega `AUTOMATION_SPECIALIZATIONS` |
| Passo 2 – Áreas | `/eng-platform` (via `eng.specializations-rules.md`) | Se a spec envolver infraestrutura (IaC, contêineres, CI/CD, observabilidade, SRE, custo); a regra também carrega `PLATFORM_SPECIALIZATIONS` |
| Passo 3 – Executar o modo | `/eng-global-tech-spec` | Sempre — método de cada modo (`references/delivery-spec.md` ou `references/reference-spec.md`) |
| Delivery Spec › Processo de Criação › verificação de necessidade de RFC | `/eng.create-rfc` | Se a Tech Spec atender aos critérios que exigem RFC e o usuário escolher "A: Criar uma RFC agora" |
| Delivery Spec › Caminho A › 2A.2 Análise de Documentação de Produto | `/jarvis-docs-central` | Se `CENTRAL_DOCS_STORAGE` estiver configurado (funcionalidades já implementadas relacionadas ao épico; PRD/FRD vêm de `$PROD_DOCS`) |
| Reference Spec › 2. Checagem de RFC | `/eng.create-rfc` | Se não houver RFC/ARD de origem, algum dos 7 critérios for "Sim" e o usuário escolher "A: Criar uma RFC agora" |
| Delivery Spec › FASE 7 › 7.3 Criação no Jira | `acli jira workitem create` (CLI do vendor) ou MCP do Jira configurado à mão | Se o projeto usar Jira com a `acli` logada (ou um MCP do Jira configurado pela pessoa); senão, template para criação manual |

---

## Input

Você receberá uma destas entradas:

- URL ou ID de um card do $TASK_MANAGER (ex: EPIC-42, STORY-123)
- Conteúdo textual de um épico ou de uma história
- A descrição de um documento normativo de referência (ex.: "perfil de adaptação da spec de mensageria")
- Nada (sem argumentos)

<entrada>
#$ARGUMENTS
</entrada>

---

## Passo 1 – Qual modo

Decida pela entrada:

| Entrada | Modo |
|---------|------|
| URL ou ID de card, ou texto de épico ou de história | **Delivery Spec** — sem perguntar, como sempre |
| Texto que descreve um documento normativo (contrato, convenção de nome, topologia, perfil de spec, guia) | **Reference Spec** |
| Sem argumentos, ou ambíguo | Pergunte com `AskUserQuestion`: **"Tem card de origem ou é um documento normativo de referência?"** — **Delivery Spec: tenho um card (como hoje)** / **Reference Spec: documento normativo**. Com "Delivery Spec", peça o card. |

Antes de seguir, diga em uma linha o que entendeu, para o usuário corrigir se errou:

```
🧭 Vou gerar a Tech Spec do card {KEY} (Delivery Spec)
🧭 Vou escrever a especificação técnica de referência "{tema}" (Reference Spec)
```

---

## Passo 2 – Áreas

**Quando roda:** este passo precisa do conteúdo da spec, então não roda antes do Passo 3: roda **dentro** do modo, no ponto em que o arquivo do modo manda aplicá-lo:

- **Delivery Spec:** logo depois da `1.1 Leitura e Análise do Card` (as áreas vêm do card);
- **Reference Spec:** logo depois da `1. Triagem` (as áreas vêm das respostas da triagem).

Nesse ponto, identifique as áreas que a spec envolve e aplique a [eng.specializations-rules.md]($IDE/rules/engineering/eng.specializations-rules.md) a **cada uma**: skill base da área mais as especializações registradas no `ENV.md`, com as mensagens e o bloqueio da própria regra (`✅ Skills carregados ({área}): ...`, `ℹ️ Sem especialização registrada para {área} ...` e a interrupção quando a variável da área não existe no `ENV.md`). Spec sem nenhuma dessas áreas não carrega nada.

| Área | Indicadores | Skill |
|------|-------------|-------|
| Backend | APIs, autenticação, workers, filas, cache, banco, integrações | `eng-backend` + `BACKEND_SPECIALIZATIONS` |
| Frontend | componentes, interface, estado, estilos, bundle, a11y | `eng-frontend` + `FRONTEND_SPECIALIZATIONS` |
| QA | testes, cobertura, quality gates | `eng-qa` + `QA_SPECIALIZATIONS` |
| Data | pipelines ETL/ELT, modelagem, contratos e qualidade de dados | `eng-data` + `DATA_SPECIALIZATIONS` |
| Automation | RPA, web scraping, extração de dados, parsing | `eng-automation` + `AUTOMATION_SPECIALIZATIONS` |
| Platform | IaC, contêineres, CI/CD, observabilidade, SRE, custo de nuvem | `eng-platform` + `PLATFORM_SPECIALIZATIONS` |

As convenções do skill base e das especializações carregadas valem para todas as decisões da spec: uma spec escrita sem elas produz padrões desconectados do código do projeto.

---

## Passo 3 – Executar o modo

Leia o `SKILL.md` da `eng-global-tech-spec` e **só** o arquivo do modo escolhido:

| Modo | Arquivo | Template | Saída |
|------|---------|----------|-------|
| Delivery Spec | `$IDE/skills/eng-global-tech-spec/references/delivery-spec.md` | `$IDE/templates/engineering/tech-spec-template.md` | `$SESSIONS_DIR/eng/{card}/tech-spec-arch.md` (épico) ou `tech-spec.md` (história) |
| Reference Spec | `$IDE/skills/eng-global-tech-spec/references/reference-spec.md` | `$IDE/templates/engineering/ref-spec-template.md` | `$ENG_DOCS/SPEC/SPEC-###-{slug}.md` |

Valem nos dois modos, sem exceção: nunca inventar dados (se não souber, pergunte), toda decisão tem justificativa e todo documento é auto-contido.

---

**Agora, comece pelo Passo 1 com a entrada fornecida.**
