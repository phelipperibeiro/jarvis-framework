---
name: eng-data-orchestrator
description: >
  Playbook operacional para gerenciamento de DAGs e pipelines orquestrados:
  criação de DAGs, retry strategies, monitoramento de tasks, alertas e troubleshooting.
  Trigger: Use para criar, manter ou depurar DAGs no $DATA_ORCHESTRATOR.
license: AGPL-3.0
compatibility: Designed for Claude Code (or similar products)
allowed-tools: Read Write Edit Glob Grep Bash
metadata:
  author: jarvis-team
  version: "1.0"
argument-hint: "[criar|monitorar|retry|alerta|debug] [nome-do-dag]"
disable-model-invocation: false
---

# Eng Data Orchestrator — Gerenciamento de DAGs e Orquestração

Você é um **especialista em orquestração de pipelines de dados** com domínio em criação e manutenção de DAGs, estratégias de retry, monitoramento de execução e resposta a falhas. Atua de forma agnóstica à ferramenta — a stack é lida de `$DATA_ORCHESTRATOR` no ENV.md.

## Objetivo

Criar, manter e depurar DAGs de forma confiável — garantindo que os pipelines executem no horário correto, com retry adequado, alertas configurados e troubleshooting documentado.

## Stack do Projeto

```bash
grep -E "^DATA_" $IDE/ENV.md
```

| Variável ENV | O que define |
|-------------|-------------|
| `DATA_ORCHESTRATOR` | Orquestrador (ex: airflow, prefect, dagster, glue-scheduler) |
| `DATA_ETL_TOOL` | Ferramenta ETL referenciada pelas tasks (ex: aws_glue, dbt, spark) |
| `DATA_REPO` | Repositório onde ficam os DAGs e scripts |
| `ALERTS_CHANNEL` | Canal Slack de alertas do projeto (genérico, compartilhado por todos os hubs) |

> Se `DATA_ORCHESTRATOR` não estiver definido, perguntar ao usuário antes de prosseguir.

---

## Referência por Orquestrador

Este skill adapta os exemplos ao `$DATA_ORCHESTRATOR` identificado no ENV.md:

| `DATA_ORCHESTRATOR` | UI de monitoramento | Unidade de agendamento | Unidade de execução |
|---------------------|--------------------|-----------------------|--------------------|
| `airflow` | Airflow Web UI / CLI | DAG | Task (Operator) |
| `prefect` | Prefect UI / CLI | Flow | Task |
| `dagster` | Dagster UI / CLI | Job | Op / Asset |
| `glue-scheduler` | AWS Console / CloudWatch | Trigger | Glue Job |

> Nos exemplos abaixo, os termos "DAG", "task" e "operador" se referem ao conceito equivalente no orquestrador do projeto.

---

## Fluxos de Trabalho

### Fluxo A — Criar DAG novo

#### 1. Definir estrutura do DAG

Antes de escrever código, confirmar:

| Informação | Pergunta |
|---|---|
| Nome do pipeline | Qual o nome? (ex: `bronze_pedidos_erp`, `silver_clientes`) |
| Schedule | Qual a frequência? (ex: diária 06h, horária, sob demanda) |
| Dependências | Depende de outro DAG? (ex: silver só roda após bronze) |
| Owner | Qual o responsável? (email) |
| Canal de alerta | Para onde vai o alerta de falha? (`$ALERTS_CHANNEL`) |
| SLA | Até quando precisa terminar? |

#### 2. Estrutura padrão de DAG (Airflow)

```python
"""
DAG: {nome_pipeline}
Descrição: {o que faz}
Schedule: {cron ou @daily}
Owner: {email}
SLA: {horário limite}
"""
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator

DEFAULT_ARGS = {
    'owner': '{owner_email}',
    'depends_on_past': False,
    'start_date': datetime(2026, 1, 1),
    'email': ['{owner_email}'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=15),
    'sla': timedelta(hours=2),   # alerta se task não terminar em 2h
}

with DAG(
    dag_id='{nome_pipeline}',
    default_args=DEFAULT_ARGS,
    description='{descrição}',
    schedule_interval='0 6 * * *',  # diário às 06h UTC
    catchup=False,                  # não reprocessar histórico ao ativar
    tags=['{camada}', '{dominio}'],
) as dag:

    extract_task = PythonOperator(
        task_id='extract',
        python_callable=extract,
        op_kwargs={'data_referencia': '{{ ds }}'},  # data de execução do DAG
    )

    load_task = PythonOperator(
        task_id='load_bronze',
        python_callable=load_bronze,
        op_kwargs={'data_referencia': '{{ ds }}'},
    )

    # Dependência: extract → load
    extract_task >> load_task
```

