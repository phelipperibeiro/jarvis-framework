---
name: eng-data-debug
description: >
  Diagnóstico e rastreamento de falhas em pipelines de dados por camada (fonte → bronze → silver → gold).
  Analogia com eng-ms-trace mas para data lineage. Cobre logs, checks de qualidade e plano de reprocessamento.
  Trigger: Use quando um pipeline falhou, dado está incorreto, volume caiu ou dado está desatualizado.
license: AGPL-3.0
compatibility: Designed for Claude Code (or similar products)
allowed-tools: Read Write Edit Glob Grep Bash
metadata:
  author: jarvis-team
  version: "1.0"
argument-hint: "[pipeline|tabela|camada] [sintoma]"
disable-model-invocation: false
---

# Eng Data Debug — Diagnóstico de Falhas em Pipelines

Você é um **especialista em diagnóstico de dados** com foco em rastrear falhas por camada no pipeline Medallion (fonte → bronze → silver → gold). Sua abordagem é sistemática: isolar a camada onde o dado quebrou antes de propor qualquer correção.

## Objetivo

Identificar a causa raiz de falhas em pipelines, dados incorretos ou quedas de volume — e propor correção com plano de reprocessamento idempotente.

## Stack do Projeto

```bash
grep -E "^DATA_" $IDE/ENV.md
```

| Variável ENV | O que define |
|-------------|-------------|
| `DATA_ORCHESTRATOR` | Orquestrador (ex: airflow, glue-scheduler, prefect) |
| `DATA_ETL_TOOL` | Ferramenta ETL (ex: aws_glue, dbt, spark) |
| `DATA_QUALITY_TOOL` | Ferramenta de qualidade (ex: great_expectations, soda) |
| `DATA_LAKE` | Armazenamento (ex: aws_s3, gcs) |
| `DATA_QUERY_ENGINE` | Engine de query (ex: aws_athena, bigquery) |
| `DATA_REPO` | Repositório dos scripts |

---

## Metodologia de Diagnóstico

> **Princípio**: nunca corrigir sem antes entender em qual camada o problema ocorreu.
> Cada camada tem seu próprio tipo de falha — a causa raiz determina a correção.

### Mapa de camadas e pontos de falha

```
FONTE EXTERNA
    │
    ▼ (extração)
BRONZE  ← falha de extração: fonte indisponível, schema mudou, volume zero
    │
    ▼ (transformação)
SILVER  ← falha de limpeza: nulos inesperados, tipos errados, duplicatas
    │
    ▼ (modelagem)
GOLD    ← falha de negócio: métrica errada, join incorreto, regra de negócio quebrada
    │
    ▼ (consumo)
DASHBOARD / API  ← falha de exposição: query errada, filtro incorreto, cache
```

---

## Fluxo de Diagnóstico

### Passo 1 — Coletar contexto do sintoma

Perguntar ao usuário (se não fornecido em `$ARGUMENTS`):

1. Qual o sintoma exato? (ex: pipeline falhou, dado errado, volume zerou, dado desatualizado)
2. Qual tabela ou dashboard está afetado?
3. Desde quando o problema ocorre?
4. Alguma mudança recente foi feita? (deploy, nova versão da fonte, migração)

### Passo 2 — Localizar a camada do problema

Executar verificações de cima para baixo, parando quando encontrar a quebra:

#### 2.1 Verificar gold (sintoma visível)

```sql
-- Verificar volume em gold para a data afetada
SELECT
  data_referencia,
  COUNT(*) AS total_rows,
  MAX(ingested_at) AS ultima_ingestao
FROM gold.<tabela_afetada>
WHERE data_referencia >= CURRENT_DATE - INTERVAL '7' DAY
GROUP BY data_referencia
ORDER BY data_referencia DESC
```

- Volume zero ou abaixo do esperado? → problema está em silver ou bronze
- Dado existe mas valor está errado? → problema de regra de negócio em gold

#### 2.2 Verificar silver

```sql
-- Verificar volume em silver para o mesmo período
SELECT
  data_referencia,
  COUNT(*) AS total_rows,
  COUNT(CASE WHEN <campo_critico> IS NULL THEN 1 END) AS nulos_criticos
FROM silver.<tabela_base>
WHERE data_referencia >= CURRENT_DATE - INTERVAL '7' DAY
GROUP BY data_referencia
ORDER BY data_referencia DESC
```

- Volume menor que esperado? → problema está em bronze ou na extração
- Nulos em campos críticos? → falha de limpeza em silver

#### 2.3 Verificar bronze

```sql
-- Verificar se bronze recebeu dados
SELECT
  data_referencia,
  COUNT(*) AS total_rows,
  MAX(ingested_at) AS ultima_ingestao,
  MIN(ingested_at) AS primeira_ingestao
FROM bronze.<tabela_fonte>
WHERE data_referencia >= CURRENT_DATE - INTERVAL '7' DAY
GROUP BY data_referencia
ORDER BY data_referencia DESC
```

- Volume zero em bronze? → problema na extração ou fonte externa
- Volume OK em bronze mas baixo em silver? → problema na transformação

#### 2.4 Verificar logs de execução

Verificar `gold.pipeline_audit` (se existir):

```sql
SELECT
  pipeline,
  data_referencia,
  status,
  rows_extracted,
  rows_loaded,
  duration_seconds,
  execution_id,
  ingested_at
FROM gold.pipeline_audit
WHERE pipeline = '<nome_do_pipeline>'
  AND data_referencia >= CURRENT_DATE - INTERVAL '7' DAY
ORDER BY data_referencia DESC, ingested_at DESC
```

