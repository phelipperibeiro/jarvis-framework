# `/eng.daily-report` — o que foi feito nos últimos dias

Workflow: `workflows/engineering/eng.daily-report.md` · CLI: `jarvis daily-report --days N --json`

## Em uma frase

Junta os `daily.md` das sessões em um relatório por dia, do mais recente para o mais antigo, em lista aninhada (estilo mapa mental), e avisa quais sessões ficaram sem `daily.md`.

## O que é

O [`/eng.pr`](./eng.pr.md) grava, em cada sessão, um `daily.md` com a descrição detalhada do esforço e uma linha de timesheet, numa seção `## AAAA-MM-DD` por data. Cada `daily.md` fica isolado na sua sessão. Este comando lê todos eles e monta uma visão por dia:

- **por dia**: cada tarefa (com card e PR) > frentes de trabalho > detalhes, mais a linha de timesheet para copiar;
- **alertas**: as sessões sem `daily.md` que deveriam ter, com a atividade deduzida dos outros arquivos da sessão (`architecture.md`, `plan.md`, `pull-request.md`) e, quando há PR ou issue, do vendor.

## Quando usar

- Antes de uma reunião de acompanhamento ou de relatar o trabalho a alguém
- Para lançar horas: as linhas de timesheet aparecem prontas
- Para descobrir quais tarefas ficaram sem registro

## Quando **não** usar

- Para publicar o que foi implementado: isso é o [`/eng.spec-consolidate`](./eng.spec-consolidate.md)
- Para relatórios de equipe: o comando lê só as sessões do seu workspace

## Como funciona

1. `/eng.daily-report {N}`, com `N` = 1, 3, 7, 15, 30 ou 60 (padrão 7). A janela é do calendário local e inclui hoje (`1` = só hoje). Outro valor é recusado, sem gerar arquivo.
2. O CLI (`jarvis daily-report`) lê `$SESSIONS_DIR/eng/` e devolve a janela, os registros por dia e os alertas. O horário de início das sessões (`.timestamp_start`) é gravado em UTC e convertido para o dia local.
3. O comando completa os alertas pelo vendor (título e data do PR) e escreve o relatório.
4. O arquivo fica em `docs/jarvis/engineering/daily-reports/daily-report-AAAA-MM-DD-{N}d.md` (`$ENG_DOCS/daily-reports/`). A mesma janela no mesmo dia sobrescreve; janelas diferentes convivem.

### Quais sessões viram alerta

Só as sessões **sem** `daily.md` que chegaram ao `eng.pr` (têm `pull-request.md`) **ou** começaram a partir de **2026-10-15**, o dia em que o `daily.md` passou a existir. As anteriores nunca tiveram `daily.md` e não geram alerta, para o aviso não perder o valor.

A data de uma sessão sem `daily.md` vem, nesta ordem: data de criação do PR > `Criado em:` do `architecture.md` > `.timestamp_start` (no fuso local) > data de modificação da pasta (com aviso).

## Exemplo

```markdown
## 2026-10-17 (sábado)

- **#163 — ajustes pós-5.5.0 do ciclo eng.*** ([card](…), [PR #164](…))
  - Perguntas do ciclo
    - cada opção diz o que acontece; sem "Outros" listado
  - Modo workspace
    - WORKSPACE_MODE e regra de buscas
  - 🕒 `#163 — Revisão das perguntas e saídas do ciclo eng.* …`
```

## Regras que importam

- O relatório é **privado**: fica fora do versionamento e nunca é publicado (nem no Central docs, nem no card)
- Sem e-mails, tokens ou valores de variáveis
- Só lê: os `daily.md` e as sessões não mudam
- A síntese usa só o que está no `daily.md` (e no PR/issue, para os alertas); a linha de timesheet entra literal

## Próximo passo típico

Para cada alerta, rode o `/eng.pr` da sessão (passo do `daily.md`) e gere o relatório de novo.
