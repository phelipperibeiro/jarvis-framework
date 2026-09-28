---
description: Guia completo para criar, documentar e validar um novo pipeline de dados
auto_execution_mode: 2
agent: "$IDE/agents/engineering/data/eng.data-engineer.agent.md"
rules_file: "$IDE/rules/engineering/data/data-rules.md"
template_file: "$IDE/templates/engineering/data-pipeline-template.md"
recommended_model: claude-sonnet-4-20250514
model_tier: high
model_justification: Criação de pipeline envolve análise de fonte, modelagem de schema, definição de qualidade e geração de documentação técnica detalhada
---

# data.new-pipeline

Guia completo para criar um novo pipeline de dados — da concepção à produção —
seguindo as convenções definidas em `$IDE/rules/engineering/data/data-rules.md`.

> 📋 **Rules**: `$IDE/rules/engineering/data/data-rules.md`
> 📤 **Template**: `$IDE/templates/engineering/data-pipeline-template.md`
> 🤖 **Agente**: `$IDE/agents/engineering/data/eng.data-engineer.agent.md`

---

## Agentes recomendados

- **eng.data-engineer** *(primário — obrigatório)*: conduz todo o workflow; responsável pelo pipeline, schema, qualidade e documentação.
  - Arquivo: `$IDE/agents/engineering/data/eng.data-engineer.agent.md`
  - Quando usar: sempre — é o agente principal deste workflow.

- **eng.dev-code-reviewer** *(opcional)*: revisão dos scripts Python antes do deploy em produção.
  - Arquivo: `$IDE/agents/engineering/eng.dev-code-reviewer.md`
  - Quando usar: quando o pipeline tiver lógica de transformação complexa ou antes de qualquer push para o repositório de pipelines.

- **eng.qa.test-planner** *(opcional)*: apoio no design da Expectation Suite quando o pipeline for crítico ou tiver regras de negócio sofisticadas.
  - Arquivo: `$IDE/agents/engineering/qa/eng.qa.test-planner.md`
  - Quando usar: pipelines gold com múltiplos casos de uso, dados sensíveis ou SLA rigoroso.

- **eng.docs-writer** *(opcional)*: complementa a documentação técnica do pipeline quando houver necessidade de aprofundamento (diagramas, runbook, troubleshooting).
  - Arquivo: `$IDE/agents/engineering/eng.docs-writer.md`
  - Quando usar: pipelines de alta criticidade ou que precisam de documentação de suporte além do template padrão.

---

## Entrada

<pipeline_info>
#$ARGUMENTS
</pipeline_info>

**Se não receber argumentos**, perguntar ao usuário (uma pergunta por vez):

1. Qual o nome do pipeline? (ex: `clientes_cadastro`, `vendas_pedidos_diarios`)
2. Qual o domínio de negócio? (ex: clientes, vendas, financeiro, operacional)
3. Qual a camada destino? (`bronze` / `silver` / `gold` — ou o fluxo completo bronze→gold)
4. Qual a fonte de dados? (sistema de origem, tabela ou endpoint)
5. Qual a frequência de execução? (ex: diário 06h, horário, sob demanda)
6. Há uma squad requisitante? (squad que vai consumir os dados)

---

## Pré-verificação — Fonte nova ou existente?

> Antes de iniciar, verificar se já há dados desta fonte em bronze.

**Se a fonte nunca foi ingerida antes** (pipeline totalmente novo):
→ Executar `eng-data-onboard` primeiro para fazer schema discovery, amostragem e criar a camada bronze.
→ Arquivo: `$IDE/skills/eng-data-onboard/SKILL.md`
→ Voltar para este workflow após o bronze estar validado (Fases 3–5 do onboard concluídas).

**Se a fonte já existe em bronze** → continuar diretamente com a Fase 1 abaixo.

---

## Fase 1 — Documentação (obrigatória antes de qualquer código)

### 1.1 — Criar doc do pipeline

Preencher `$IDE/templates/engineering/data-pipeline-template.md` com as informações coletadas.

Salvar em:
```
{REPO_DATA}/docs/{nome_pipeline}.md
```

> `{REPO_DATA}` = repositório de scripts de pipeline definido nas rules.

### 1.2 — Validar nomenclatura Medallion

Verificar se os nomes de tabela seguem o padrão definido nas rules:

```
<camada>.<dominio>_<entidade>
```

Exemplos válidos: `bronze.clientes_crm`, `silver.pedidos`, `gold.fato_vendas`

Verificar também:
- Campos de auditoria obrigatórios: `ingested_at`, `source_system`, `data_referencia`
- Chave primária: `id_<entidade>`
- Campos de data: sufixo `_at` para timestamps, `_data` para datas

