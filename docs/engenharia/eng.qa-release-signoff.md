# `/eng.qa-release-signoff` — sign-off de QA antes do deploy

Workflow: `workflows/engineering/qa/eng.qa-release-signoff.md` · Template: `templates/engineering/qa/qa.release-signoff-template.md`

## Em uma frase

Verifica cobertura de testes e bugs abertos da branch e produz uma decisão **GO ou NO-GO** para o deploy.

## O que é

O aval de QA antes de publicar, registrado num documento com a decisão GO ou NO-GO.

## Quando usar

- Antes de um deploy para produção

## Quando **não** usar

- Você quer a validação de código antes do PR → [`eng.pre-pr`](./eng.pre-pr.md)

## Como funciona

Aceita o nome de uma branch (por padrão, a branch atual).

| Fase | O que acontece |
|---|---|
| 0 | Identifica a branch, as tasks incluídas no deploy e os arquivos alterados |
| 1 | **Verifica a cobertura** por domínio afetado: teste E2E, sessão exploratória e quality gate da spec |
| 2 | Busca **bugs abertos** ligados às tasks do deploy. Para cada um, você decide: é bloqueador, aceita com ressalva (com motivo) ou não tem relação |
| 3 | **Decisão** (você confirma antes de salvar) |
| 4 | Gera o documento de sign-off |

### A decisão

| Condição | Decisão |
|---|---|
| Cobertura crítica atendida e nenhum bug bloqueador | ✅ GO |
| Cobertura atendida, com bugs não bloqueadores documentados | ✅ GO com ressalvas |
| Cobertura crítica ausente **ou** bug bloqueador aberto | 🚫 NO-GO |

O frontmatter do documento **precisa** conter `status: GO` ou `status: NO-GO`: é a decisão registrada.

## O que sai

- `docs/engineering/qa/signoffs/signoff-{branch}-{YYYYMMDD}.md`

## Próximo passo típico

Fazer o deploy se for GO, ou corrigir o que bloqueou e repetir