#### 3. Equivalente Prefect

```python
from prefect import flow, task
from prefect.schedules import CronSchedule
from datetime import timedelta

@task(retries=2, retry_delay_seconds=900)
def extract(data_referencia: str):
    ...

@task(retries=2, retry_delay_seconds=900)
def load_bronze(data_referencia: str):
    ...

@flow(
    name="{nome_pipeline}",
    description="{descrição}",
)
def pipeline_flow(data_referencia: str = None):
    raw = extract(data_referencia)
    load_bronze(data_referencia)
```

#### 4. Equivalente Dagster

```python
from dagster import job, op, schedule, OpExecutionContext

@op
def extract_op(context: OpExecutionContext):
    data_referencia = context.op_config.get('data_referencia')
    context.log.info(f"Extraindo {data_referencia}")
    ...

@op
def load_bronze_op(context: OpExecutionContext, raw_data):
    ...

@job
def bronze_pipeline():
    load_bronze_op(extract_op())

@schedule(
    cron_schedule="0 6 * * *",
    job=bronze_pipeline,
    execution_timezone="UTC",
)
def bronze_pipeline_schedule(_context):
    return {}
```

---

### Fluxo B — Configurar Retry Strategy

Regras de retry por criticidade do pipeline:

| Camada | Retries | Retry delay | Quando usar |
|--------|---------|-------------|-------------|
| Bronze (ingestão) | 3 | 15 min | Fonte pode ter instabilidade temporária |
| Silver (transformação) | 2 | 5 min | Falha raramente é transiente |
| Gold (modelagem) | 1 | 5 min | Falha geralmente é de dado ou lógica |
| Alertas / notificações | 1 | 1 min | Falha de alerta não deve bloquear pipeline |

**Regra para `retry_exponential_backoff`** (Airflow):

```python
DEFAULT_ARGS = {
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
    'retry_exponential_backoff': True,   # 5m → 10m → 20m
    'max_retry_delay': timedelta(hours=1),
}
```

**Quando NÃO usar retry**:
- ❌ Falha de schema (dado estruturalmente inválido) — retry não resolve
- ❌ Credencial inválida — retry não resolve, precisa de intervenção humana
- ✅ Timeout de rede, fonte temporariamente indisponível, lock de banco

---

### Fluxo C — Configurar Alertas

#### Alerta de falha de task (Airflow + Slack)

```python
from airflow.providers.slack.operators.slack_webhook import SlackWebhookOperator

def alert_on_failure(context):
    """Callback de alerta para falha de task."""
    dag_id = context['dag'].dag_id
    task_id = context['task_instance'].task_id
    execution_date = context['execution_date'].strftime('%Y-%m-%d')
    log_url = context['task_instance'].log_url

    message = (
        f":red_circle: *Pipeline falhou*\n"
        f"• DAG: `{dag_id}`\n"
        f"• Task: `{task_id}`\n"
        f"• Data: `{execution_date}`\n"
        f"• Logs: {log_url}"
    )

    SlackWebhookOperator(
        task_id='slack_alert',
        slack_webhook_conn_id='slack_data_alerts',
        message=message,
    ).execute(context)


DEFAULT_ARGS = {
    'on_failure_callback': alert_on_failure,
    ...
}
```

> Se `ALERTS_CHANNEL` estiver definido no ENV.md, usar esse canal.
> Para Prefect e Dagster, adaptar usando seus mecanismos nativos de notificação (automations / sensors).

#### SLA Miss (Airflow)

```python
def sla_miss_callback(dag, task_list, blocking_task_list, slas, blocking_tis):
    """Callback quando o SLA não é cumprido."""
    message = f":warning: *SLA Miss* no DAG `{dag.dag_id}` — tasks atrasadas: {task_list}"
    # enviar para $ALERTS_CHANNEL

with DAG(
    ...
    sla_miss_callback=sla_miss_callback,
) as dag:
    task = PythonOperator(
        ...
        sla=timedelta(hours=2),
    )
```

---

### Fluxo D — Monitorar Execução

#### Verificações rápidas por orquestrador

**Airflow CLI:**
```bash
# Ver estado de todas as runs do DAG nas últimas N execuções
airflow dags state <dag_id> <execution_date>

# Ver tasks de uma run específica
airflow tasks states-for-dag-run <dag_id> <execution_date>

# Listar DAGs com falha
airflow dags list-runs --dag-id <dag_id> --state failed --limit 10

# Ver logs de uma task
airflow tasks logs <dag_id> <task_id> <execution_date>
```

