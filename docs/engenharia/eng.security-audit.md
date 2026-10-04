# `/eng.security-audit` — auditoria de segurança

Workflow: `workflows/engineering/eng.security-audit.md` · Agente: `SENTINEL` (`eng.cybersecurity.agent`) · Skill: `eng-security-cybersecurity`

## Em uma frase

Audita a segurança de um projeto de forma proativa (código, configurações, dependências e arquitetura) contra o OWASP Top 10 e a cadeia de suprimentos, e entrega achados classificados com evidência e correção.

## O que é

É a varredura completa de segurança. Ela trabalha em **modo estático**: lê código e configurações, mas **nunca executa, builda nem ataca** o alvo.

## Quando usar

- Auditoria periódica (por sprint ou release)
- Entrada em um projeto sem histórico de segurança
- Antes de lançar uma feature com superfície de ataque grande
- Depois de um incidente, para checar outros vetores
- Avaliação de compliance (LGPD, GDPR, PCI-DSS)

## Quando **não** usar

- Revisar um PR específico → [`eng.security-review`](./eng.security-review.md)
- Responder a uma CVE ou vazamento em andamento → [`eng.security-incident`](./eng.security-incident.md)
- Quer o fluxo completo encadeado → [`eng.security-pipeline`](./eng.security-pipeline.md)

## Como usar

```
/eng.security-audit [escopo]
```

O escopo pode ser uma pasta ou arquivo (`./src/auth/`), um módulo (`payment-service`), o projeto todo (`--all`) ou um foco (`--focus=owasp|secrets|supply-chain|headers|compliance`).

## Como funciona

| Fase | O que acontece |
|---|---|
| 0. Contexto | Herda o contexto se `ENABLE_CDD=true` |
| 0.5. Threat model | Se existir um `THREAT_MODEL.md`, usa os pontos de entrada e as ameaças ainda não mitigadas para guiar a busca |
| 1. Scoping | Mapeia a superfície de ataque (endpoints públicos, arquivos de auth, configurações de segurança) e prioriza |
| 2. Reconhecimento | Mapeia tecnologias, frameworks e dados sensíveis |
| 3. Análise | Verifica os vetores do OWASP Top 10 (acesso quebrado, injeção, configuração incorreta, componentes vulneráveis). Em projetos com mais de 15 arquivos, divide por área de foco em subagentes que só leem o código |
| 4. Supply chain | Lockfile commitado, `.npmrc` sem tokens, licenças problemáticas |
| 5. Classificação | Cada achado recebe severidade, CVSS estimado, vetor OWASP, arquivos, evidência, vetor de ataque, impacto e correção |
| 6. Relatório | Gera o relatório em Markdown, cria cards no board e escreve o `security-findings.json` |

### Prioridade das áreas

| Prioridade | Área |
|---|---|
| P0 | Auth, sessões e tokens |
| P1 | Inputs (formulários, APIs, uploads) |
| P2 | Dados sensíveis (PII, financeiro) |
| P3 | Dependências e configurações |
| P4 | Logs e monitoramento |

## Regras que importam

- **Nunca** executa exploits contra o sistema, minimiza severidade sem justificativa nem ignora um achado porque "provavelmente não será explorado"
- **Sempre mascara secrets** encontrados (`***`) antes de reportar
- Todo achado tem evidência e correção; achados críticos são comunicados na hora, sem esperar o relatório
- O `security-findings.json` é a entrada direta da skill `eng-security-triage`

## Próximo passo típico

Triage dos achados (skill `eng-security-triage`) e, depois, patches (`eng-security-patch`). O [`eng.security-pipeline`](./eng.security-pipeline.md) encadeia tudo isso.
