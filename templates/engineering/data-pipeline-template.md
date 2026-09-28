# Pipeline: {{NOME_DO_PIPELINE}}

> **Versão:** 1.0 | **Owner:** {{EMAIL_OWNER}} | **Criado em:** {{DATA}}

---

## Metadados

| Campo | Valor |
|-------|-------|
| **Nome** | {{NOME_DO_PIPELINE}} |
| **Domínio** | {{DOMINIO}} (ex: vendas, clientes, financeiro, operacional) |
| **Camada destino** | `bronze` / `silver` / `gold` |
| **Owner** | {{EMAIL_OWNER}} |
| **Squad requisitante** | {{SQUAD}} (se aplicável) |
| **Criado em** | {{DATA}} |
| **Última atualização** | {{DATA}} |

---

## Descrição

> O que esse pipeline faz em 2-3 frases. Qual problema ele resolve? Quem consome os dados?

{{DESCRICAO}}

---

## Fonte de Dados

| Campo | Valor |
|-------|-------|
| **Sistema de origem** | {{SISTEMA}} (ex: MySQL, API externa, S3 bronze) |
| **Tabela / endpoint** | {{TABELA_OU_ENDPOINT}} |
| **Tipo de extração** | Full load / Incremental por `{{CAMPO_INCREMENTAL}}` |
| **Volume estimado** | {{VOLUME}} (ex: ~50k rows/dia) |
| **Owner dos dados de origem** | {{SQUAD_OWNER_FONTE}} |

---

## Destino

| Campo | Valor |
|-------|-------|
| **Tabela destino** | `{{CAMADA}}.{{NOME_TABELA}}` |
| **Localização S3** | `s3://YOUR-DATA-LAKE/{{CAMADA}}/{{DOMINIO}}/{{NOME_TABELA}}/` |
| **Particionamento** | `data_referencia=YYYY-MM-DD` |
| **Formato** | Parquet / CSV / JSON |

---

## Frequência e SLA

| Campo | Valor |
|-------|-------|
| **Frequência** | {{FREQUENCIA}} (ex: diário 06h, horário, sob demanda) |
| **SLA de entrega** | {{SLA}} (ex: dados disponíveis até 07h) |
| **Janela de reprocessamento** | {{JANELA}} (ex: últimos 7 dias) |
| **Orquestrador** | AWS Glue / Airflow DAG: `{{NOME_DAG}}` |

---

## Diagrama de Fluxo

```
{{SISTEMA_ORIGEM}}
       │
       ▼ (extração)
  bronze.{{NOME_TABELA_BRONZE}}
       │
       ▼ (limpeza / tipagem)
  silver.{{NOME_TABELA_SILVER}}
       │
       ▼ (modelagem / agregação)
  gold.{{NOME_TABELA_GOLD}}
       │
       ▼ (consumo)
  Metabase / Squad {{SQUAD_REQUISITANTE}}
```

---

## Schema de Entrada

> Schema da fonte de dados conforme extraído.

| Campo | Tipo | Nulável | Descrição |
|-------|------|---------|-----------|
| `{{campo}}` | `{{tipo}}` | Sim/Não | {{descricao}} |

---

## Schema de Saída

> Schema da tabela destino após transformação.

| Campo | Tipo | Nulável | Descrição |
|-------|------|---------|-----------|
| `id_{{entidade}}` | `string` | Não | Chave primária |
| `data_referencia` | `date` | Não | Data de referência da partição |
| `ingested_at` | `timestamp` | Não | Timestamp de ingestão |
| `source_system` | `string` | Não | Sistema de origem |
| `{{campo}}` | `{{tipo}}` | Sim/Não | {{descricao}} |

---

## Regras de Qualidade (Great Expectations)

| Check | Tipo | Configuração |
|-------|------|-------------|
| Volume mínimo | `row_count >= 1` | Bloqueia promoção se falhar |
| Nulos em PK | `id_{{entidade}} NOT NULL` | Bloqueia promoção |
| Nulos em `data_referencia` | `data_referencia NOT NULL` | Bloqueia promoção |
| Unicidade de PK | `id_{{entidade}} UNIQUE` | Bloqueia promoção |
| {{check_adicional}} | {{tipo}} | {{acao}} |

---

## Regras de Negócio

> Transformações e filtros aplicados além de limpeza/tipagem.

1. {{REGRA_1}}
2. {{REGRA_2}}

---

## Campos Sensíveis

| Campo | Tipo de dado sensível | Tratamento |
|-------|----------------------|-----------|
| {{campo}} | CPF / dados pessoais / localização | Mascarado em silver/gold |

> Se não houver campos sensíveis: N/A

---

## Dependências

| Dependência | Tipo | Observação |
|------------|------|-----------|
| `{{pipeline_upstream}}` | Pipeline upstream | Deve executar antes |
| `{{tabela_fonte}}` | Tabela de origem | Deve estar atualizada |

---

## Scripts

| Arquivo | Descrição |
|---------|-----------|
| `jobs/bronze/{{nome}}.py` | Extração e ingestão em bronze |
| `jobs/silver/{{nome}}.py` | Limpeza e promoção para silver |
| `jobs/gold/{{nome}}.py` | Modelagem e promoção para gold |
| `dags/{{nome_dag}}.py` | DAG Airflow de orquestração |
| `expectations/{{nome}}_suite.json` | Suite Great Expectations |

---

## Histórico de Mudanças

| Versão | Data | Autor | Descrição |
|--------|------|-------|-----------|
| 1.0 | {{DATA}} | {{AUTOR}} | Criação inicial |