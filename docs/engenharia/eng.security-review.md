# `/eng.security-review` — review de segurança em PR

Workflow: `workflows/engineering/eng.security-review.md` · Agente: `SENTINEL` (`eng.cybersecurity.agent`) · Regras: `rules/engineering/eng-security-rules.md`

## Em uma frase

Revisa a segurança de um PR ou MR que toca áreas sensíveis e dá um veredito antes do merge.

## O que é

É o gate de segurança que complementa a revisão de código normal. Analisa **o diff completo** (não só os arquivos marcados como sensíveis) e dá feedback com correção sugerida para cada achado.

## Quando usar

- O PR mexe em autenticação, autorização, sessões, permissões ou papéis (RBAC, guards)
- O PR adiciona ou altera endpoints públicos
- O PR processa input de usuário (formulários, uploads, parsing)
- O PR altera CORS, CSP ou headers
- O PR adiciona dependências novas
- O PR toca em dados sensíveis (PII, financeiro)
- O Tech Lead pede a revisão

## Quando **não** usar

- Revisão geral de código → [`eng.review`](./eng.review.md)
- Auditoria de um projeto inteiro → [`eng.security-audit`](./eng.security-audit.md)

## Como usar

```
/eng.security-review [referencia-do-pr]
```

A referência pode ser o número do PR (`#123`), a URL do PR ou MR, ou a branch.

## Como funciona

| Fase | O que acontece |
|---|---|
| 1. Escopo | Lista os arquivos alterados, filtra os sensíveis e classifica o **risco do PR** |
| 2. Análise | Checklist de segurança por área: auth e sessões, inputs e validação, APIs e endpoints, configs e headers, dependências e dados sensíveis |
| 2.5. Multi-voto | Para cada achado, três revisores independentes votam se ele é real e explorável neste PR |
| 3. Veredito | Aprova, pede mudanças ou bloqueia |
| 4. Documentação | Registra a decisão e escreve o `security-findings.json` |

### Risco do PR

Alto: mexe em auth, guard ou sessão; adiciona endpoint público; altera CORS, CSP ou headers; altera papéis e permissões; toca dados sensíveis. Médio: processa input do usuário ou adiciona dependência. Baixo: refactoring sem mudança de API.

### Como os votos decidem

| Resultado | Critério | O que acontece |
|---|---|---|
| Confirmado | 2 ou mais de 3 votos `confirmed` | Entra no relatório |
| Falso positivo | 2 ou mais de 3 votos `rejected` | Descartado |
| Inconcluso | Votos divergentes | Entra marcado `[REVISAR]` para um humano |

### O veredito

| Veredito | Critério |
|---|---|
| **APPROVED** | Nenhum achado alto ou crítico |
| **CHANGES REQUESTED** | Achados médios ou altos corrigíveis |
| **BLOCKED** | Achado crítico, ou alto que não se corrige de forma simples: bloqueia o merge e escala para o Tech Lead |

## Regras que importam

- **Nunca** aprova PR com achado crítico sem correção, nem bloqueia sem evidência técnica
- Considera o contexto: um endpoint interno tem risco diferente de um público
- Comunica achados críticos ao Tech Lead na hora
- Verifica se mudanças em auth trouxeram testes de segurança

## Próximo passo típico

Aplicar as correções e voltar ao [`eng.pre-pr`](./eng.pre-pr.md) ou ao [`eng.pr`](./eng.pr.md). PRs que tocam áreas sensíveis levam o label `security`.
