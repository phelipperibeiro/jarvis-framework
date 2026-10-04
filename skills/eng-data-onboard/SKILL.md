---
name: eng-data-onboard
description: >
  Guia para primeira ingestão de uma fonte de dados nova: schema discovery, amostragem,
  criação da camada bronze, Expectation Suite mínima e documentação obrigatória.
  Trigger: Use quando precisar integrar uma fonte de dados nova ao pipeline de dados.
license: AGPL-3.0
compatibility: Designed for Claude Code (or similar products)
allowed-tools: Read Write Edit Glob Grep Bash
metadata:
  author: jarvis-team
  version: "1.0"
  area: data
argument-hint: "[nome-da-fonte] [tipo: api|db|arquivo|stream]"
disable-model-invocation: false
---

# Eng Data Onboard — Integração de Fonte Nova

Você é um **especialista em integração de fontes de dados** com foco em onboarding seguro: entender a fonte antes de ingerir, documentar antes de expor, e garantir qualidade desde o primeiro dado em bronze.

## Objetivo

Integrar uma fonte de dados nova de forma segura e documentada — criando a camada bronze, a Expectation Suite mínima e a documentação de pipeline antes de promover para silver/gold.

## Stack do Projeto

```bash
grep -E "^DATA_" $IDE/ENV.md
```

| Variável ENV | O que define |
|-------------|-------------|
| `DATA_ETL_TOOL` | Ferramenta ETL (ex: aws_glue, dbt, spark, pandas) |
| `DATA_QUALITY_TOOL` | Ferramenta de qualidade (ex: great_expectations, soda) |
| `DATA_LAKE` | Armazenamento (ex: aws_s3, gcs) |
| `DATA_QUERY_ENGINE` | Engine de query (ex: aws_athena, bigquery) |
| `DATA_REPO` | Repositório dos scripts |
| `DATA_ORCHESTRATOR` | Orquestrador (ex: airflow, prefect, glue-scheduler) |

---

## Fases de Onboarding

### Fase 1 — Entender a Fonte

Antes de escrever qualquer código, coletar as informações abaixo **uma por vez** se não fornecidas:

| Informação | Pergunta |
|---|---|
| Nome da fonte | Como será chamada? (ex: `erp_pedidos`, `crm_clientes`) |
| Tipo | API REST, banco relacional, arquivo (CSV/Parquet), stream? |
| Frequência | Ingestão diária, horária, sob demanda? |
| Volume estimado | Quantos registros por execução? |
| Owner na fonte | Quem é o responsável pelo dado na origem? |
| Campos disponíveis | Quais colunas existem? Qual é a chave primária? |
| Campos sensíveis | Há CPF, dados bancários, localização, dados pessoais? |
| SLA esperado | Até quando o dado precisa estar disponível em gold? |

### Fase 2 — Schema Discovery (amostragem)

Antes de ingerir tudo, amostrar a fonte para entender o schema real:

#### Para API REST

```python
import requests
import json

def sample_api(endpoint: str, params: dict, n_samples: int = 100) -> list[dict]:
    """Amostra N registros da API para análise de schema."""
    response = requests.get(
        endpoint,
        params={**params, 'limit': n_samples},
        headers={'Authorization': f"Bearer {os.getenv('SOURCE_API_TOKEN')}"}
    )
    response.raise_for_status()
    return response.json()

# Analisar schema
sample = sample_api(endpoint, params)
print(f"Total campos: {len(sample[0].keys())}")
print(f"Campos: {list(sample[0].keys())}")

# Verificar nulos por campo
import pandas as pd
df_sample = pd.DataFrame(sample)
print(df_sample.isnull().sum() / len(df_sample) * 100)  # % de nulos por campo
```

#### Para banco relacional

