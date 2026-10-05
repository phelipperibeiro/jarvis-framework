# `/eng.qa-release-signoff` — sign-off de QA antes do deploy

Workflow: `workflows/engineering/qa/eng.qa-release-signoff.md` · Template: `templates/engineering/qa/qa.release-signoff-template.md`

## Em uma frase

Verifica cobertura de testes e bugs abertos da branch e produz uma decisão **GO ou NO-GO** para o deploy.

## O que é

O aval de QA antes de publicar. O documento gerado é validado pelo CI (`jarvis qa-signoff`), então ele serve também como trava automática nas branches de release.

## Quando usar

- Antes de um deploy para produção
- Quando o pipeline exige sign-off nas branches `main`, `master` ou `release/*`

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
| 5 | **Setup do CI, só na primeira vez** |

### A decisão

| Condição | Decisão |
|---|---|
| Cobertura crítica atendida e nenhum bug bloqueador | ✅ GO |
| Cobertura atendida, com bugs não bloqueadores documentados | ✅ GO com ressalvas |
| Cobertura crítica ausente **ou** bug bloqueador aberto | 🚫 NO-GO |

O frontmatter do documento **precisa** conter `status: GO` ou `status: NO-GO`, porque é o campo que o `jarvis qa-signoff` lê.

### Setup do CI

Se o pipeline ainda não tem o job de sign-off, o comando localiza o Tech Lead do squad em `members.md` e envia a ele, pelo comunicador configurado, o trecho de configuração para o `.gitlab-ci.yml`. Se não houver comunicador configurado, mostra o trecho para você enviar. A validade do sign-off é controlada por `QA_SIGNOFF_MAX_AGE` (em horas) e as branches exigidas por `QA_SIGNOFF_BRANCHES`, ambas no `ENV.md`.

## O que sai

- `docs/engineering/qa/signoffs/signoff-{branch}-{YYYYMMDD}.md`
- O trecho de CI, apenas na primeira execução

## Próximo passo típico

Fazer o deploy se for GO, ou corrigir o que bloqueou e repetir
