# `/eng.security-pipeline` — pipeline defensivo completo

Workflow: `workflows/engineering/eng.security-pipeline.md` · Agente: `SENTINEL` (`eng.cybersecurity.agent`)

## Em uma frase

Encadeia os quatro estágios de segurança (threat model, audit, triage e patch) em um fluxo guiado, para você não precisar lembrar a sequência de comandos.

## O que é

Um orquestrador. Ele detecta o que já foi feito, mostra um menu e executa os estágios que você escolher, **confirmando com você entre um e outro**.

## Quando usar

- Auditoria de segurança completa de um projeto ou feature
- Retomar um pipeline interrompido em outra sessão
- Onboarding de segurança em um projeto sem histórico de audit
- Quando você quer "auditar segurança", "fazer o pipeline completo" ou "fechar o loop"

## Quando **não** usar

- Só um PR → [`eng.security-review`](./eng.security-review.md)
- Um incidente em andamento → [`eng.security-incident`](./eng.security-incident.md)
- Só o audit, sem triage e patches → [`eng.security-audit`](./eng.security-audit.md)

## Como funciona

**Passo 0: detecta o estado.** Procura os artefatos em `.security/outputs/`:

| Artefato | Estágio já feito |
|---|---|
| `THREAT_MODEL.md` | 1 |
| `security-findings.json` | 2 |
| `triage.json` | 3 |
| `PATCHES/` com conteúdo | 4 |

**Passo 1: menu.** Você escolhe onde começar: completo (1 a 4), do audit em diante (2 a 4), do triage em diante (3 e 4), só patch (4) ou retomar de onde parou.

**Passo 2: estágios.**

| Estágio | O que faz | Saída |
|---|---|---|
| 1. Threat model (`eng-threat-model`) | Modelo de ameaças. Modos: derivar do código, entrevista com você, ou os dois em sequência | `THREAT_MODEL.md` |
| 2. Audit ([`eng.security-audit`](./eng.security-audit.md)) | Auditoria guiada pelo threat model, com o escopo que você escolher | `security-findings.json` e relatório |
| 3. Triage (`eng-security-triage`) | Remove duplicados, verifica cada achado com votos independentes e reordena por explorabilidade | `triage.json` |
| 4. Patch (`eng-security-patch`) | Gera diffs candidatos para os achados confirmados (todos, os N principais ou um específico) | `PATCHES/bug_NN/patch.diff` e `PATCHES.md` |

## Regras que importam

- **Não pula a confirmação entre estágios** sem um `--auto` explícito
- **Não gera patch sem triage**: patch de achado não verificado tem alta taxa de erro
- **Nunca aplica os diffs sozinho**: a saída é texto para revisão humana
- Para se nenhum achado sobreviver a um estágio (audit vazio ou triage sem confirmados)
- Sugere ignorar `.security/state/` no `.gitignore`

## Próximo passo típico

O Tech Lead revisa os diffs, aplica os aprovados com `git apply`, cria cards para os achados sem patch e faz o commit de `.security/outputs/`