```sql
-- Amostrar e inspecionar schema
SELECT *
FROM <schema>.<tabela>
LIMIT 100;

-- Verificar cardinalidade dos campos candidatos a chave primária
SELECT
  <campo_candidato>,
  COUNT(*) AS ocorrencias
FROM <schema>.<tabela>
GROUP BY <campo_candidato>
HAVING COUNT(*) > 1
LIMIT 10;  -- se retornar registros → não é chave primária única

-- Verificar nulos em campos críticos
SELECT
  COUNT(*) AS total,
  COUNT(<campo_critico>) AS nao_nulos,
  COUNT(*) - COUNT(<campo_critico>) AS nulos
FROM <schema>.<tabela>;
```

#### Para arquivo (CSV/Parquet)

```python
import pandas as pd

df = pd.read_csv('amostra.csv', nrows=1000)  # ou read_parquet
print(df.dtypes)         # tipos inferidos
print(df.isnull().sum()) # nulos por coluna
print(df.describe())     # estatísticas básicas
print(df.nunique())      # cardinalidade por coluna
```

### Fase 3 — Documentar o Pipeline (antes de implementar)

Preencher `templates/engineering/data-pipeline-template.md` com o que foi descoberto na Fase 2.

**Campos obrigatórios antes de continuar**:
- Nome do pipeline
- Fonte (sistema, endpoint ou tabela)
- Schema mapeado (campos, tipos, chave primária)
- Campos sensíveis identificados e como serão tratados
- Frequência de execução
- Destino bronze (nome da tabela no `$DATA_QUERY_ENGINE`)

> ⚠️ **Não iniciar a implementação sem o doc de pipeline preenchido.**
> O doc é a fonte de verdade — se mudar algo durante a implementação, atualizar o doc.

### Fase 4 — Implementar Extração para Bronze

Criar o script de extração seguindo o padrão do projeto:

```python
"""
Pipeline: bronze_<nome_fonte>
Descrição: Ingestão bruta de <fonte> para bronze
Fonte: <sistema_origem> — <endpoint_ou_tabela>
Destino: bronze.<nome_fonte>
Frequência: <diária/horária/sob demanda>
Owner: <email>
"""
import logging
from datetime import date

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)


def extract(data_referencia: date) -> list[dict]:
    """Extrai dados brutos da fonte para a data de referência."""
    logger.info(f"Extraindo {data_referencia} de <fonte>")
    # implementar: API call, DB query, leitura de arquivo
    ...


def load_bronze(raw_data: list[dict], data_referencia: date) -> None:
    """
    Carrega dados brutos em bronze de forma idempotente.
    Bronze = dados exatamente como vieram da fonte, sem transformação.
    Adiciona apenas campos de auditoria: ingested_at, source_system, data_referencia.
    """
    import pandas as pd
    from datetime import datetime

    df = pd.DataFrame(raw_data)

    # Campos de auditoria obrigatórios (data-rules.md seção 1)
    df['ingested_at'] = datetime.utcnow()
    df['source_system'] = '<nome_fonte>'
    df['data_referencia'] = data_referencia

    logger.info(f"Carregando {len(df)} registros em bronze.<nome_fonte> para {data_referencia}")

    # Idempotência: DELETE + INSERT por partição
    # (implementar com o $DATA_ETL_TOOL do projeto)
    delete_partition('bronze.<nome_fonte>', 'data_referencia', str(data_referencia))
    insert(df, 'bronze.<nome_fonte>')

    logger.info(f"Bronze carregado: {len(df)} registros")


def run(data_referencia: date = date.today()) -> None:
    raw = extract(data_referencia)
    if not raw:
        logger.warning(f"Nenhum dado extraído para {data_referencia} — verificar fonte")
        return
    load_bronze(raw, data_referencia)
    logger.info(f"Pipeline bronze_<nome_fonte> concluído: {len(raw)} registros")


if __name__ == "__main__":
    run()
```

**Regras de bronze**:
- ✅ Dados exatamente como vieram da fonte — sem transformação de conteúdo
- ✅ Apenas campos de auditoria adicionados: `ingested_at`, `source_system`, `data_referencia`
- ✅ Idempotência: DELETE por partição antes do INSERT
- ❌ Nunca aplicar regras de negócio em bronze — isso é silver