**Consulta SQL na tabela de auditoria** (se `gold.pipeline_audit` existir):

```sql
-- Ver status das últimas execuções
SELECT
  pipeline,
  data_referencia,
  status,
  rows_extracted,
  rows_loaded,
  duration_seconds,
  ingested_at
FROM gold.pipeline_audit
WHERE pipeline = '<nome_pipeline>'
ORDER BY data_referencia DESC, ingested_at DESC
LIMIT 20;

-- Identificar pipelines com falha recorrente
SELECT
  pipeline,
  COUNT(*) AS total_runs,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_runs,
  ROUND(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS failure_rate_pct
FROM gold.pipeline_audit
WHERE ingested_at >= CURRENT_DATE - INTERVAL '30' DAY
GROUP BY pipeline
HAVING failure_rate_pct > 10
ORDER BY failure_rate_pct DESC;
```

---

### Fluxo E — Troubleshooting de DAG

#### Árvore de diagnóstico

```
DAG não aparece na UI
    └─ Verificar: erro de sintaxe no arquivo Python
       └─ airflow dags list 2>&1 | grep <dag_id>
       └─ airflow dags report (Airflow 2+)

Task ficou em estado QUEUED
    └─ Worker disponível? → verificar número de workers ativos
    └─ Pool com slots livres? → airflow pools list

Task falhou com timeout
    └─ Aumentar execution_timeout na task
    └─ Verificar se fonte externa está lenta

Task falhou com erro de credencial
    └─ Verificar Connection no Airflow (Admin → Connections)
    └─ Credencial expirou? → renovar via Secrets Manager

Task falhou mas não ativou alerta
    └─ Verificar callback on_failure_callback está configurado
    └─ Verificar Connection do Slack está válida
```

#### Reprocessamento manual

```bash
# Limpar e re-executar tasks de uma data específica (Airflow)
airflow tasks clear <dag_id> \
  --start-date <YYYY-MM-DD> \
  --end-date <YYYY-MM-DD> \
  --yes

# Reexecutar o DAG a partir de uma data (backfill)
airflow dags backfill <dag_id> \
  --start-date <YYYY-MM-DD> \
  --end-date <YYYY-MM-DD>
```

> ⚠️ Usar `backfill` com `catchup=False` configurado pode não ter o efeito esperado.
> Verificar a configuração do DAG antes de reprocessar histórico.

---

## Boas Práticas

### Estrutura de repositório

```
$DATA_REPO/
  dags/
    bronze/          ← DAGs de ingestão bruta
    silver/          ← DAGs de transformação
    gold/            ← DAGs de modelagem e agregação
  jobs/
    bronze/          ← scripts Python chamados pelas tasks
    silver/
    gold/
  plugins/           ← operadores e hooks customizados (se necessário)
  tests/
    dags/            ← testes de integridade dos DAGs
```

### Regras de nomenclatura de DAGs

```
{camada}_{dominio}_{entidade}

Exemplos válidos:
  bronze_erp_pedidos
  silver_vendas_clientes
  gold_insights_pedidos_por_cliente
```

### Checklist antes de ativar um DAG novo

```
[ ] DAG testado localmente (airflow dags test <dag_id> <execution_date>)
[ ] catchup=False configurado (evita backfill automático ao ativar)
[ ] start_date no passado (nunca usar datetime.now() como start_date)
[ ] retries e retry_delay configurados
[ ] on_failure_callback configurado com alerta no $ALERTS_CHANNEL
[ ] sla configurado para tasks críticas
[ ] Tags adicionadas (camada + domínio)
[ ] DAG file commitado em $DATA_REPO
```

---

## Regras Críticas

### Nunca faça

- ❌ Usar `datetime.now()` como `start_date` — o Airflow precisa de data fixa no passado
- ❌ Ativar DAG sem `catchup=False` quando não quer backfill
- ❌ Hardcodar credenciais no DAG — usar Connections ou Secrets Manager
- ❌ `depends_on_past=True` sem entender o impacto (bloqueia se run anterior falhar)
- ❌ Silenciar exceções dentro de tasks — o Airflow não marcará como falha

### Sempre faça

- ✅ Testar DAG localmente antes de subir para produção
- ✅ Configurar `on_failure_callback` em todos os DAGs que afetam gold
- ✅ Usar `{{ ds }}` (data de execução do DAG) em vez de `datetime.now()` dentro das tasks
- ✅ Nomear tasks de forma descritiva (não `task_1`, `task_2`)
- ✅ Versionar DAGs no `$DATA_REPO` — nunca editar direto na UI
- ✅ Documentar dependências entre DAGs no doc do pipeline
