# `/eng.security-incident` — resposta a incidente de segurança

Workflow: `workflows/engineering/eng.security-incident.md` · Agente: `SENTINEL` (`eng.cybersecurity.agent`)

## Em uma frase

Conduz a resposta a um incidente de segurança: classifica, avalia o impacto, contém, corrige e registra um post-mortem.

## O que é

Para quando existe um problema real ou provável: uma CVE que pode afetar o projeto, um secret vazado, uma vulnerabilidade reportada ou um acesso indevido. A ordem é **conter rápido**, depois corrigir de forma definitiva e documentar.

## Quando usar

- CVE crítica publicada que pode afetar as dependências
- Vulnerabilidade reportada por ferramenta de scan (SAST ou DAST)
- Secret vazado no repositório ou em produção
- Incidente reportado (acesso indevido, dados expostos)
- Alerta de dependência comprometida

## Quando **não** usar

- Auditoria proativa, sem incidente → [`eng.security-audit`](./eng.security-audit.md)
- Revisar um PR → [`eng.security-review`](./eng.security-review.md)
- Bug comum sem componente de segurança → [`eng.debug`](./eng.debug.md)

## Como usar

```
/eng.security-incident [referencia]
```

A referência pode ser um CVE (`CVE-2024-XXXXX`), a URL de um advisory, uma descrição ("SQL injection no endpoint /api/users") ou o card do board.

## Como funciona

| Fase | O que acontece |
|---|---|
| 1. Triage | Coleta informações e classifica a severidade por explorabilidade, impacto, dados afetados e superfície |
| 2. Assessment | Avalia se e como o projeto é afetado, com passos para CVE em dependência, vulnerabilidade no código e secret vazado |
| 3. Containment | Limita o impacto enquanto a correção definitiva é preparada |
| 4. Remediation | Implementa a correção, valida e documenta |
| 5. Post-mortem | Timeline, causa raiz, impacto, correção, prevenção e lições aprendidas |

### Prazos por severidade

| Severidade | Prazo | Ação imediata |
|---|---|---|
| **CRITICAL** | Conter em 1 hora, corrigir em 24 horas | Notificar TL/CTO e iniciar contenção |
| **HIGH** | Corrigir em 48 horas | Notificar o TL e planejar a correção |
| **MEDIUM** | Próxima sprint | Criar card e documentar |
| **LOW** | Backlog | Documentar |

### Contenção por tipo

| Tipo | Ação |
|---|---|
| Endpoint vulnerável | Desabilitar ou colocar um guard temporário |
| Secret vazado | **Revogar ou rotacionar imediatamente** |
| Dependência com CVE | Aplicar o patch, se houver |
| Auth bypass | Validação extra e, se preciso, revogar sessões ativas |
| Exposição de dados | Verificar logs de acesso e avaliar notificação (LGPD, 72 horas) |

## Regras que importam

- **Secret vazado se revoga primeiro**, antes de qualquer investigação
- Nunca minimiza o incidente ("provavelmente ninguém explorou") nem pula o post-mortem
- Nunca aplica correção sem testes de validação
- Não expõe detalhes do incidente em canais públicos antes da correção
- Verifica se a falha afeta outros serviços do projeto

## Próximo passo típico

[`eng.work`](./eng.work.md) para a correção definitiva (se ainda não fechou) e depois [`eng.pr`](./eng.pr.md)