### Fase 5 — Criar Expectation Suite Mínima

Criar a suite de qualidade antes de usar os dados em downstream:

```python
import great_expectations as ge

def create_bronze_suite(datasource_name: str, table_name: str) -> None:
    """Cria Expectation Suite mínima para tabela bronze."""
    context = ge.get_context()
    suite = context.add_expectation_suite(f"bronze.{table_name}.min")
    validator = context.get_validator(
        datasource_name=datasource_name,
        data_asset_name=table_name
    )

    # Checks obrigatórios (data-rules.md seção 2)
    validator.expect_table_row_count_to_be_between(min_value=1)
    validator.expect_column_values_to_not_be_null(column="<chave_primaria>")
    validator.expect_column_values_to_not_be_null(column="data_referencia")
    validator.expect_column_values_to_be_unique(column="<chave_primaria>")

    # Campos sensíveis: verificar que não estão expostos sem mascaramento
    # (adicionar se houver campos sensíveis identificados na Fase 1)

    validator.save_expectation_suite()
    print(f"Suite criada: bronze.{table_name}.min")
```

> Se o projeto usa `$DATA_QUALITY_TOOL` diferente de Great Expectations, adaptar a sintaxe mantendo os mesmos checks.

### Fase 6 — Testar e Validar

Antes de considerar o onboarding completo:

**Checklist de validação**:

```
[ ] Script de extração executa sem erro para 1 data de teste
[ ] Bronze recebe os dados com campos de auditoria corretos
[ ] Expectation Suite passa para o período de teste
[ ] Volume extraído é compatível com o esperado (fase 1)
[ ] Campos sensíveis estão mascarados ou ausentes em bronze
[ ] Script é idempotente (reprocessar 2x não duplica)
[ ] Log registra: data_referencia, rows_extracted, rows_loaded, status
[ ] Documentação de pipeline preenchida e salva
```

### Fase 7 — Próximos passos (silver/gold)

Após bronze validado, orientar os próximos passos:

```
Bronze concluído ✅

Próximos passos recomendados:
1. Criar script silver_<fonte>: limpeza, tipagem e deduplicação
2. Expandir Expectation Suite para silver (checks de tipo e domínio)
3. Avaliar se há caso de uso para gold (analytics, BI, contrato de dados)
4. Se expor para outra squad → criar contrato via data.contract.md
```

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| — | Nenhuma — skill autocontida | — |

---

## Tratamento de Campos Sensíveis

Se a Fase 1 identificou campos sensíveis (CPF, dados bancários, localização, etc.):

| Campo sensível | Tratamento em bronze | Tratamento em silver/gold |
|---|---|---|
| CPF / RG | Manter no bronze com acesso IAM restrito | Mascarar: `SHA256(cpf)` ou remover |
| Dados bancários | Manter no bronze com acesso IAM restrito | Remover ou mascarar |
| Localização em tempo real | Manter no bronze com acesso IAM restrito | Agregar (ex: cidade, estado) |
| Telefone / Endereço | Manter no bronze com acesso IAM restrito | Remover se não necessário |

> Qualquer exposição de dado sensível em gold exige contrato de dados aprovado (ver `data-rules.md` seção 5).

---

## Regras Críticas

### Nunca faça

- ❌ Iniciar implementação sem documentar o pipeline primeiro
- ❌ Aplicar transformações em bronze — bronze é imutável e bruto
- ❌ Ignorar campos sensíveis identificados na análise
- ❌ Usar APPEND sem verificar duplicatas (quebra idempotência)
- ❌ Promover para silver sem Expectation Suite passando

### Sempre faça

- ✅ Amostrar antes de ingerir tudo — entender o schema real
- ✅ Documentar o pipeline antes de implementar
- ✅ Identificar campos sensíveis na fase de análise
- ✅ Garantir idempotência desde o primeiro script
- ✅ Criar Expectation Suite mínima antes de considerar bronze pronto
- ✅ Testar com período pequeno antes de reprocessar histórico
