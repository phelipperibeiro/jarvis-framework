---
description: Guia para criar contrato de dados entre o time de Data e uma squad requisitante
auto_execution_mode: 2
agent: "$IDE/agents/engineering/data/eng.data-engineer.agent.md"
rules_file: "$IDE/rules/engineering/data/data-rules.md"
template_file: "$IDE/templates/engineering/data-contract-template.md"
recommended_model: claude-sonnet-4-20250514
model_tier: medium
model_justification: Criação de contrato é estruturada — preencher template com informações fornecidas, sem necessidade de raciocínio arquitetural complexo
---

# data.contract

Guia para formalizar um contrato de dados entre o time de Data e uma squad requisitante,
seguindo as convenções definidas em `$IDE/rules/engineering/data/data-rules.md`.

> 📋 **Rules**: `$IDE/rules/engineering/data/data-rules.md`
> 📤 **Template**: `$IDE/templates/engineering/data-contract-template.md`
> 🤖 **Agente**: `$IDE/agents/engineering/data/eng.data-engineer.agent.md`

> ℹ️ **Quando usar**: sempre que um dado em camada `gold` for exposto para consumo recorrente por outra squad.
> Para consultas ad-hoc, não é necessário contrato — entregar via canal de solicitação de dados.

---

## Agentes recomendados

- **eng.data-engineer** *(primário — obrigatório)*: conduz todo o workflow; responsável por formalizar o contrato, definir schema, SLA e restrições de acesso.
  - Arquivo: `$IDE/agents/engineering/data/eng.data-engineer.agent.md`
  - Quando usar: sempre — é o agente principal deste workflow.

- **prod.pm-checker** *(opcional)*: valida se o caso de uso descrito pela squad requisitante está bem especificado e alinhado com o produto antes de formalizar o contrato.
  - Arquivo: `$IDE/agents/product/prod.pm-checker.md`
  - Quando usar: quando o caso de uso vier de uma solicitação de produto (squad de analytics/BI, analytics de negócio) ou houver ambiguidade sobre o que a squad realmente precisa.

- **eng.docs-writer** *(opcional)*: apoia na redação de definições de negócio e glossário do contrato quando os dados tiverem semântica complexa.
  - Arquivo: `$IDE/agents/engineering/eng.docs-writer.md`
  - Quando usar: contratos de domínios com muitos termos de negócio (financeiro, operacional, BI).

---

## Entrada

<contract_info>
#$ARGUMENTS
</contract_info>

**Se não receber argumentos**, perguntar ao usuário (uma pergunta por vez):

1. Qual a squad requisitante?
2. Qual o caso de uso? (o que a squad precisa e por quê)
3. Qual a tabela ou recurso de dados? (ex: `gold.fato_pedidos`)
4. O pipeline que alimenta essa tabela já existe e está documentado?
5. Há campos sensíveis envolvidos? (CPF, dados pessoais, localização)

---

## Fase 1 — Verificação de pré-requisitos

### 1.1 — Confirmar solicitação formal

O processo deve ter sido iniciado via canal de solicitação de dados (Slack `#data-requests` ou equivalente definido nas rules).

Se não houver solicitação formal registrada:
> ⚠️ Orientar a squad a abrir thread no canal com: caso de uso, frequência e SLA esperado — antes de prosseguir.

### 1.2 — Confirmar existência do pipeline e da tabela gold

Verificar se:
- A tabela `gold.<nome>` existe e está populada
- O pipeline que a alimenta está documentado (`data.new-pipeline.md`)
- A Expectation Suite está ativa e passando

Se o pipeline ainda não existe: executar `data.new-pipeline.md` antes de criar o contrato.

---

## Fase 2 — Preenchimento do contrato

Preencher `$IDE/templates/engineering/data-contract-template.md` com as informações coletadas.

### 2.1 — Campos obrigatórios

