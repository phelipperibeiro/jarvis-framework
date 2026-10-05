# `/eng.bug-audit` — auditoria de bugs e qualidade

Workflow: `workflows/engineering/eng.bug-audit.md` · Agente: `eng.bug-hunter`

## Em uma frase

Varre um projeto (ou parte dele) atrás de bugs latentes, code smells, lacunas de qualidade e débito técnico, e entrega um relatório priorizado com cards prontos.

## O que é

Enquanto o [`eng.debug`](./eng.debug.md) investiga **um** bug específico, este comando faz uma **auditoria sistemática**. Ele classifica cada problema, calcula a severidade e propõe prioridades para criar os cards.

## Quando usar

- Entrada em um projeto legado
- Revisão de qualidade depois de um incidente
- Avaliação periódica da saúde do código
- Preparação para um refactor grande ou antes de mudanças críticas

## Quando **não** usar

- Você tem um bug concreto para investigar → [`eng.debug`](./eng.debug.md)
- Você quer revisar um PR → [`eng.review`](./eng.review.md)

## Como usar

```
/eng.bug-audit [escopo]
```

O escopo pode ser uma pasta ou arquivo (`./src/components/`), um módulo (`auth-service`), o projeto todo (`--all`) ou uma tecnologia (`--tech=react`).

## Como funciona

| Fase | O que acontece |
|---|---|
| Pré-requisitos | Valida o `ENV.md` e define o escopo |
| 0. Contexto | Calibra o rigor pela urgência e pelo seu cargo |
| 1. Scoping | Entende o projeto, a stack e a cobertura de testes atual, e define o escopo final |
| 2. Scanning | Análise automatizada e manual guiada: bugs funcionais, code smells, lacunas de segurança, problemas de performance e débito técnico, mais análise da arquitetura |
| 3. Classificação | Categoriza cada problema e calcula a severidade (impacto × probabilidade × esforço de correção) |
| 4. Relatório | Gera o `bug-audit-report.md` na sessão e prepara os cards |

### Prioridades

| Prioridade | Critério |
|---|---|
| **P0** | Bug crítico ou de segurança com severidade alta: ação imediata |
| **P1** | Bug alto: próxima sprint |
| **P2** | Bug médio ou code smell: backlog |
| **P3** | Bug baixo ou débito técnico |

O relatório traz resumo executivo, problemas por prioridade, áreas de risco (sem testes, complexidade alta, dependências vulneráveis), recomendações de curto, médio e longo prazo e melhorias preventivas.

## Regras que importam

- Não supõe severidade sem análise, não cria card sem descrição adequada e não relata falso positivo sem validar
- Prioriza pelo impacto real no negócio e sempre sugere correção
- Não ignora problemas de segurança

## Próximo passo típico

[`eng.debug`](./eng.debug.md) para investigar um achado, [`eng.work`](./eng.work.md) para corrigir e [`eng.pr`](./eng.pr.md) para entregar
