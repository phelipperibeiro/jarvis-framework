---
# Card ou número de controle da tarefa (TASK_MANAGER do ENV.md; freelance = número de controle).
task_key: {TASK-123}

# Data em que a investigação foi feita (YYYY-MM-DD).
created_at: {YYYY-MM-DD}

# O que o usuário passou ao /eng.debug: chave ou URL do card, mensagem de erro, stack trace ou descrição.
entrada: {entrada}

# Veredito da investigação (skill eng-global-investigation). Opções: confirmado | provável | inconclusivo
veredito: {confirmado | provável | inconclusivo}

# Etapas usadas do orçamento pela urgência do context.md (alta 5 | normal 10 | baixa 15).
orcamento: {usadas}/{teto}
---

# Investigação: {título curto do bug}

> Relatório do `/eng.debug` (caso investigar). Fica na sessão; nada daqui é publicado no card.

## Sintoma

{O que acontece, o que era esperado e em que condição. Ambiente (local, staging, produção), frequência (sempre, às vezes, uma vez) e mudança recente, se houver.}

**Reprodução:**

1. {passo}
2. {passo}

{Se não foi reproduzido: o que falta para reproduzir.}

## Código lido

| Arquivo:linha | O que faz | O que chamou atenção |
|---------------|-----------|----------------------|
| `{caminho}:{linha}` | {papel no fluxo} | {observação} |

**Fluxo lido:** {entrada} → {camada} → {dependências}

## Hipóteses

| # | Hipótese | Evidência (trecho lido) | Como confirmar ou descartar | Situação |
|---|----------|-------------------------|-----------------------------|----------|
| 1 | {causa provável e por quê} | `{arquivo}:{linha}` | {verificação} | {confirmada \| descartada \| aberta} |

## Evidências

{O que foi verificado e o resultado: leitura, reprodução, logs ou métricas (produção só leitura). Inclua o caminho do sintoma até a origem, quando houver.}

## Veredito

**{confirmado | provável | inconclusivo}** — {causa em uma ou duas frases}

{Passe crítico: o que poderia derrubar esta conclusão e por que ela se mantém (ou por que foi rebaixada).}

## Correção proposta

**Preferida:** {mudança, arquivos e componentes afetados}

**Alternativas** (se houver): {alternativa e trade-off}

**Risco:** {regressão, migração, performance, segurança}

## Teste de regressão

{Teste que reproduz o bug: deve falhar antes da correção e passar depois, cobrindo o caso específico que causou o bug. Descrito aqui e escrito no `/eng.work`, no framework de testes do projeto.}

## Plano de validação

- **Antes do deploy:** {testes do fluxo afetado}
- **Em staging:** {passos de reprodução}
- **Depois do deploy:** {logs, métricas e alertas a observar}

## Critério de resolvido

Comportamento esperado confirmado nos passos de reprodução e sem nova ocorrência por **{24h (P0) | 48h (P1) | 1 semana (P2)}**.

## Débitos e melhorias

Cards prontos para o usuário abrir no board (o comando não abre card):

### {título do card}

- **Tipo:** {Bug | Task | Security}
- **Prioridade:** {P0 | P1 | P2 | P3}
- **Localização:** `{arquivo}:{linha}`
- **Comportamento atual:** {…}
- **Comportamento esperado:** {…}
- **Ambiente:** {…}
- **Vinculado a:** {TASK-123}

## Próximo passo

{`/eng.work {TASK-123}` (correção trivial: um arquivo, sem alternativa) | `/eng.plan {TASK-123}` (alternativas ou risco; o `architecture.md` curto foi gravado na sessão) | coletar mais dados: {quais}}
