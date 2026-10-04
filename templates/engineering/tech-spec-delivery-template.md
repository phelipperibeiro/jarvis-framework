# Tech Spec — Formatos de Entrega

> Template com os formatos usados no fim do `eng.build-tech-spec`: descrição da subtarefa no Jira, comentário na história original, mensagem de entrega e um exemplo preenchido, além do diagrama do fluxo. Substitua os placeholders `{...}`.

## Descrição da subtarefa no Jira

Fase 7.2 do workflow. Use este formato na descrição de cada subtarefa criada no Jira (ou entregue ao usuário para copiar e colar).

```markdown
## Descrição

{Descrição técnica detalhada}

## Arquivos a Modificar/Criar

- `path/to/file1.py` - [Modificação] - {Descrição}
- `path/to/file2.tsx` - [Criação] - {Descrição}

## Critérios de Aceitação

- [ ] {Critério 1}
- [ ] {Critério 2}

## Testes Requeridos

- [ ] Teste unitário: {descrição}
- [ ] Teste de integração: {descrição}

## Dependências

{SUBTASK-XXX / Nenhuma}

## Referência

Tech Spec: [Link para tech-spec.md]
```

## Comentário na história original

Fase 7.4 do workflow. Comentário a registrar na história (STORY-XXX) depois de criar as subtarefas.

```
Tech Spec criada: [Link para tech-spec.md]

Subtarefas criadas:
- SUBTASK-001: {Nome}
- SUBTASK-002: {Nome}
- SUBTASK-003: {Nome}
...

Total de subtarefas: {X}
Estimativa total: {Y horas}
```

## Mensagem de entrega

Fase 8.2 do workflow. O que entregar ao usuário ao final.

```
✅ Tech Spec criada com sucesso!

📄 Documento Local: $SESSIONS_DIR/eng/{feature-name}/tech-spec.md
📎 Anexada no Jira: {STORY-XXX}

📋 Resumo:
- História: {STORY-XXX} - {Título}
- Fases: {X fases}
- Subtarefas: {Y subtarefas}
- Estimativa total: {Z horas}

🔗 Subtarefas criadas no Jira:
- SUBTASK-001: {Nome} (P0, 6h)
- SUBTASK-002: {Nome} (P1, 4h)
- SUBTASK-003: {Nome} (P1, 8h)
...

⚠️ Riscos Principais:
- {Risco 1}
- {Risco 2}

📌 Próximos Passos Sugeridos:
1. Revisar e aprovar a Tech Spec
2. Atribuir subtarefas ao time
3. Iniciar desenvolvimento pela Fase 1
4. Monitorar progresso e atualizar plan.md
```

## Exemplo de output final

Exemplo preenchido da mensagem de entrega (fictício).

```markdown
✅ Tech Spec para STORY-456 criada com sucesso!

📄 **Documento Local**: $SESSIONS_DIR/eng/story-456/tech-spec.md
📎 **Anexado no Jira**: STORY-456

📊 **Resumo**:

- **História**: STORY-456 - Implementar autenticação de usuários
- **Fases**: 3 fases (Backend, Frontend, Testes)
- **Subtarefas**: 5 subtarefas
- **Estimativa total**: 26 horas

🔗 **Subtarefas criadas no Jira**:

- SUBTASK-101: [BACKEND] Criar endpoint POST /api/auth/register (P0, 6h)
- SUBTASK-102: [BACKEND] Criar endpoint POST /api/auth/login (P0, 6h)
- SUBTASK-103: [BACKEND] Criar endpoint POST /api/auth/logout (P1, 4h)
- SUBTASK-104: [FRONTEND] Criar tela de login integrada à API (P1, 6h)
- SUBTASK-105: [QA] Testes E2E do fluxo de autenticação (P2, 4h)

⚠️ **Riscos Principais**:

- JWT secret precisa estar em variável de ambiente
- Performance de bcrypt pode impactar tempo de login (mitigado com salt rounds = 10)

📐 **Decisões Arquiteturais**:

- Escolhido JWT em vez de sessões (stateless, escalável)
- Bcrypt para hash de senhas (padrão da indústria)
- Rate limiting em login (proteção contra brute force)

📌 **Próximos Passos**:

1. ✅ Revisar tech spec (aguardando sua aprovação)
2. Atribuir SUBTASK-101 a 103 para desenvolvedor backend
3. Atribuir SUBTASK-104 para desenvolvedor frontend
4. Iniciar pelo backend - SUBTASK-101 e 102
5. Configurar variáveis de ambiente em staging/prod

🎯 **Pronto para iniciar desenvolvimento!**
```

## Fluxo resumido

Visão geral do fluxo do workflow, do tipo de documento (épico ou história) até a entrega.

```
┌─────────────────────────────────────────────────────────┐
│ 0. DETECÇÃO DO TIPO                                     │
│    └─ Épico ou História? (inferir ou perguntar)        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 1. ENTENDIMENTO                                         │
│    └─ Ler card, fazer perguntas, validar contexto      │
└─────────────────────────────────────────────────────────┘
                          ↓
           ┌──────────────┴──────────────┐
           ▼                             ▼
   ┌───────────────┐             ┌───────────────┐
   │    ÉPICO      │             │   HISTÓRIA    │
   ├───────────────┤             ├───────────────┤
   │ 2A. Investig. │             │ 2B. Investig. │
   │    arquit.    │             │    codebase   │
   ├───────────────┤             ├───────────────┤
   │ 3A. Proposta  │             │ 2.5B. Compl.  │
   │    arquit.    │             ├───────────────┤
   ├───────────────┤             │ 3B. Proposta  │
   │ 4A. Doc       │             ├───────────────┤
   │ tech-spec-    │             │ 4B. Subtaref. │
   │ arch.md       │             ├───────────────┤
   └───────────────┘             │ 5B. Riscos    │
                                 ├───────────────┤
                                 │ 6B. Doc       │
                                 │ tech-spec.md  │
                                 ├───────────────┤
                                 │ 7B. $TASK_MGR │
                                 ├───────────────┤
                                 │ 8B. Entrega   │
                                 └───────────────┘
```

---

**Notas para o agente**:
- Este arquivo só traz formatos: o passo a passo continua em `workflows/engineering/eng.build-tech-spec.md`.
- Mantenha os placeholders `{...}` até ter os dados reais; não invente links, estimativas nem ids.
