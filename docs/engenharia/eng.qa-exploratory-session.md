# `/eng.qa-exploratory-session` — sessão de teste exploratório

Workflow: `workflows/engineering/qa/eng.qa-exploratory-session.md` · Skill: `eng-qa-exploratory` · Regras: `rules/engineering/qa/eng.qa.exploratory-session-rules.md`

## Em uma frase

Conduz ou documenta uma sessão de teste exploratório estruturada: define o charter, monta um roteiro por risco, registra os achados e cria os cards de bug.

## O que é

Teste exploratório não segue um roteiro fixo, mas precisa de estrutura para render. O comando organiza a sessão em torno de um **charter** (o objetivo) e produz um documento de sessão em `.jarvis/sessions/qa/EXP-{YYYYMMDD}-{N}.md`.

## Quando usar

- Explorar uma feature nova ou uma área de risco
- Registrar achados de uma sessão que você já fez
- Transformar os achados em cards de bug

## Quando **não** usar

- Você quer automatizar um fluxo → [`eng.qa-e2e-test-generation`](./eng.qa-e2e-test-generation.md)
- Você quer a estratégia antes do código → [`eng.qa-refinement-entry`](./eng.qa-refinement-entry.md)

## Os três modos

Sem argumentos, a skill pergunta qual modo você quer:

| Modo | O que faz |
|---|---|
| `plan` | Coleta escopo, contexto, tempo e ambiente; analisa riscos, gera hipóteses priorizadas e cria o documento de sessão |
| `document` | Carrega uma sessão existente, coleta seus achados em linguagem natural, classifica a severidade, preenche o documento e aciona `eng-qa-bug-report` para bugs S1 a S4 |
| `report` | Processa o documento e cria todos os cards de bug de uma vez |

## Regras que importam

**Charter:** até 3 linhas, no formato "Explorar {área} para descobrir {informação ou risco} com foco em {dimensão de qualidade}". Um charter por sessão.

**Duração:**

| Tipo | Tempo |
|---|---|
| Rápida | 30 min |
| Padrão | 60 min |
| Profunda | 90 min |

Os primeiros 10 minutos são de preparação e não contam. Não se estende uma sessão além do tempo; se precisar, abre outra.

**Severidade dos bugs:**

| Nível | Significado |
|---|---|
| S1 | Sistema inutilizável, perda de dados, falha de segurança (reportar imediatamente e interromper a sessão) |
| S2 | Feature principal quebrada, sem alternativa |
| S3 | Funciona, mas de forma incorreta ou inconsistente |
| S4 | Problema de UI ou texto, funcional |
| S5 | Melhoria, não é bug (fica só no documento) |

Toda sessão termina registrando o que foi explorado, a severidade de cada achado e se o charter foi atingido (`completo`, `parcial` ou `bloqueado`).

## O que sai

- `.jarvis/sessions/qa/EXP-{ID}.md`: documento da sessão
- Um card no board para cada bug S1 a S4

## Próximo passo típico

[`eng.qa-quality-report`](./eng.qa-quality-report.md) para consolidar as sessões do período
