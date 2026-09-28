---
name: data-rules
description: >
  Regras de engenharia de dados: nomenclatura de camadas (Medallion),
  qualidade obrigatória com Great Expectations, idempotência, logs e política de dados sensíveis.
license: AGPL-3.0
metadata:
  author: jarvis-team
  version: "1.0"
---

> **Applies to:** HUB: DATA | POSITION: all | AREA: ENGINEERING | SQUAD: all

# Data Rules — Engenharia de Dados

## 1. Arquitetura de Camadas (Medallion)

| Camada | Nome | Responsabilidade |
|--------|------|-----------------|
| Ingestão bruta | `bronze` | Dados exatamente como vieram da fonte — sem transformação. Imutável. |
| Limpeza e tipagem | `silver` | Dados limpos, tipados e normalizados. Sem regras de negócio. |
| Analítico / BI | `gold` | Modelos prontos para consumo (fatos, dimensões, agregações). |

### Regras de camada

- **Bronze é imutável** — nunca modificar dados já ingeridos. Reprocessamento cria nova partição.
- **Silver não tem regra de negócio** — só limpeza, tipagem e deduplicação.
- **Gold é o que squads e dashboards consomem** — sempre documentado com contrato de dados.
- Campos de auditoria obrigatórios em todas as camadas: `ingested_at`, `source_system`, `data_referencia`.

### Nomenclatura de tabelas e campos

- Tabelas: `<camada>.<dominio>_<entidade>` → ex: `silver.vendas_pedidos`, `gold.fato_entregas`
- Campos: `snake_case` em português ou inglês — manter consistência dentro do domínio
- Chaves primárias: `id_<entidade>` → ex: `id_pedido`, `id_cliente`
- Datas: sufixo `_at` para timestamps (`criado_at`, `atualizado_at`), `_data` para datas (`referencia_data`)

---

## 2. Qualidade de Dados (Great Expectations)

Todo pipeline deve ter uma **Expectation Suite** no Great Expectations antes de ir para produção.

### Checks obrigatórios por pipeline

```python
# Mínimo obrigatório em toda suite
expect_table_row_count_to_be_between(min_value=1)
expect_column_values_to_not_be_null(column="<chave_primaria>")
expect_column_values_to_not_be_null(column="data_referencia")
expect_column_values_to_be_unique(column="<chave_primaria>")
```

### Checks recomendados (obrigatórios para gold)

```python
# Integridade de tipos
expect_column_values_to_be_of_type(column="<campo>", type_="<tipo>")

# Domínios fechados
expect_column_values_to_be_in_set(column="<status>", value_set=[...])

# Alerta de volume (queda > 50% vs. execução anterior)
expect_table_row_count_to_be_between(min_value=last_run_count * 0.5)
```

### Falha de qualidade

- **Bronze → Silver**: falha bloqueia a promoção. Dados permanecem em bronze.
- **Silver → Gold**: falha bloqueia publicação. Alerta no Slack canal do time de Data.
- Nunca silenciar falhas — registrar no log com contexto da execução.

---

## 3. Idempotência

Todo pipeline deve ser idempotente: **reprocessar o mesmo período não duplica dados**.

### Padrão obrigatório para carga

```python
# DELETE + INSERT (partição/período)
def load_idempotent(df, table: str, partition_col: str, partition_value: str):
    """Apaga a partição antes de inserir — garante idempotência."""
    delete_partition(table, partition_col, partition_value)
    insert(df, table)
```

### Para tabelas Athena (S3)

- Usar partições por `data_referencia` (formato `YYYY-MM-DD`)
- Reprocessamento sobrescreve o prefixo S3 da partição
- Nunca usar `APPEND` sem verificar duplicatas primeiro

---

## 4. Política de Logs

### O que logar (obrigatório)

Cada execução deve registrar:

```python
logger.info({
    "pipeline": "<nome>",
    "data_referencia": "<YYYY-MM-DD>",
    "status": "started|completed|failed",
    "rows_extracted": <int>,
    "rows_loaded": <int>,
    "duration_seconds": <float>,
    "execution_id": "<uuid>"
})
```

### Onde logar

- **AWS Glue**: logs automáticos no CloudWatch (`/aws-glue/jobs/output`)
- **Airflow**: logs nas tasks do DAG + CloudWatch quando em produção
- **Erros críticos**: alertar no canal Slack do time de Data (`#data-alerts` ou equivalente)

### Retenção

- Logs de execução: **90 dias** no CloudWatch
- Logs de erro: **1 ano** (auditoria)
- Metadados de pipeline (rows processados, duração): persistir em tabela `gold.pipeline_audit`

---

## 5. Política de Dados Sensíveis

> **TODO:** Política ainda não definida pelo time. Pendente decisão sobre mascaramento e controle de acesso IAM.

### Campos considerados sensíveis (provisório)

- CPF, RG e documentos de identificação
- Dados bancários
- Localização em tempo real
- Dados pessoais de contato (telefone, endereço)

### Regras provisórias até definição formal

- ❌ Nunca expor CPF em tabelas `gold` sem mascaramento
- ❌ Nunca incluir dados sensíveis em dashboards Metabase sem aprovação
- ✅ Dados sensíveis em `bronze` mantidos com acesso restrito por IAM role
- ✅ Qualquer exposição de dados sensíveis para squads deve ter contrato de dados aprovado

---

## 6. Repositório de Scripts

- Scripts de pipeline vivem no repositório **`data-pipelines`** (repo dedicado)
- Estrutura sugerida:

```
data-pipelines/
  jobs/
    bronze/    # scripts de ingestão
    silver/    # scripts de transformação
    gold/      # scripts de modelagem analítica
  dags/        # DAGs do Airflow
  expectations/ # Suites do Great Expectations
  docs/        # documentação de pipelines (data-pipeline-template.md)
  contracts/   # contratos de dados (data-contract-template.md)
```

---

## 7. Processo de Solicitação de Dados (Inter-squads)

Squads que precisam de dados do time de Data devem:

1. **Abrir thread** no canal Slack `#data-requests` (ou equivalente) com:
   - Caso de uso: o que precisa e por quê
   - Frequência de uso (ad-hoc, recorrente)
   - SLA esperado
2. **Time de Data** avalia e abre card no board **DE** com as informações formalizadas
3. Se recorrente → criar contrato de dados (`data-contract-template.md`)
4. Se ad-hoc → query avulsa entregue no Slack

---

## Regras Críticas

### Nunca faça

- ❌ Modificar tabela bronze — bronze é imutável
- ❌ Pipeline sem Expectation Suite em produção
- ❌ Hardcode de credenciais — sempre AWS Secrets Manager ou variáveis de ambiente
- ❌ `SELECT *` em produção — sempre listar campos explicitamente
- ❌ Expor dados sensíveis (CPF, dados pessoais) sem mascaramento e aprovação
- ❌ Pipeline sem log de execução (início, fim, volume, status)

### Sempre faça

- ✅ Idempotência: reprocessar não duplica
- ✅ Logs estruturados com `data_referencia`, volume e status
- ✅ Expectation Suite antes de publicar em gold
- ✅ Contrato de dados antes de expor gold para outra squad
- ✅ Versionar queries SQL significativas em arquivos `.sql` no repo `data-pipelines`
- ✅ Particionamento por `data_referencia` em todas as tabelas Athena