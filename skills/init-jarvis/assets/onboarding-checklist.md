# Checklist de Onboarding

Este documento contém os checklists detalhados para o processo de onboarding de novos membros.

---

## Checklist de MCPs

- [ ] IDE detectada corretamente
- [ ] Caminho do arquivo MCP identificado (se for configurar)
- [ ] **Context7** instalado e respondendo (**obrigatório**)
- [ ] **Task manager MCP** (Jira/Linear/…) só se `TASK_MANAGER` estiver definido — **não bloqueante**
- [ ] **TestSprite** instalado e respondendo (opcional)
- [ ] Arquivo MCP configurado corretamente (quando aplicável)
- [ ] IDE reiniciada após configurar MCPs (quando aplicável)

> **Context7 é obrigatório.** Sem ele o `/init-jarvis` para e orienta a config. Task manager / Jira / Redis **não** bloqueiam. `TASK_MANAGER` vazio = freelance.

---

## Checklist de Ferramentas e Acessos

- [ ] **Repositório Git** - GitLab/GitHub/Bitbucket (conforme `VERSION_CONTROL`)
- [ ] **Task manager** - só se `TASK_MANAGER` estiver preenchido
- [ ] **Chat** - só se `MESSAGE_COMUNICATOR` estiver preenchido
- [ ] **Ambiente de Dev** - Credenciais e VPN (se o time usar)
- [ ] **Documentação** - Central docs / wiki (se houver)
- [ ] **CI/CD** - Pipeline de deploy (se houver)
- [ ] **Observabilidade** - Logs e métricas (se houver)

---

## Checklist por Período

### Dia 1 - Setup

- [ ] Ambiente de desenvolvimento configurado
- [ ] Projeto rodando localmente
- [ ] **Identidade definida** (`USER=` no ENV.md — sem login)
- [ ] **MCPs: Context7 obrigatório; task manager só se configurado (não bloqueia)**
- [ ] **AGENTS.md criado/atualizado na raiz do projeto**
- [ ] Acessos básicos liberados (Git; task manager se usar)
- [ ] Conhecer o time (daily/reunião) — se aplicável

### Semana 1 - Contexto

- [ ] Ler documentação principal (README, ARDs)
- [ ] Entender arquitetura geral
- [ ] Fazer primeira tarefa simples (bug fix ou small feature)
- [ ] Participar de code review

### Mês 1 - Autonomia

- [ ] Completar tarefa de média complexidade
- [ ] Fazer code review de outros
- [ ] Conhecer processos de deploy
- [ ] Entender métricas e observabilidade

---

## Checklist de Conclusão do Init

- [ ] `USER=` preenchido no ENV.md (sem login)
- [ ] IDE detectada corretamente
- [ ] ENV.md criado/verificado
- [ ] MCPs: Context7 OK; task manager checado sem bloquear (ou pulado se vazio)
- [ ] Ambiente de desenvolvimento configurado
- [ ] AGENTS.md criado na raiz do projeto
- [ ] Documentação principal apresentada
- [ ] Processos do time explicados
- [ ] Acessos verificados (quando existirem)
- [ ] Contatos apresentados (quando existirem)
- [ ] Checklist de onboarding entregue

---

## Contatos Importantes

| Papel | Responsabilidade | Quando Procurar |
|-------|------------------|-----------------|
| **Tech Lead** | Decisões técnicas | Dúvidas de arquitetura |
| **Product Owner** | Requisitos de negócio | Dúvidas sobre features |
| **DevOps** | Infraestrutura | Problemas de ambiente |
| **QA** | Qualidade | Dúvidas sobre testes |

---

## Documentos de Referência

| Documento | Propósito | Localização |
|-----------|-----------|------------|
| **README.md** | Visão geral, setup, como rodar | Raiz do projeto |
| **AGENTS.md** | Instruções para agentes de IA | Raiz do projeto |
| **docs/** | Documentação detalhada | `docs/` |

---

## Dicas para o Novo Membro

1. **Não tenha medo de perguntar** - Melhor perguntar do que assumir errado
2. **Documente suas dúvidas** - Pode virar documentação para próximos
3. **Faça pair programming** - Acelera o aprendizado
4. **Leia o código** - Entenda os padrões antes de criar novos
5. **Use os workflows** - `/eng.start`, `/eng.plan`, `/eng.work` são seus amigos