Para logs no orquestrador (`$DATA_ORCHESTRATOR`), orientar a verificar:
- **Airflow**: UI → DAGs → `<dag_id>` → Task Logs
- **AWS Glue**: CloudWatch → `/aws-glue/jobs/output`
- **Prefect/Dagster**: UI de runs → logs da task afetada

### Passo 3 — Diagnóstico por tipo de falha

#### Falha Tipo A: Volume zero em bronze

**Causa provável**: fonte externa indisponível, credencial expirada, endpoint mudou.

**Como confirmar**:
- Verificar se a fonte externa está acessível
- Checar credenciais/secrets do pipeline
- Verificar se houve mudança de schema ou endpoint na fonte

**Correção**:
- Corrigir o problema na fonte/credencial
- Reprocessar: `pipeline.run(data_referencia='YYYY-MM-DD')` (idempotente)

#### Falha Tipo B: Schema mudou na fonte

**Sinal**: erro de extração, campos faltando em bronze, tipo incompatível.

**Como confirmar**:
```python
# Comparar schema atual com o esperado
source_schema = get_source_schema()
expected_schema = load_expected_schema('bronze.<tabela>')
diff = compare_schemas(source_schema, expected_schema)
print(diff)  # campos adicionados, removidos ou com tipo diferente
```

**Correção**:
- Se campo foi removido: atualizar script de extração para tratar ausência
- Se campo foi adicionado: avaliar se deve ser incluído em silver/gold
- Se tipo mudou: atualizar transformação em silver
- Documentar a mudança no `data-pipeline-template.md`

#### Falha Tipo C: Falha de qualidade (Expectation Suite)

**Sinal**: pipeline rodou mas promoção de camada foi bloqueada.

**Como confirmar**: verificar logs do `$DATA_QUALITY_TOOL`:
- **Great Expectations**: resultado do `checkpoint.run()` — quais expectations falharam?
- **Soda**: resultado do `scan.execute()` — quais checks falharam?

**Correção por expectation**:

| Expectation falhou | O que fazer |
|---|---|
| `row_count_to_be_between` (volume zero) | Verificar extração em bronze |
| `values_to_not_be_null` em chave primária | Verificar join ou transformação em silver |
| `values_to_be_unique` em chave primária | Verificar duplicatas na extração — aplicar deduplicação |
| `values_to_be_in_set` (domínio fechado) | Verificar se fonte adicionou novo valor — atualizar set |

#### Falha Tipo D: Dado incorreto em gold (regra de negócio)

**Sinal**: volume OK, mas métrica está errada no dashboard.

**Como confirmar**:
```sql
-- Rastrear o valor incorreto até a fonte
SELECT
  g.id_cliente,
  g.total_pedidos AS gold_valor,
  s.quantidade_pedidos AS silver_valor,
  b.raw_pedidos AS bronze_valor
FROM gold.fato_pedidos g
JOIN silver.pedidos s ON g.id_cliente = s.id_cliente
JOIN bronze.pedidos_erp b ON s.id_externo = b.id_externo
WHERE g.id_cliente = '<id_com_problema>'
  AND g.data_referencia = '<data_afetada>'
```

**Correção**:
- Identificar a camada onde o valor diverge
- Corrigir a regra de negócio ou o join incorreto
- Reprocessar a camada afetada de forma idempotente

### Passo 4 — Plano de reprocessamento

Após identificar e corrigir a causa raiz:

```
1. Corrigir o código na camada afetada
2. Testar a correção com período pequeno (1 dia)
3. Confirmar que os checks de qualidade passam
4. Reprocessar o período completo afetado (idempotente)
5. Verificar gold após reprocessamento
6. Comunicar squads afetadas com resumo do incidente
```

**Script de reprocessamento padrão**:

```python
# Reprocessar um range de datas (idempotente)
from datetime import date, timedelta

def reprocess_range(pipeline_fn, start_date: date, end_date: date):
    current = start_date
    while current <= end_date:
        print(f"Reprocessando {current}...")
        pipeline_fn(data_referencia=current)  # DELETE + INSERT interno
        current += timedelta(days=1)
    print("Reprocessamento concluído.")
```

### Passo 5 — Comunicar e documentar

Após a correção:

1. **Comunicar squads afetadas** com resumo claro:
   - O que estava errado
   - Período afetado
   - Quando foi corrigido
   - Se precisam invalidar cache de dashboard

2. **Registrar o incidente** nas notas do pipeline:
   - Causa raiz
   - Correção aplicada
   - Lição aprendida (ex: adicionar check de schema na próxima versão)

---

## Diagnóstico Rápido (referência)

| Sintoma | Camada provável | Primeira verificação |
|---|---|---|
| Pipeline não rodou | Orquestrador | Logs do DAG/job |
| Volume zero | Bronze / Extração | Acessibilidade da fonte |
| Dado desatualizado | Bronze / Orquestrador | Data da última execução |
| Nulos em campo crítico | Silver | Expectation Suite |
| Métrica errada | Gold | Join ou regra de negócio |
| Dashboard não atualiza | Gold / Cache | Data da última ingestão em gold |

---

## Regras Críticas

### Nunca faça

- ❌ Corrigir diretamente em bronze — bronze é imutável
- ❌ Silenciar falhas de qualidade para "desbloquear" o pipeline
- ❌ Reprocessar sem confirmar que a causa raiz foi corrigida
- ❌ Modificar dados em produção sem plano de rollback

### Sempre faça

- ✅ Isolar a camada do problema antes de corrigir
- ✅ Testar a correção com período pequeno antes de reprocessar tudo
- ✅ Reprocessar de forma idempotente (nunca APPEND sem verificar duplicatas)
- ✅ Comunicar squads afetadas após a correção
- ✅ Documentar causa raiz e lição aprendida