| Campo | Observação |
|-------|-----------|
| Nome do contrato | Padrão: `{squad_requisitante}_{tabela}` (ex: `core_fato_pedidos`) |
| Tabela / recurso | Sempre em camada `gold` |
| Squad dona dos dados | Squad de Data (conforme `$SQUAD` do time responsável) |
| Squad requisitante | Conforme solicitação |
| Caso de uso | Descrição objetiva — o que a squad vai fazer com o dado |
| Status | `Ativo` ao criar |
| Válido até | Definir prazo ou `Indeterminado` |

### 2.2 — Schema

Listar **todos** os campos que serão expostos para a squad requisitante.

Para cada campo, identificar:
- Tipo de dado
- Nulável?
- Sensível? (CPF, dados pessoais, localização — consultar seção nas rules)

> Se houver campos sensíveis: confirmar que o tratamento (mascaramento) está aplicado antes de expor.

### 2.3 — SLA de atualização

Definir com base no pipeline que alimenta a tabela:

| Campo | Definição |
|-------|----------|
| Frequência | Frequência de execução do pipeline |
| SLA de disponibilidade | Quando os dados do dia D estarão disponíveis |
| Janela de reprocessamento | Período coberto em caso de reprocessamento (ex: últimos 7 dias) |

> SLA é definido por pipeline — não há SLA global. Consultar doc do pipeline.

### 2.4 — Acesso

Definir como a squad vai consumir os dados:

| Método | Quando usar |
|--------|------------|
| Query direta (Athena ou equivalente) | Análises ad-hoc, engenharia |
| Dashboard (Metabase ou equivalente) | Visualização de negócio |
| Acesso IAM | Quando a squad precisar de acesso programático |

> Acesso é solicitado via canal de dados + card no board do time de Data.

---

## Fase 3 — Qualidade garantida

Documentar na seção **Qualidade Garantida** do contrato os checks ativos na Expectation Suite:

- Volume mínimo
- Nulos e unicidade de chave primária
- Checks de negócio específicos para esta tabela

> A squad consumidora deve ser informada sobre o que está garantido — e o que **não** está.

---

## Fase 4 — Publicação e comunicação

### 4.1 — Salvar contrato

Salvar o contrato preenchido em:
```
{REPO_DATA}/contracts/{nome_contrato}.md
```

> `{REPO_DATA}` = repositório de scripts de pipeline definido nas rules.

### 4.2 — Comunicar à squad requisitante

Notificar no canal de solicitação de dados (thread original) com:
- Link para o contrato
- Como acessar os dados (método, IAM role ou equivalente)
- SLA combinado
- Contato do owner para dúvidas

### 4.3 — Abrir card no board do time de Data

Criar card no board `DE` (ou equivalente) com:
- Squad requisitante
- Tabela/recurso
- Status: `Ativo`
- Link para o contrato

---

## Fase 5 — Ciclo de vida do contrato

### Alteração de schema

Qualquer mudança de schema (adição, remoção ou tipo de campo) deve:

1. Ser comunicada no canal de dados com **antecedência** (prazo definido nas rules)
2. Gerar nova versão do contrato (versionamento semântico: `MAJOR.MINOR`)
3. Manter versão antiga disponível pelo período de coexistência definido nas rules

### Deprecação

Quando o contrato não for mais necessário:
1. Atualizar `Status` para `Deprecado` no documento
2. Comunicar à squad requisitante com prazo de encerramento
3. Atualizar (ou remover) o card no board do time de Data

---

## Checklist final

```
[ ] Solicitação formal registrada no canal de dados
[ ] Pipeline alimentador existe e está documentado
[ ] Tabela gold populada e com Expectation Suite ativa
[ ] Contrato preenchido (schema, SLA, acesso, campos sensíveis)
[ ] Campos sensíveis com tratamento aplicado (ou ausência confirmada)
[ ] Contrato salvo no repositório de pipelines
[ ] Squad requisitante notificada com acesso e SLA
[ ] Card aberto no board do time de Data
```
