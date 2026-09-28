# Contrato de Dados: {{NOME_DO_CONTRATO}}

> **Versão:** 1.0 | **Owner:** {{EMAIL_OWNER}} | **Criado em:** {{DATA}}

---

## Identificação

| Campo | Valor |
|-------|-------|
| **Nome do contrato** | {{NOME_DO_CONTRATO}} |
| **Tabela / recurso** | `gold.{{NOME_TABELA}}` |
| **Squad dona dos dados** | DATA |
| **Squad requisitante** | {{SQUAD_REQUISITANTE}} |
| **Caso de uso** | {{CASO_DE_USO}} |
| **Status** | Ativo / Em revisão / Deprecado |
| **Criado em** | {{DATA}} |
| **Válido até** | {{DATA_EXPIRACAO}} (ou "Indeterminado") |

---

## Descrição

> O que esses dados representam? Qual o contexto de negócio?

{{DESCRICAO}}

---

## Como Acessar

| Método | Detalhe |
|--------|---------|
| **Athena** | `SELECT * FROM gold.{{NOME_TABELA}} WHERE data_referencia = '{{DATA}}'` |
| **S3** | `s3://YOUR-DATA-LAKE/gold/{{DOMINIO}}/{{NOME_TABELA}}/` |
| **Metabase** | Dashboard: [{{NOME_DASHBOARD}}]({{LINK_DASHBOARD}}) |
| **Acesso IAM** | Role necessária: `{{IAM_ROLE}}` |

> Solicitação de acesso: canal `$DATA_REQUESTS_CHANNEL` + card no task manager.

---

## SLA de Atualização

| Campo | Valor |
|-------|-------|
| **Frequência** | {{FREQUENCIA}} (ex: diário às 07h, horário) |
| **SLA de disponibilidade** | {{SLA}} (ex: dados do dia D disponíveis até 07h30 do dia D+1) |
| **Janela de reprocessamento** | {{JANELA}} (ex: últimos 7 dias sob solicitação) |
| **Pipeline que alimenta** | {{NOME_PIPELINE}} |

---

## Schema

| Campo | Tipo | Nulável | Sensível | Descrição |
|-------|------|---------|---------|-----------|
| `id_{{entidade}}` | `string` | Não | Não | Chave primária |
| `data_referencia` | `date` | Não | Não | Data de referência da partição |
| `ingested_at` | `timestamp` | Não | Não | Timestamp de ingestão |
| `{{campo}}` | `{{tipo}}` | Sim/Não | Sim/Não | {{descricao}} |

---

## Campos Sensíveis e Restrições

| Campo | Tipo de Dado Sensível | Tratamento Aplicado | Restrição de Uso |
|-------|----------------------|---------------------|-----------------|
| {{campo}} | CPF / dados pessoais | Mascarado (últimos 3 dígitos visíveis) | Não exibir em dashboards públicos |

> Se não houver campos sensíveis: N/A

---

## Definições de Negócio

> Glossário dos campos e métricas — o que significa cada coisa nesse contexto.

| Termo | Definição |
|-------|-----------|
| `{{campo}}` | {{definicao}} |

---

## Particionamento e Performance

| Coluna de partição | `data_referencia` |
|--------------------|------------------|
| **Volume estimado** | {{VOLUME}} (ex: ~100k rows/dia) |
| **Retenção** | {{RETENCAO}} (ex: 2 anos, indeterminado) |
| **Dica de query** | Sempre filtrar por `data_referencia` para evitar full scan |

```sql
-- Query recomendada (filtro por partição obrigatório)
SELECT *
FROM gold.{{NOME_TABELA}}
WHERE data_referencia BETWEEN '{{DATA_INICIO}}' AND '{{DATA_FIM}}'
```

---

## Qualidade Garantida

| Check | Frequência | Resultado esperado |
|-------|-----------|-------------------|
| Volume mínimo | A cada execução | ≥ 1 row |
| Nulos em PK | A cada execução | 0 nulos |
| Unicidade de PK | A cada execução | 0 duplicatas |
| {{check_negocio}} | {{frequencia}} | {{resultado}} |

---

## Casos de Uso Aprovados

| Squad | Caso de uso | Tipo de acesso |
|-------|------------|----------------|
| {{SQUAD}} | {{CASO_DE_USO}} | Athena / Metabase |

---

## Processo de Alteração

Qualquer alteração de schema (adição, remoção ou mudança de tipo de campo) deve:

1. Ser comunicada no canal `$DATA_REQUESTS_CHANNEL` com **7 dias de antecedência**
2. Ter nova versão do contrato criada (versionamento semântico: `MAJOR.MINOR`)
3. Período de coexistência: versão antiga disponível por **30 dias** após nova versão publicada

---

## Histórico de Versões

| Versão | Data | Autor | Descrição |
|--------|------|-------|-----------|
| 1.0 | {{DATA}} | {{AUTOR}} | Criação inicial |