### 1.3 — Identificar campos sensíveis

Consultar seção "Campos considerados sensíveis" nas rules.

Se houver campos sensíveis:
- Documentar na seção **Campos Sensíveis** do template
- Verificar se o tratamento (mascaramento, restrição de acesso) está definido
- Se não estiver — **bloquear** promoção para gold até decisão do time

---

## Fase 2 — Qualidade (obrigatória antes de produção)

### 2.1 — Criar Expectation Suite

Antes de qualquer deploy, criar a suite de qualidade conforme as rules.

Checks mínimos obrigatórios (detalhamento nas rules):

| Check | Camada |
|-------|--------|
| Volume mínimo ≥ 1 | Todas |
| `id_<entidade>` NOT NULL | Todas |
| `data_referencia` NOT NULL | Todas |
| `id_<entidade>` UNIQUE | Todas |
| Alerta de queda de volume (≥ 50% da execução anterior) | Silver e Gold |
| Domínios fechados para campos de status | Gold |

Salvar suite em:
```
{REPO_DATA}/expectations/{nome_pipeline}_suite.json
```

### 2.2 — Validar idempotência

Garantir que reprocessar o mesmo período não duplica dados.

Padrão obrigatório: **DELETE + INSERT por partição** (ver exemplo nas rules).

Para tabelas de armazenamento analítico: usar particionamento por `data_referencia`.

---

## Fase 3 — Implementação

### 3.1 — Estrutura de scripts

Criar os scripts no repositório de pipelines conforme estrutura definida nas rules:

```
jobs/
  bronze/{nome_pipeline}.py   ← extração e ingestão bruta
  silver/{nome_pipeline}.py   ← limpeza, tipagem, deduplicação
  gold/{nome_pipeline}.py     ← modelagem, agregações (se gold)
dags/
  {nome_pipeline}_dag.py      ← DAG de orquestração (se aplicável)
expectations/
  {nome_pipeline}_suite.json  ← suite do Great Expectations
```

### 3.2 — Logs obrigatórios

Cada script deve registrar no início e ao final da execução:

```python
{
  "pipeline": "<nome>",
  "data_referencia": "<YYYY-MM-DD>",
  "status": "started | completed | failed",
  "rows_extracted": <int>,
  "rows_loaded": <int>,
  "duration_seconds": <float>,
  "execution_id": "<uuid>"
}
```

Destino dos logs: conforme definido nas rules (CloudWatch ou equivalente).

### 3.3 — Credenciais e acesso

- ❌ Nunca hardcodar credenciais no código
- ✅ Usar AWS Secrets Manager, variáveis de ambiente ou equivalente definido nas rules
- ✅ Verificar se a IAM role (ou equivalente) tem as permissões mínimas necessárias

---

## Fase 4 — Validação pré-produção

### Checklist obrigatório

```
[ ] Doc do pipeline preenchido e salvo
[ ] Nomenclatura Medallion validada
[ ] Campos sensíveis identificados e tratados (ou bloqueio documentado)
[ ] Expectation Suite criada e passando
[ ] Idempotência testada (reprocessamento não duplica)
[ ] Logs estruturados implementados (início, fim, volume, status)
[ ] Credenciais via variáveis de ambiente (sem hardcode)
[ ] DAG ou scheduler configurado (se pipeline recorrente)
```

### Regras de promoção entre camadas (conforme rules)

- **Bronze → Silver**: falha na suite bloqueia a promoção
- **Silver → Gold**: falha na suite bloqueia a publicação + alerta no canal do time de Data

---

## Fase 5 — Contrato de dados (obrigatório para gold)

Se a camada destino for `gold` **e houver squad consumindo**:

> ⚠️ Dado em gold exposto para outra squad **exige contrato de dados**.

Executar `data.contract.md` para formalizar:
- Schema, SLA, owner e restrições de acesso
- Casos de uso aprovados

---

## Regras críticas (ver detalhamento completo em data-rules.md)

### Nunca
- ❌ Deploy em produção sem Expectation Suite
- ❌ Modificar dados já ingeridos em bronze
- ❌ `SELECT *` em produção — sempre listar campos explicitamente
- ❌ Expor CPF ou dados pessoais em gold sem mascaramento e aprovação
- ❌ Pipeline recorrente sem log de execução

### Sempre
- ✅ Idempotência: reprocessar não duplica
- ✅ Particionamento por `data_referencia` em tabelas analíticas
- ✅ Contrato de dados antes de expor gold para outra squad
- ✅ Queries SQL significativas versionadas no repositório de pipelines