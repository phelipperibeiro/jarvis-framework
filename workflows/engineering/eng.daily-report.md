---
description: Junta os daily.md das sessões em um relatório por dia (mapa mental), com alertas das sessões sem daily.md
auto_execution_mode: 3
recommended_model: sonnet
model_tier: medium
model_justification: Leitura de poucos arquivos e síntese curta; a janela, as datas e os alertas já vêm prontos do CLI
---

# Relatório dos daily.md

Este comando junta o que foi feito nos últimos `N` dias, lendo os `daily.md` que o `/eng.pr` grava em cada sessão. O resultado é um relatório em markdown, do dia mais recente para o mais antigo, em lista aninhada (tarefa > frentes de trabalho > detalhes), com a linha de timesheet de cada tarefa e um bloco de **alertas** das sessões que deveriam ter `daily.md` e não têm.

> 🔒 **Privado**: o relatório reaproveita a narrativa e o timesheet pessoais do `daily.md`. Ele fica em `$ENG_DOCS/daily-reports/` (dentro de `docs/jarvis/`, fora do versionamento) e **nunca** é publicado: nem no Central docs, nem no card.

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| — | Nenhuma — workflow autocontido | — |

---

## Argumento

<arguments>
$ARGUMENTS
</arguments>

`{N}` é a janela em dias: **1, 3, 7, 15, 30 ou 60** (padrão **7**). A janela é do calendário local e inclui hoje: `1` = só hoje; `7` = hoje e os 6 dias anteriores.

---

## Passo 1: Ler as sessões

Rode o helper do CLI (ele lê o `ENV.md` do workspace, mesmo se você estiver dentro de um repositório filho):

```bash
jarvis daily-report --days {N} --json
```

- **Saída com erro** (código 1, por exemplo `N` inválido): mostre a mensagem, que já lista os valores aceitos, e **pare**. Não crie arquivo.
- **Saída JSON**: use os campos abaixo e não refaça as contas (janela, fuso, ordem e alertas já estão certos).

| Campo | O que é |
|---|---|
| `days`, `window.from`, `window.to`, `today` | Janela pedida, no calendário local |
| `sessionsScanned`, `sessionsInWindow` | Sessões lidas em `$SESSIONS_DIR/eng/` e quantas entram na janela |
| `byDate[]` | Um item por dia com registro, do mais recente para o mais antigo; em cada um, `tasks[]` com `key`, `taskKey`, `cardUrl`, `pr`, `description` e `timesheet` (seção `## AAAA-MM-DD` do `daily.md`) |
| `alerts[]` | Sessões sem `daily.md` que deveriam ter (chegaram ao `eng.pr` ou começaram a partir de 2026-10-15), com `date`, `dateSource`, `activity`, `issueKey`, `prNumber` |
| `warnings[]` | Avisos (por exemplo, data tirada da modificação da pasta) |
| `reportPath`, `reportPathAbs` | Onde escrever o relatório |

Os textos já vêm sem e-mails.

---

## Passo 2: Completar os alertas pelo vendor

Para cada item de `alerts` com `prNumber` ou `issueKey`, consulte o vendor de `VERSION_CONTROL`/`TASK_MANAGER` (no GitHub: `gh pr view {n} --json title,createdAt` e `gh issue view {n} --json title`):

- **Título:** use o do vendor quando `activity` vier vazia.
- **Data:** se houver PR, a data de criação dele (em fuso local) vale mais que a data local do helper. Se ela cair fora da janela, tire o alerta.
- Sem vendor, sem acesso ou com falha: siga com o que veio do helper, sem perguntar.
- Sem nenhuma fonte de atividade: escreva "não identificada", só com o ID da sessão.

---

## Passo 3: Escrever o relatório

Crie a pasta de `reportPathAbs`, se não existir, e escreva o arquivo. Se já existir um relatório com a mesma janela no mesmo dia, ele é **sobrescrito**. Janelas diferentes no mesmo dia convivem.

```markdown
# Daily report — {window.from} a {window.to} ({N} dias)

> Gerado em {AAAA-MM-DD HH:MM} · {sessionsScanned} sessões lidas · {sessionsInWindow} na janela · privado, não publicar

## ⚠️ Alertas: sessões sem daily.md

| Data | ID da sessão | Atividade | Status |
|---|---|---|---|
| {date} | {key} | {activity} ({issueKey}, PR {prNumber}) | sem daily.md{; data pela modificação da pasta, se dateSource = mtime} |

## {AAAA-MM-DD} ({dia da semana})

- **{taskKey} — {título curto}** ([card]({cardUrl}), [PR {n}]({url do PR}))
  - {frente de trabalho 1}
    - {detalhe}
  - {frente de trabalho 2}
    - {detalhe}
  - 🕒 `{timesheet}`
```

- **Alertas** vêm antes dos dias. Sem alertas, troque a tabela por "✅ Todas as sessões da janela têm `daily.md`."
- **Um bloco `##` por data de `byDate`, na mesma ordem** (decrescente). Dia sem registro não aparece.
- **Síntese por tarefa:** de 3 a 5 frentes de trabalho, cada uma com detalhes curtos, tirados **só** da `description` (contexto, o que foi feito, decisões; *post mortem* quando houver). Não acrescente fatos. O título curto vem da linha de timesheet ou do card.
- **Timesheet literal:** a linha `timesheet` entra sem alteração, para copiar.
- Links: `cardUrl` e o PR de `pr` (o campo traz `#n` e a URL). Faltando, omita o link.

---

## Passo 4: Mostrar o resultado

Mostre, em markdown:

```
✅ Relatório gerado: [{nome do arquivo}]({reportPath})

🗓️ Janela: {window.from} a {window.to} ({N} dias)
📚 Sessões: {sessionsScanned} lidas · {sessionsInWindow} na janela · {dias com registro} dias com registro
⚠️ Alertas: {quantidade} ({IDs}) — rode o /eng.pr nessas sessões (Fase 7.2) para gerar o daily.md
```

O link usa o caminho relativo ao workspace (`reportPath`).

---

## Regras

### ✅ Faça

- Use o JSON do `jarvis daily-report` como fonte da janela, das datas, da ordem e dos alertas
- Mantenha a linha de timesheet literal
- Sobrescreva o relatório da mesma janela no mesmo dia

### ⛔ Não faça

- Não publique o relatório (Central docs, card, PR) nem o copie para fora de `docs/jarvis/`
- Não inclua e-mails, tokens nem valores de variáveis do `ENV.md`
- Não acrescente fatos além do `daily.md` e do vendor
- Não altere os `daily.md` nem outros arquivos das sessões
- Não gere arquivo quando a janela for inválida
