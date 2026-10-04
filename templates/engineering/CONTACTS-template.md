 Contatos Importantes

> Lista de pessoas-chave do time e quando procurá-las.

 Membros do Time

> Esta seção é atualizada automaticamente quando alguém executa `/jarvis-init`.

| Nome | Cargo | Área | Hub | Email |
|------|-------|------|-----|-------|
<!-- MEMBERS_START -->
<!-- MEMBERS_END -->

 Liderança

| Nome | Cargo | Responsabilidade | Quando Procurar | Contato |
|------|-------|------------------|-----------------|---------|
| [Nome] | Tech Lead | Decisões técnicas, arquitetura | Dúvidas de design, bloqueios técnicos | @slack |
| [Nome] | Product Owner | Requisitos, priorização | Dúvidas sobre features, escopo | @slack |
| [Nome] | Engineering Manager | Processos, carreira | :s, feedback, processos | @slack |
| [Nome] | QA Lead | Qualidade, testes | Estratégia de testes, bugs críticos | @slack |

 Especialistas

| Área | Nome | Quando Procurar |
|------|------|-----------------|
| Backend | [Nome] | APIs, performance, banco de dados |
| Frontend | [Nome] | UI/UX, componentes, estado |
| DevOps | [Nome] | CI/CD, infraestrutura, deploy |
| Segurança | [Nome] | Vulnerabilidades, autenticação |
| Data | [Nome] | Analytics, relatórios, BI |

 Canais de Comunicação

 Chat (`$MESSAGE_COMUNICATOR`)

| Canal | Propósito |
|-------|-----------|
| `squad-{nome}` | Comunicação geral do squad |
| `squad-{nome}-dev` | Discussões técnicas |
| `squad-{nome}-alerts` | Alertas de produção |
| `engineering` | Engenharia geral |
| `help-devops` | Suporte de infraestrutura |

 Reuniões Recorrentes

| Reunião | Frequência | Horário | Participantes |
|---------|------------|---------|---------------|
| Daily | Diária | : | Todo o squad |
| Planning | Quinzenal | Segunda : | Todo o squad |
| Retro | Quinzenal | Sexta : | Todo o squad |
| Tech Review | Semanal | Quarta : | Engenharia |
| : com EM | Quinzenal | A definir | Você + EM |

 Escalação

 Problemas Técnicos

```
. Tentar resolver sozinho (- min)
      
. Pedir ajuda no canal tech-{nome-do-squad}
      
. Escalar para Tech Lead
      
. Escalar para Specialist
      
. Escalar para Head of Tech

Recomendação: ler o playbook de tomada de decisões em tecnologia do time (wiki / docs internos)
```

 Incidentes em Produção

```
. Alertar no canal squad-{nome}-alerts
      
. Acionar pessoa de plantão (PagerDuty)
      
. Seguir runbook de incidentes
      
. Postmortem após resolução
```

 Acessos Necessários

 Checklist de Acessos

| Sistema | Responsável | Como Solicitar |
|---------|-------------|----------------|
| Controle de versão (`$VERSION_CONTROL`) | Tech Lead | Pedir no chat do time |
| Task manager (`$TASK_MANAGER`) | EM | Ticket / canal de acessos |
| Cloud console | DevOps | Ticket / canal de acessos |
| Observabilidade (`$OBSERVABILITY`) | DevOps | Pedir no canal de infra |
| Chat (`$MESSAGE_COMUNICATOR`) | EM | Pedir no chat do time |
| VPN | Infra | Ticket / canal de acessos |

 Credenciais de Desenvolvimento

| Recurso | Como Obter |
|---------|------------|
| Banco de dados (dev) | `.env.example` + pedir senha no chat do time |
| APIs externas (sandbox) | Documentação interna |
| Tokens de teste | Vault ou Password do time |

 Links Úteis

| Recurso | Link |
|---------|------|
| Board do squad | `{TASK_MANAGER_URL_BASE}` |
| Repositório | URL do `$VERSION_CONTROL` do projeto |
| Documentação | `$DOCS_FOLDER/` |
| Runbooks | `docs/runbooks/` |
| Postmortems | `docs/postmortems/` |
| Wiki | URL da wiki da organização |

 Dicas de Comunicação

. Seja específico - "Estou com erro X no arquivo Y" > "Não funciona"
. Mostre o que tentou - Demonstra esforço e ajuda a diagnosticar
. Use threads - Mantém o canal organizado
. Marque pessoas - Se precisar de alguém específico, @mencione
. Documente - Se a resposta pode ajudar outros, documente

 Primeiro Contato

Ao entrar no time, apresente-se no canal `squad-{nome}`:

```
Olá!  Sou [Nome], novo [Cargo] do squad.
Venho de [Experiência anterior].
Meus interesses são [X, Y, Z].
Podem me encontrar no chat do time ou [outro contato].
Animado para trabalhar com vocês!
```
